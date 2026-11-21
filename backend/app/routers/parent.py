from datetime import date as _date
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select, update
from sqlalchemy.orm import Session

from ..deps import get_db, require_roles
from ..models import Allergene, Eleve, MenuJour, Notification, Plat, Reservation, Transaction, User
from ..schemas.parent import (
    AllergiesRequest,
    EnfantOut,
    EnfantVerif,
    HistoriqueEnfant,
    JourMenu,
    NotificationOut,
    PaiementOut,
    PlatMenu,
    RattacherRequest,
    RechargeRequest,
    RepasOut,
    TransactionOut,
    WebhookRequest,
)
from ..services.eleve import _allergenes_par_plat, _ingredients_par_plat
from ..services.paiement import initier_recharge, valider_paiement

router = APIRouter(prefix="/parent", tags=["parent"])
parent_dep = require_roles("parent")


def _out(e: Eleve) -> EnfantOut:
    return EnfantOut(
        id=e.id,
        nom=e.nom,
        classe=e.classe,
        matricule=e.matricule,
        photo=e.photo,
        allergies=list(e.allergies or []),
        regime=e.regime,
        solde=e.solde,
        acces_actif=e.pin_hash is not None,
    )


def _enfant(db: Session, parent: User, eleve_id: int, lock: bool = False) -> Eleve:
    q = select(Eleve).where(Eleve.id == eleve_id, Eleve.parent_id == parent.id)
    e = db.execute(q.with_for_update() if lock else q).scalar_one_or_none()
    if e is None:
        raise HTTPException(status_code=404, detail="Enfant introuvable.")
    return e


@router.get("/enfants", response_model=list[EnfantOut])
def enfants(parent: User = Depends(parent_dep), db: Session = Depends(get_db)):
    rows = db.scalars(select(Eleve).where(Eleve.parent_id == parent.id).order_by(Eleve.nom)).all()
    return [_out(e) for e in rows]


@router.get("/enfants/verifier", response_model=EnfantVerif)
def verifier(matricule: str = Query(min_length=3), parent: User = Depends(parent_dep), db: Session = Depends(get_db)):
    e = db.scalars(select(Eleve).where(Eleve.matricule == matricule.strip().upper())).first()
    if e is None or (e.parent_id and e.parent_id != parent.id):
        raise HTTPException(status_code=404, detail="Matricule inconnu ou déjà rattaché.")
    return EnfantVerif(nom=e.nom, classe=e.classe)


@router.post("/enfants", response_model=EnfantOut, status_code=201)
def rattacher(body: RattacherRequest, parent: User = Depends(parent_dep), db: Session = Depends(get_db)):
    e = db.execute(
        select(Eleve).where(Eleve.matricule == body.matricule.strip().upper()).with_for_update()
    ).scalar_one_or_none()
    if e is None or (e.parent_id and e.parent_id != parent.id):
        raise HTTPException(status_code=409, detail="Matricule inconnu ou déjà rattaché.")
    e.parent_id = parent.id
    db.commit()
    return _out(e)


@router.get("/allergenes", response_model=list[str])
def allergenes(_: User = Depends(parent_dep), db: Session = Depends(get_db)):
    return list(db.scalars(select(Allergene.nom).order_by(Allergene.nom)))


@router.put("/enfants/{eleve_id}/allergies", response_model=EnfantOut)
def maj_allergies(eleve_id: int, body: AllergiesRequest, parent: User = Depends(parent_dep), db: Session = Depends(get_db)):
    e = _enfant(db, parent, eleve_id, lock=True)
    connus = set(db.scalars(select(Allergene.nom)))
    inconnus = [a for a in body.allergies if a not in connus]
    if inconnus:
        raise HTTPException(status_code=422, detail=f"Allergène inconnu : {inconnus[0]}.")
    e.allergies = sorted(set(body.allergies))
    e.regime = (body.regime or "").strip() or None
    db.commit()
    return _out(e)


@router.post("/enfants/{eleve_id}/acces", response_model=EnfantOut)
def activer_acces(eleve_id: int, parent: User = Depends(parent_dep), db: Session = Depends(get_db)):
    """Active (ou réinitialise) l'accès élève : il choisira son PIN à la prochaine connexion."""
    e = _enfant(db, parent, eleve_id, lock=True)
    e.pin_hash = None
    db.commit()
    return _out(e)


@router.post("/enfants/{eleve_id}/recharge", response_model=PaiementOut)
def recharger(eleve_id: int, body: RechargeRequest, parent: User = Depends(parent_dep), db: Session = Depends(get_db)):
    e = _enfant(db, parent, eleve_id)
    tx = initier_recharge(db, e, body.montant)
    db.commit()
    # Paiement simulé : l'agrégateur confirme aussitôt (équivalent du webhook).
    tx = valider_paiement(db, tx.reference_externe)
    db.commit()
    db.refresh(e)
    return PaiementOut(reference=tx.reference_externe, statut=tx.statut, montant=tx.montant, solde=e.solde)


@router.get("/enfants/{eleve_id}/historique", response_model=HistoriqueEnfant)
def historique(eleve_id: int, parent: User = Depends(parent_dep), db: Session = Depends(get_db)):
    e = _enfant(db, parent, eleve_id)
    rows = db.execute(
        select(Reservation, MenuJour, Plat)
        .join(MenuJour, MenuJour.id == Reservation.menu_jour_id)
        .join(Plat, Plat.id == MenuJour.plat_id)
        .where(Reservation.eleve_id == e.id)
        .order_by(desc(MenuJour.date), desc(Reservation.id))
        .limit(30)
    ).all()
    ids = list({p.id for _, _, p in rows})
    ings, algs = _ingredients_par_plat(db, ids), _allergenes_par_plat(db, ids)
    repas = [
        RepasOut(
            id=r.id,
            date=m.date,
            plat_nom=p.nom,
            ingredients=ings.get(p.id, []),
            allergenes=sorted({a for _, a in algs.get(p.id, [])}),
            tiers=r.tiers,
            prix=r.prix,
            statut=r.statut,
            servie_a=r.servie_a,
        )
        for r, m, p in rows
    ]
    txs = db.scalars(
        select(Transaction).where(Transaction.eleve_id == e.id).order_by(desc(Transaction.created_at)).limit(30)
    ).all()
    return HistoriqueEnfant(
        repas=repas,
        transactions=[
            TransactionOut(id=t.id, created_at=t.created_at, type=t.type, montant=t.montant, libelle=t.libelle, statut=t.statut)
            for t in txs
        ],
    )


@router.get("/menu", response_model=list[JourMenu])
def menu_semaine(debut: _date | None = None, _: User = Depends(parent_dep), db: Session = Depends(get_db)):
    aujourdhui = _date.today()
    lundi = debut or (aujourdhui - timedelta(days=aujourdhui.weekday()))
    rows = db.execute(
        select(MenuJour, Plat)
        .join(Plat, Plat.id == MenuJour.plat_id)
        .where(MenuJour.date >= lundi, MenuJour.date < lundi + timedelta(days=7))
        .order_by(MenuJour.date, MenuJour.type)
    ).all()
    ids = list({p.id for _, p in rows})
    ings, algs = _ingredients_par_plat(db, ids), _allergenes_par_plat(db, ids)
    jours: dict[_date, list[PlatMenu]] = {}
    for m, p in rows:
        jours.setdefault(m.date, []).append(
            PlatMenu(
                nom=p.nom,
                type=m.type,
                prix=m.prix,
                ingredients=ings.get(p.id, []),
                allergenes=sorted({a for _, a in algs.get(p.id, [])}),
                photo=p.photo,
            )
        )
    return [JourMenu(date=d, plats=pl) for d, pl in jours.items()]


@router.get("/notifications", response_model=list[NotificationOut])
def notifications(parent: User = Depends(parent_dep), db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Notification).where(Notification.parent_id == parent.id).order_by(desc(Notification.created_at)).limit(50)
    ).all()
    return [NotificationOut(id=n.id, message=n.message, lue=n.lue, created_at=n.created_at) for n in rows]


@router.post("/notifications/lues", status_code=204)
def marquer_lues(parent: User = Depends(parent_dep), db: Session = Depends(get_db)):
    db.execute(update(Notification).where(Notification.parent_id == parent.id).values(lue=True))
    db.commit()


paiements = APIRouter(prefix="/paiements", tags=["paiements"])


@paiements.post("/webhook", response_model=PaiementOut)
def webhook(body: WebhookRequest, db: Session = Depends(get_db)):
    """Appelé par l'agrégateur. Le statut est revérifié auprès de lui ; idempotent."""
    tx = valider_paiement(db, body.reference)
    db.commit()
    e = db.get(Eleve, tx.eleve_id)
    return PaiementOut(reference=tx.reference_externe, statut=tx.statut, montant=tx.montant, solde=e.solde)
