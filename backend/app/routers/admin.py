from datetime import date as _date
from datetime import time

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from ..deps import get_db, require_roles
from datetime import datetime

from ..models import (
    AffectationCuisine,
    Classe,
    ClasseTable,
    Creneau,
    Eleve,
    Niveau,
    Parametres,
    Place,
    Reservation,
    SuggestionPortion,
    TableSalle,
    User,
)
from ..services.service_cuisine import suggestion_out
from ..services.dashboard import tableau_de_bord
from ..services import scolarite
from ..services.statistiques import aujourdhui, stats_jour, stats_mois

router = APIRouter(prefix="/admin", tags=["admin"])
admin = require_roles("admin")


class ParametresIn(BaseModel):
    ouverture_commandes: time
    cloture_commandes: time
    decouvert_max: int = Field(ge=0, le=20000)
    heure_recreation: time = time(10, 0)  # ouverture du choix de la vague, le jour même


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
    return ParametresIn(
        ouverture_commandes=p.ouverture_commandes,
        cloture_commandes=p.cloture_commandes,
        decouvert_max=p.decouvert_max,
        heure_recreation=p.heure_recreation,
    )


@router.put("/parametres", response_model=ParametresIn)
def put_parametres(body: ParametresIn, _: User = Depends(admin), db: Session = Depends(get_db)):
    p = db.get(Parametres, 1)
    p.ouverture_commandes, p.cloture_commandes, p.decouvert_max, p.heure_recreation = (
        body.ouverture_commandes,
        body.cloture_commandes,
        body.decouvert_max,
        body.heure_recreation,
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
    if body.mode != n.mode:
        cuisiniers = db.scalars(select(AffectationCuisine.user_id).where(AffectationCuisine.niveau_id == n.id)).all()
        for uid in cuisiniers:
            autres = db.scalars(
                select(Niveau.mode)
                .join(AffectationCuisine, AffectationCuisine.niveau_id == Niveau.id)
                .where(AffectationCuisine.user_id == uid, Niveau.id != n.id)
            ).all()
            if any(m != body.mode for m in autres):
                raise HTTPException(status_code=409, detail="Un cuisinier affecté à ce niveau mélangerait les deux modes.")
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


# ---------- Suivi du jour et statistiques ----------


@router.get("/aujourdhui")
def suivi_du_jour(_: User = Depends(admin), db: Session = Depends(get_db)):
    """Journée réelle en cours uniquement (fuseau de l'établissement) : aucun paramètre de date."""
    return stats_jour(db, aujourdhui())


@router.get("/statistiques")
def statistiques(
    periode: str = Query("mois", pattern="^(jour|mois)$"),
    date: _date | None = None,
    mois: str | None = Query(None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    _: User = Depends(admin),
    db: Session = Depends(get_db),
):
    today = aujourdhui()
    if periode == "jour":
        return stats_jour(db, date or today)
    annee, m = (int(x) for x in mois.split("-")) if mois else (today.year, today.month)
    return stats_mois(db, annee, m)


# ---------- Scolarité : classes et élèves ----------


class ClasseIn(BaseModel):
    nom: str = Field(min_length=1, max_length=32)
    niveau_id: int


class EleveIn(BaseModel):
    matricule: str = Field(min_length=1, max_length=32)
    nom: str = Field(min_length=2, max_length=120)
    classe_id: int


@router.get("/scolarite/classes")
def scolarite_classes(_: User = Depends(admin), db: Session = Depends(get_db)):
    return scolarite.lister_classes(db)


@router.post("/scolarite/classes", status_code=201)
def scolarite_creer_classe(body: ClasseIn, _: User = Depends(admin), db: Session = Depends(get_db)):
    return scolarite.creer_classe(db, body.nom, body.niveau_id)


@router.put("/scolarite/classes/{classe_id}")
def scolarite_modifier_classe(classe_id: int, body: ClasseIn, _: User = Depends(admin), db: Session = Depends(get_db)):
    return scolarite.modifier_classe(db, classe_id, body.nom, body.niveau_id)


@router.get("/scolarite/eleves")
def scolarite_eleves(
    classe_id: int | None = None,
    q: str | None = Query(None, max_length=60),
    _: User = Depends(admin),
    db: Session = Depends(get_db),
):
    return scolarite.lister_eleves(db, classe_id, q)


@router.post("/scolarite/eleves", status_code=201)
def scolarite_creer_eleve(body: EleveIn, _: User = Depends(admin), db: Session = Depends(get_db)):
    return scolarite.creer_eleve(db, body.matricule, body.nom, body.classe_id)


@router.put("/scolarite/eleves/{eleve_id}")
def scolarite_modifier_eleve(eleve_id: int, body: EleveIn, _: User = Depends(admin), db: Session = Depends(get_db)):
    return scolarite.modifier_eleve(db, eleve_id, body.matricule, body.nom, body.classe_id)




# ---------- Cuisiniers : affectation aux niveaux (un seul mode par cuisinier) ----------


class AffectationIn(BaseModel):
    niveau_ids: list[int]


def _cuisinier_out(db: Session, u: User) -> dict:
    niveaux = db.scalars(
        select(Niveau).join(AffectationCuisine, AffectationCuisine.niveau_id == Niveau.id).where(AffectationCuisine.user_id == u.id)
    ).all()
    return {"id": u.id, "nom": u.nom, "identifiant": u.identifiant, "niveaux": [{"id": n.id, "nom": n.nom, "mode": n.mode} for n in niveaux]}


@router.get("/cuisiniers")
def cuisiniers(_: User = Depends(admin), db: Session = Depends(get_db)):
    return [_cuisinier_out(db, u) for u in db.scalars(select(User).where(User.role == "cuisine").order_by(User.nom))]


@router.put("/cuisiniers/{user_id}")
def affecter_cuisinier(user_id: int, body: AffectationIn, _: User = Depends(admin), db: Session = Depends(get_db)):
    u = db.get(User, user_id)
    if u is None or u.role != "cuisine":
        raise HTTPException(status_code=404, detail="Cuisinier introuvable.")
    niveaux = db.scalars(select(Niveau).where(Niveau.id.in_(body.niveau_ids))).all()
    if len(niveaux) != len(set(body.niveau_ids)):
        raise HTTPException(status_code=422, detail="Niveau inconnu.")
    if len({n.mode for n in niveaux}) > 1:
        raise HTTPException(status_code=409, detail="Un cuisinier ne peut pas travailler en mode classe et en mode commande à la fois.")
    db.execute(delete(AffectationCuisine).where(AffectationCuisine.user_id == u.id))
    for n in niveaux:
        db.add(AffectationCuisine(user_id=u.id, niveau_id=n.id))
    db.commit()
    return _cuisinier_out(db, u)


# ---------- Classes en mode classe : heure de passage et tables ----------


class PlacementIn(BaseModel):
    heure_passage: time | None = None
    table_ids: list[int] = []


def _classe_out(db: Session, c: Classe) -> dict:
    tables = db.scalars(select(ClasseTable.table_id).where(ClasseTable.classe_id == c.id)).all()
    effectif = db.scalar(select(func.count(Eleve.id)).where(Eleve.classe == c.nom)) or 0
    return {"id": c.id, "nom": c.nom, "heure_passage": c.heure_passage, "table_ids": list(tables), "effectif": effectif}


@router.get("/classes")
def classes_mode_classe(_: User = Depends(admin), db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Classe).join(Niveau, Niveau.id == Classe.niveau_id).where(Niveau.mode == "classe").order_by(Classe.heure_passage, Classe.nom)
    )
    return [_classe_out(db, c) for c in rows]


@router.put("/classes/{classe_id}")
def placer_classe(classe_id: int, body: PlacementIn, _: User = Depends(admin), db: Session = Depends(get_db)):
    c = db.get(Classe, classe_id)
    if c is None:
        raise HTTPException(status_code=404, detail="Classe introuvable.")
    if len(db.scalars(select(TableSalle.id).where(TableSalle.id.in_(body.table_ids))).all()) != len(set(body.table_ids)):
        raise HTTPException(status_code=422, detail="Table inconnue.")
    c.heure_passage = body.heure_passage
    db.execute(delete(ClasseTable).where(ClasseTable.classe_id == c.id))
    for tid in set(body.table_ids):
        db.add(ClasseTable(classe_id=c.id, table_id=tid))
    db.commit()
    return _classe_out(db, c)


# ---------- Suggestions de portion : validation humaine ----------


class DecisionIn(BaseModel):
    decision: str = Field(pattern="^(valider|refuser)$")


@router.get("/suggestions-portion")
def suggestions(_: User = Depends(admin), db: Session = Depends(get_db)):
    rows = db.execute(
        select(SuggestionPortion, Eleve)
        .join(Eleve, Eleve.id == SuggestionPortion.eleve_id)
        .where(SuggestionPortion.statut == "proposee")
        .order_by(SuggestionPortion.created_at)
    ).all()
    return [suggestion_out(s, e) for s, e in rows]


@router.post("/suggestions-portion/{sid}")
def decider(sid: int, body: DecisionIn, user: User = Depends(admin), db: Session = Depends(get_db)):
    s = db.execute(select(SuggestionPortion).where(SuggestionPortion.id == sid).with_for_update()).scalar_one_or_none()
    if s is None or s.statut != "proposee":
        raise HTTPException(status_code=404, detail="Suggestion déjà traitée ou introuvable.")
    e = db.get(Eleve, s.eleve_id)
    if body.decision == "valider":
        e.portion_defaut = s.portion_suggeree
        s.statut = "validee"
    else:
        s.statut = "refusee"
    s.traite_par, s.traite_a = user.id, datetime.now().astimezone()
    db.commit()
    return suggestion_out(s, e)
