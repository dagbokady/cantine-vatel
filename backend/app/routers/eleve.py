from datetime import date as _date
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..deps import get_current_eleve, get_db
from ..models import (
    Creneau,
    Eleve,
    MenuJour,
    Parametres,
    Place,
    Plat,
    Reservation,
    TableSalle,
    Transaction,
)
from ..schemas.eleve import (
    CreneauDispo,
    CreneauLite,
    CreneauxJourResponse,
    HistoriqueResponse,
    HistoriqueReservation,
    HistoriqueTransaction,
    MeResponse,
    MenuAVenir,
    MenuDuJourResponse,
    PlaceLite,
    PlaceSalle,
    ReservationCreate,
    ReservationCreated,
    ReservationDuJourResponse,
    SalleResponse,
    TableSalleLite,
    VagueChoix,
)
from ..services.eleve import options_menu_du_jour
from ..services.reservations import annuler_reservation, choisir_vague, creer_reservation, heure_limite, jour_de_commande
from ..services.tickets import ticket_pour

router = APIRouter(prefix="/eleve", tags=["eleve"])


@router.get("/me", response_model=MeResponse)
def me(eleve: Eleve = Depends(get_current_eleve)):
    return MeResponse(
        id=eleve.id,
        matricule=eleve.matricule,
        nom=eleve.nom,
        classe=eleve.classe,
        photo=eleve.photo,
        allergies=list(eleve.allergies or []),
        solde=eleve.solde,
    )


@router.get("/menu-du-jour", response_model=MenuDuJourResponse)
def menu_du_jour(
    eleve: Eleve = Depends(get_current_eleve),
    db: Session = Depends(get_db),
):
    """Menu commandable maintenant : aujourd'hui, ou demain à partir de l'ouverture de la veille."""
    params = db.get(Parametres, 1)
    jour, vague_ouverte = jour_de_commande(db, params, datetime.now())
    compatibles, incompatibles = options_menu_du_jour(db, eleve.allergies or [], jour or _date.today())
    return MenuDuJourResponse(
        date=jour or _date.today(),
        commandes_ouvertes=jour is not None,
        cloture_commandes=params.cloture_commandes,
        vague_ouverte=vague_ouverte,
        heure_recreation=params.heure_recreation,
        compatibles=compatibles,
        incompatibles=incompatibles,
    )


@router.get("/menus", response_model=list[MenuAVenir])
def menus_a_venir(
    eleve: Eleve = Depends(get_current_eleve),
    db: Session = Depends(get_db),
):
    """Menus communiqués à l'avance (consultation), filtrés selon les allergies de l'élève."""
    today = _date.today()
    jour_cmd, _ = jour_de_commande(db, db.get(Parametres, 1), datetime.now())
    dates = db.scalars(
        select(MenuJour.date).where(MenuJour.date >= today, MenuJour.date < today + timedelta(days=8)).distinct().order_by(MenuJour.date)
    ).all()
    out = []
    for d in dates:
        compatibles, incompatibles = options_menu_du_jour(db, eleve.allergies or [], d)
        out.append(MenuAVenir(date=d, commandable=d == jour_cmd, compatibles=compatibles, incompatibles=incompatibles))
    return out


@router.get("/creneaux", response_model=CreneauxJourResponse)
def creneaux(
    date: _date | None = Query(default=None),
    eleve: Eleve = Depends(get_current_eleve),
    db: Session = Depends(get_db),
):
    jour = date or _date.today()
    rows = db.execute(
        select(Creneau).where(Creneau.date == jour).order_by(Creneau.heure_debut)
    ).scalars().all()

    if not rows:
        return CreneauxJourResponse(date=jour, creneaux=[])

    occ_rows = db.execute(
        select(Reservation.creneau_id, func.count(Reservation.id))
        .where(
            Reservation.creneau_id.in_([c.id for c in rows]),
            Reservation.statut != "annulee",
        )
        .group_by(Reservation.creneau_id)
    ).all()
    occupe = {cid: n for cid, n in occ_rows}

    # Vagues dont l'heure limite (début moins délai de préparation) est passée : plus réservables.
    maintenant = datetime.now()
    if jour == maintenant.date():
        delai = db.get(Parametres, 1).delai_preparation_min
        rows = [c for c in rows if maintenant.time() < heure_limite(c.heure_debut, delai)]
    items = [
        CreneauDispo(
            id=c.id,
            heure_debut=c.heure_debut,
            heure_fin=c.heure_fin,
            capacite=c.capacite,
            places_restantes=max(c.capacite - occupe.get(c.id, 0), 0),
        )
        for c in rows
    ]
    return CreneauxJourResponse(date=jour, creneaux=items)


@router.get("/salle", response_model=SalleResponse)
def salle(
    creneau_id: int = Query(..., ge=1),
    eleve: Eleve = Depends(get_current_eleve),
    db: Session = Depends(get_db),
):
    creneau = db.get(Creneau, creneau_id)
    if creneau is None:
        return SalleResponse(creneau_id=creneau_id, largeur=0, hauteur=0, tables=[])

    tables = db.execute(select(TableSalle).order_by(TableSalle.nom)).scalars().all()
    places = db.execute(
        select(Place).order_by(Place.table_id, Place.numero)
    ).scalars().all()
    prises = db.execute(
        select(Reservation.place_id).where(
            Reservation.creneau_id == creneau.id,
            Reservation.statut != "annulee",
        )
    ).all()
    prises_set = {pid for (pid,) in prises}

    by_table: dict[int, list[Place]] = {}
    for p in places:
        by_table.setdefault(p.table_id, []).append(p)

    largeur = max((t.x for t in tables), default=0.0) + 160.0
    hauteur = max((t.y for t in tables), default=0.0) + 160.0

    return SalleResponse(
        creneau_id=creneau.id,
        largeur=largeur,
        hauteur=hauteur,
        tables=[
            TableSalleLite(
                id=t.id,
                nom=t.nom,
                x=t.x,
                y=t.y,
                nb_places=t.nb_places,
                places=[
                    PlaceSalle(
                        id=p.id,
                        numero=p.numero,
                        angle=p.angle,
                        etat="prise" if p.id in prises_set else "libre",
                    )
                    for p in by_table.get(t.id, [])
                ],
            )
            for t in tables
        ],
    )


def _sortie(reservation: Reservation, eleve: Eleve, db: Session) -> ReservationCreated:
    menu = db.get(MenuJour, reservation.menu_jour_id)
    # Pas de ticket tant que la vague n'est pas choisie : le comptoir n'aurait rien à vérifier.
    ticket = ticket_pour(reservation, eleve, menu.date) if reservation.creneau_id else None
    return ReservationCreated(
        id=reservation.id,
        menu_jour_id=reservation.menu_jour_id,
        creneau_id=reservation.creneau_id,
        place_id=reservation.place_id,
        tiers=reservation.tiers,
        prix=reservation.prix,
        statut=reservation.statut,
        ticket=ticket,
    )


def _place_prise() -> HTTPException:
    # Unicité d'une place sur un créneau : peut sauter juste avant le commit.
    return HTTPException(status_code=409, detail="Cette place vient d'être prise, choisis-en une autre.")


@router.post("/reservations", response_model=ReservationCreated, status_code=201)
def post_reservation(
    body: ReservationCreate,
    eleve: Eleve = Depends(get_current_eleve),
    db: Session = Depends(get_db),
):
    try:
        reservation = creer_reservation(
            db,
            eleve,
            menu_jour_id=body.menu_jour_id,
            creneau_id=body.creneau_id,
            place_id=body.place_id,
            tiers=body.tiers,
            now=datetime.now(),
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _place_prise()
    db.refresh(reservation)
    return _sortie(reservation, eleve, db)


@router.put("/reservations/{reservation_id}/vague", response_model=ReservationCreated)
def put_vague(
    reservation_id: int,
    body: VagueChoix,
    eleve: Eleve = Depends(get_current_eleve),
    db: Session = Depends(get_db),
):
    try:
        reservation = choisir_vague(db, eleve, reservation_id, body.creneau_id, body.place_id, datetime.now())
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _place_prise()
    db.refresh(reservation)
    return _sortie(reservation, eleve, db)


@router.get("/reservation-du-jour", response_model=ReservationDuJourResponse | None)
def reservation_du_jour(
    eleve: Eleve = Depends(get_current_eleve),
    db: Session = Depends(get_db),
):
    """Commande active du jour, ou à défaut celle du lendemain (passée la veille, sans vague)."""
    now = datetime.now()
    today = now.date()
    row = db.execute(
        select(Reservation, MenuJour, Plat, Creneau, Place, TableSalle)
        .join(MenuJour, MenuJour.id == Reservation.menu_jour_id)
        .join(Plat, Plat.id == MenuJour.plat_id)
        .outerjoin(Creneau, Creneau.id == Reservation.creneau_id)
        .outerjoin(Place, Place.id == Reservation.place_id)
        .outerjoin(TableSalle, TableSalle.id == Place.table_id)
        .where(Reservation.eleve_id == eleve.id, MenuJour.date >= today, Reservation.statut != "annulee")
        .order_by(MenuJour.date, desc(Reservation.id))
    ).first()
    if row is None:
        return None
    res, menu, plat, creneau, place, table = row
    params = db.get(Parametres, 1)
    jour_cmd, vague_ouverte = jour_de_commande(db, params, now)
    a_choisir = creneau is None
    return ReservationDuJourResponse(
        ticket=ticket_pour(res, eleve, menu.date) if creneau else None,
        annulable=res.statut == "commandee" and (menu.date > today or now.time() < params.cloture_commandes),
        cloture_commandes=params.cloture_commandes,
        id=res.id,
        date=menu.date,
        menu_jour_id=res.menu_jour_id,
        plat_nom=plat.nom,
        plat_photo=plat.photo,
        tiers=res.tiers,
        prix=res.prix,
        statut=res.statut,
        creneau=CreneauLite(id=creneau.id, heure_debut=creneau.heure_debut, heure_fin=creneau.heure_fin) if creneau else None,
        place=PlaceLite(id=place.id, table_nom=table.nom, numero=place.numero) if place else None,
        vague_a_choisir=a_choisir,
        choix_vague_ouvert=a_choisir and menu.date == today and jour_cmd == today and vague_ouverte,
        heure_recreation=params.heure_recreation,
    )


@router.get("/historique", response_model=HistoriqueResponse)
def historique(
    eleve: Eleve = Depends(get_current_eleve),
    db: Session = Depends(get_db),
):
    res_rows = db.execute(
        select(Reservation, MenuJour, Plat)
        .join(MenuJour, MenuJour.id == Reservation.menu_jour_id)
        .join(Plat, Plat.id == MenuJour.plat_id)
        .where(Reservation.eleve_id == eleve.id)
        .order_by(desc(Reservation.created_at))
        .limit(20)
    ).all()
    reservations = [
        HistoriqueReservation(
            id=r.id,
            date=m.date,
            plat_nom=p.nom,
            tiers=r.tiers,
            prix=r.prix,
            statut=r.statut,
        )
        for r, m, p in res_rows
    ]

    tx_rows = db.scalars(
        select(Transaction)
        .where(Transaction.eleve_id == eleve.id)
        .order_by(desc(Transaction.created_at))
        .limit(20)
    ).all()
    transactions = [
        HistoriqueTransaction(
            id=t.id,
            created_at=t.created_at,
            type=t.type,
            montant=t.montant,
            libelle=t.libelle,
        )
        for t in tx_rows
    ]
    return HistoriqueResponse(reservations=reservations, transactions=transactions)


@router.delete("/reservations/{reservation_id}", status_code=204)
def delete_reservation(
    reservation_id: int,
    eleve: Eleve = Depends(get_current_eleve),
    db: Session = Depends(get_db),
):
    annuler_reservation(db, eleve, reservation_id, datetime.now())
    db.commit()
