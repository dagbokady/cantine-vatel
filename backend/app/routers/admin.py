from datetime import date as _date
from datetime import time

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from ..deps import get_db, require_roles
from ..models import Creneau, Niveau, Parametres, Place, Reservation, TableSalle, User
from ..services.dashboard import tableau_de_bord

router = APIRouter(prefix="/admin", tags=["admin"])
admin = require_roles("admin")


class ParametresIn(BaseModel):
    ouverture_commandes: time
    cloture_commandes: time
    decouvert_max: int = Field(ge=0, le=20000)


class NiveauIn(BaseModel):
    mode: str = Field(pattern="^(classe|commande)$")


class CreneauIn(BaseModel):
    date: _date
    heure_debut: time
    heure_fin: time
    capacite: int = Field(ge=1, le=1000)


class TableIn(BaseModel):
    nom: str = Field(min_length=1, max_length=32)
    nb_places: int = Field(ge=1, le=12)


class PlaceIn(BaseModel):
    pmr: bool


@router.get("/parametres", response_model=ParametresIn)
def get_parametres(_: User = Depends(admin), db: Session = Depends(get_db)):
    p = db.get(Parametres, 1)
    return ParametresIn(ouverture_commandes=p.ouverture_commandes, cloture_commandes=p.cloture_commandes, decouvert_max=p.decouvert_max)


@router.put("/parametres", response_model=ParametresIn)
def put_parametres(body: ParametresIn, _: User = Depends(admin), db: Session = Depends(get_db)):
    p = db.get(Parametres, 1)
    p.ouverture_commandes, p.cloture_commandes, p.decouvert_max = (
        body.ouverture_commandes,
        body.cloture_commandes,
        body.decouvert_max,
    )
    db.commit()
    return body


@router.get("/niveaux")
def niveaux(_: User = Depends(admin), db: Session = Depends(get_db)):
    return [{"id": n.id, "nom": n.nom, "mode": n.mode} for n in db.scalars(select(Niveau).order_by(Niveau.id))]


@router.put("/niveaux/{niveau_id}")
def put_niveau(niveau_id: int, body: NiveauIn, _: User = Depends(admin), db: Session = Depends(get_db)):
    n = db.get(Niveau, niveau_id)
    if n is None:
        raise HTTPException(status_code=404, detail="Niveau introuvable.")
    n.mode = body.mode
    db.commit()
    return {"id": n.id, "nom": n.nom, "mode": n.mode}


def _creneau_out(c: Creneau, n: int) -> dict:
    return {"id": c.id, "date": c.date, "heure_debut": c.heure_debut, "heure_fin": c.heure_fin, "capacite": c.capacite, "commandes": n}


@router.get("/creneaux")
def creneaux(date: _date | None = None, _: User = Depends(admin), db: Session = Depends(get_db)):
    jour = date or _date.today()
    rows = db.execute(
        select(Creneau, func.count(Reservation.id))
        .outerjoin(Reservation, (Reservation.creneau_id == Creneau.id) & (Reservation.statut != "annulee"))
        .where(Creneau.date == jour)
        .group_by(Creneau.id)
        .order_by(Creneau.heure_debut)
    ).all()
    return [_creneau_out(c, n) for c, n in rows]


@router.post("/creneaux", status_code=201)
def creer_creneau(body: CreneauIn, _: User = Depends(admin), db: Session = Depends(get_db)):
    if body.heure_fin <= body.heure_debut:
        raise HTTPException(status_code=422, detail="L'heure de fin doit suivre l'heure de début.")
    if db.scalars(select(Creneau).where(Creneau.date == body.date, Creneau.heure_debut == body.heure_debut)).first():
        raise HTTPException(status_code=409, detail="Un créneau commence déjà à cette heure.")
    c = Creneau(**body.model_dump())
    db.add(c)
    db.commit()
    return _creneau_out(c, 0)


@router.put("/creneaux/{creneau_id}")
def maj_creneau(creneau_id: int, body: CreneauIn, _: User = Depends(admin), db: Session = Depends(get_db)):
    c = db.execute(select(Creneau).where(Creneau.id == creneau_id).with_for_update()).scalar_one_or_none()
    if c is None:
        raise HTTPException(status_code=404, detail="Créneau introuvable.")
    n = db.scalar(select(func.count(Reservation.id)).where(Reservation.creneau_id == c.id, Reservation.statut != "annulee"))
    if body.capacite < n:
        raise HTTPException(status_code=409, detail=f"Capacité inférieure aux {n} commandes déjà passées.")
    c.heure_debut, c.heure_fin, c.capacite = body.heure_debut, body.heure_fin, body.capacite
    db.commit()
    return _creneau_out(c, n)


@router.delete("/creneaux/{creneau_id}", status_code=204)
def supprimer_creneau(creneau_id: int, _: User = Depends(admin), db: Session = Depends(get_db)):
    if db.scalars(select(Reservation.id).where(Reservation.creneau_id == creneau_id)).first():
        raise HTTPException(status_code=409, detail="Des commandes existent sur ce créneau.")
    db.execute(delete(Creneau).where(Creneau.id == creneau_id))
    db.commit()


@router.get("/salle")
def salle(_: User = Depends(admin), db: Session = Depends(get_db)):
    tables = db.scalars(select(TableSalle).order_by(TableSalle.id)).all()
    places = db.scalars(select(Place).order_by(Place.table_id, Place.numero)).all()
    par_table: dict[int, list] = {}
    for p in places:
        par_table.setdefault(p.table_id, []).append({"id": p.id, "numero": p.numero, "pmr": p.pmr})
    return [{"id": t.id, "nom": t.nom, "places": par_table.get(t.id, [])} for t in tables]


@router.post("/tables", status_code=201)
def creer_table(body: TableIn, _: User = Depends(admin), db: Session = Depends(get_db)):
    if db.scalars(select(TableSalle).where(TableSalle.nom == body.nom)).first():
        raise HTTPException(status_code=409, detail="Ce nom de table existe déjà.")
    n = db.scalar(select(func.count(TableSalle.id))) or 0
    t = TableSalle(nom=body.nom, x=120.0 + (n % 4) * 160.0, y=120.0 + (n // 4) * 200.0, nb_places=body.nb_places)
    db.add(t)
    db.flush()
    for k in range(body.nb_places):
        db.add(Place(table_id=t.id, numero=k + 1, angle=360.0 / body.nb_places * k))
    db.commit()
    return {"id": t.id}


@router.delete("/tables/{table_id}", status_code=204)
def supprimer_table(table_id: int, _: User = Depends(admin), db: Session = Depends(get_db)):
    pids = list(db.scalars(select(Place.id).where(Place.table_id == table_id)))
    if pids and db.scalars(select(Reservation.id).where(Reservation.place_id.in_(pids))).first():
        raise HTTPException(status_code=409, detail="Des commandes utilisent cette table.")
    db.execute(delete(TableSalle).where(TableSalle.id == table_id))
    db.commit()


@router.put("/places/{place_id}")
def maj_place(place_id: int, body: PlaceIn, _: User = Depends(admin), db: Session = Depends(get_db)):
    p = db.get(Place, place_id)
    if p is None:
        raise HTTPException(status_code=404, detail="Place introuvable.")
    p.pmr = body.pmr
    db.commit()
    return {"id": p.id, "pmr": p.pmr}


@router.get("/dashboard")
def dashboard(date: _date | None = None, _: User = Depends(admin), db: Session = Depends(get_db)):
    return tableau_de_bord(db, date or _date.today())


