from datetime import date as _date
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from ..deps import get_current_eleve, get_db
from ..models import (
    Creneau,
    Eleve,
    MenuJour,
    Place,
    Plat,
    Reservation,
    TableSalle,
    Transaction,
)
from ..schemas.eleve import (
    CreneauLite,
    HistoriqueResponse,
    HistoriqueReservation,
    HistoriqueTransaction,
    MeResponse,
    MenuDuJourResponse,
    PlaceLite,
    ReservationDuJourResponse,
)
from ..services.eleve import commandes_ouvertes, options_menu_du_jour

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
    today = _date.today()
    ouvertes, params = commandes_ouvertes(db, datetime.now())
    compatibles, incompatibles = options_menu_du_jour(db, eleve.allergies or [], today)
    return MenuDuJourResponse(
        date=today,
        commandes_ouvertes=ouvertes,
        cloture_commandes=params.cloture_commandes,
        compatibles=compatibles,
        incompatibles=incompatibles,
    )


@router.get("/reservation-du-jour", response_model=ReservationDuJourResponse | None)
def reservation_du_jour(
    eleve: Eleve = Depends(get_current_eleve),
    db: Session = Depends(get_db),
):
    today = _date.today()
    row = db.execute(
        select(Reservation, MenuJour, Plat, Creneau, Place, TableSalle)
        .join(MenuJour, MenuJour.id == Reservation.menu_jour_id)
        .join(Plat, Plat.id == MenuJour.plat_id)
        .join(Creneau, Creneau.id == Reservation.creneau_id)
        .join(Place, Place.id == Reservation.place_id)
        .join(TableSalle, TableSalle.id == Place.table_id)
        .where(
            Reservation.eleve_id == eleve.id,
            MenuJour.date == today,
            Reservation.statut != "annulee",
        )
        .order_by(desc(Reservation.id))
    ).first()
    if row is None:
        return None
    res, _menu, plat, creneau, place, table = row
    return ReservationDuJourResponse(
        id=res.id,
        menu_jour_id=res.menu_jour_id,
        plat_nom=plat.nom,
        plat_photo=plat.photo,
        tiers=res.tiers,
        prix=res.prix,
        statut=res.statut,
        creneau=CreneauLite(
            id=creneau.id,
            heure_debut=creneau.heure_debut,
            heure_fin=creneau.heure_fin,
        ),
        place=PlaceLite(id=place.id, table_nom=table.nom, numero=place.numero),
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
