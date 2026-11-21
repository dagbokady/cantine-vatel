from datetime import date as _date
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..deps import get_db, require_roles
from ..models import Appel, Classe, Eleve, MenuJour, Plat, Presence, User
from ..services.eleve import _allergenes_par_plat
from ..services.notifications import notifier

router = APIRouter(prefix="/enseignant", tags=["enseignant"])
enseignant = require_roles("enseignant")


class AppelIn(BaseModel):
    absents: list[int] = []


def _classe(db: Session, user: User, classe_id: int) -> Classe:
    c = db.get(Classe, classe_id)
    if c is None or c.enseignant_id != user.id:
        raise HTTPException(status_code=404, detail="Classe introuvable.")
    return c


def _plats_du_jour(db: Session, jour: _date) -> tuple[Plat | None, Plat | None, set[str]]:
    rows = db.execute(
        select(MenuJour.type, Plat).join(Plat, Plat.id == MenuJour.plat_id).where(MenuJour.date == jour)
    ).all()
    principal = next((p for t, p in rows if t == "principal"), None)
    sans = next((p for t, p in rows if t == "sans_allergene"), None)
    algs = (
        {a for _, a in _allergenes_par_plat(db, [principal.id]).get(principal.id, [])} if principal else set()
    )
    return principal, sans, algs


@router.get("/classes")
def classes(user: User = Depends(enseignant), db: Session = Depends(get_db)):
    return [{"id": c.id, "nom": c.nom} for c in db.scalars(select(Classe).where(Classe.enseignant_id == user.id))]


@router.get("/classes/{classe_id}/appel")
def get_appel(classe_id: int, user: User = Depends(enseignant), db: Session = Depends(get_db)):
    c = _classe(db, user, classe_id)
    jour = _date.today()
    appel = db.scalars(select(Appel).where(Appel.classe_id == c.id, Appel.date == jour)).first()
    presents = (
        {p.eleve_id: p.present for p in db.scalars(select(Presence).where(Presence.appel_id == appel.id))}
        if appel
        else {}
    )
    _, _, algs = _plats_du_jour(db, jour)
    eleves = db.scalars(select(Eleve).where(Eleve.classe == c.nom).order_by(Eleve.nom)).all()
    return {
        "classe": c.nom,
        "date": jour,
        "valide_a": appel.valide_a if appel else None,
        "eleves": [
            {
                "id": e.id,
                "nom": e.nom,
                "photo": e.photo,
                "allergies": list(e.allergies or []),
                "sans_allergene": bool(algs & {a.lower() for a in e.allergies or []}),
                "present": presents.get(e.id),
            }
            for e in eleves
        ],
    }


@router.post("/classes/{classe_id}/appel")
def post_appel(classe_id: int, body: AppelIn, user: User = Depends(enseignant), db: Session = Depends(get_db)):
    c = _classe(db, user, classe_id)
    jour, now = _date.today(), datetime.now().astimezone()
    eleves = db.scalars(select(Eleve).where(Eleve.classe == c.nom)).all()
    absents = set(body.absents)
    appel = db.execute(
        select(Appel).where(Appel.classe_id == c.id, Appel.date == jour).with_for_update()
    ).scalar_one_or_none()
    if appel is None:
        appel = Appel(classe_id=c.id, date=jour, enseignant_id=user.id, valide_a=now)
        db.add(appel)
        db.flush()
    appel.valide_a = now
    avant = {p.eleve_id: p for p in db.scalars(select(Presence).where(Presence.appel_id == appel.id))}
    principal, sans, algs = _plats_du_jour(db, jour)
    for e in eleves:
        present = e.id not in absents
        p = avant.get(e.id)
        if p is not None and p.present == present:
            continue  # inchangé : pas de nouvelle notification
        if p is None:
            db.add(Presence(appel_id=appel.id, eleve_id=e.id, present=present))
        else:
            p.present = present
        prenom = e.nom.split()[0]
        if present:
            allergique = bool(algs & {a.lower() for a in e.allergies or []})
            plat = sans if allergique and sans else principal
            detail = f" : {plat.nom}" if plat else ""
            notifier(db, e, f"{prenom} a déjeuné à {now.strftime('%H h %M')}{detail}.")
        else:
            notifier(db, e, f"{prenom} est absent(e) de la cantine aujourd'hui.")
    db.commit()
    return get_appel(classe_id, user, db)
