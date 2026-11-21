import base64
import binascii
import uuid
from datetime import date as _date
from datetime import timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..deps import get_db, require_roles
from ..models import (
    Allergene,
    Eleve,
    Ingredient,
    IngredientAllergene,
    MenuJour,
    Parametres,
    Plat,
    PlatElement,
    PlatIngredient,
    Reservation,
    User,
)
from ..services.composition import allergenes_par_ingredient
from ..utils.prix import prix_portions
from ..services import service_cuisine as sc
from ..services.cuisine import fiche_cuisine, impact_allergenes
from ..services.eleve import _allergenes_par_plat, _ingredients_par_plat
from ..services.statistiques import _bornes_mois, aujourdhui, stats_cuisine

router = APIRouter(prefix="/cuisine", tags=["cuisine"])
cuisine = require_roles("cuisine", "admin")
# Les prix des portions relèvent des chefs de cuisine.
chef = require_roles("cuisine")
DOSSIER_PHOTOS = Path(__file__).resolve().parents[2] / "static" / "plats"


class IngredientIn(BaseModel):
    nom: str = Field(min_length=2, max_length=120)
    allergenes: list[str] = []


class PrixIn(BaseModel):
    prix: int = Field(ge=0, le=20000)  # portion 3/3
    prix_tiers1: int | None = Field(default=None, ge=0, le=20000)
    prix_tiers2: int | None = Field(default=None, ge=0, le=20000)


def _verifier_prix(body: PrixIn) -> None:
    p = prix_portions(body.prix, body.prix_tiers1, body.prix_tiers2)
    if not p[1] <= p[2] <= p[3]:
        raise HTTPException(status_code=422, detail="Les prix doivent croître avec la portion : 1/3 ≤ 2/3 ≤ 3/3.")


class ElementIn(BaseModel):
    id: int | None = None
    nom: str = Field(min_length=2, max_length=80)
    ingredient_id: int
    obligatoire: bool = False
    inclus_defaut: bool = True
    supplement: int = Field(default=0, ge=0, le=5000)
    stock_restant: int | None = Field(default=None, ge=0, le=5000)


class PlatIn(PrixIn):
    nom: str = Field(min_length=2, max_length=120)
    ingredient_ids: list[int] = Field(min_length=1)
    sans_allergene_de: int | None = None
    photo: str | None = None  # data URL (photo prise par la cantine)
    elements: list[ElementIn] = Field(default=[], max_length=20)


class MenuIn(BaseModel):
    date: _date
    plat_id: int
    type: str = Field(pattern="^(principal|sans_allergene|accompagnement)$")
    portions: int = Field(ge=1, le=2000)
    prix: int | None = Field(default=None, ge=0)


class MenuMaj(BaseModel):
    portions: int = Field(ge=0, le=2000)


class MenuPrixIn(PrixIn):
    pass


@router.get("/allergenes", response_model=list[str])
def allergenes(_: User = Depends(cuisine), db: Session = Depends(get_db)):
    return list(db.scalars(select(Allergene.nom).order_by(Allergene.nom)))


@router.get("/ingredients")
def ingredients(_: User = Depends(cuisine), db: Session = Depends(get_db)):
    rows = db.execute(
        select(Ingredient.id, Ingredient.nom, Allergene.nom)
        .outerjoin(IngredientAllergene, IngredientAllergene.ingredient_id == Ingredient.id)
        .outerjoin(Allergene, Allergene.id == IngredientAllergene.allergene_id)
        .order_by(Ingredient.nom)
    ).all()
    out: dict[int, dict] = {}
    for iid, nom, alg in rows:
        out.setdefault(iid, {"id": iid, "nom": nom, "allergenes": []})
        if alg:
            out[iid]["allergenes"].append(alg)
    return list(out.values())


@router.post("/ingredients", status_code=201)
def creer_ingredient(body: IngredientIn, _: User = Depends(cuisine), db: Session = Depends(get_db)):
    nom = body.nom.strip().lower()
    if db.scalars(select(Ingredient).where(Ingredient.nom == nom)).first():
        raise HTTPException(status_code=409, detail="Cet ingrédient existe déjà.")
    algs = db.scalars(select(Allergene).where(Allergene.nom.in_(body.allergenes))).all()
    if len(algs) != len(set(body.allergenes)):
        raise HTTPException(status_code=422, detail="Allergène inconnu.")
    ing = Ingredient(nom=nom)
    db.add(ing)
    db.flush()
    for a in algs:
        db.add(IngredientAllergene(ingredient_id=ing.id, allergene_id=a.id))
    db.commit()
    return {"id": ing.id, "nom": ing.nom, "allergenes": [a.nom for a in algs]}


def _elements_out(db: Session, plat_ids: list[int]) -> dict[int, list[dict]]:
    rows = db.scalars(
        select(PlatElement)
        .where(PlatElement.plat_id.in_(plat_ids or [-1]), PlatElement.actif.is_(True))
        .order_by(PlatElement.ordre, PlatElement.id)
    ).all()
    algs = allergenes_par_ingredient(db, {e.ingredient_id for e in rows})
    noms = dict(db.execute(select(Ingredient.id, Ingredient.nom).where(Ingredient.id.in_({e.ingredient_id for e in rows} or {-1}))).all())
    out: dict[int, list[dict]] = {i: [] for i in plat_ids}
    for e in rows:
        out[e.plat_id].append(
            {
                "id": e.id,
                "nom": e.nom,
                "ingredient_id": e.ingredient_id,
                "ingredient_nom": noms.get(e.ingredient_id),
                "obligatoire": e.obligatoire,
                "inclus_defaut": e.inclus_defaut,
                "supplement": e.supplement,
                "stock_restant": e.stock_restant,
                "allergenes": sorted(algs.get(e.ingredient_id, set())),
            }
        )
    return out


def _plats_out(db: Session, plats: list[Plat]) -> list[dict]:
    ids = [p.id for p in plats]
    ings, algs = _ingredients_par_plat(db, ids), _allergenes_par_plat(db, ids)
    elts = _elements_out(db, ids)
    out = []
    for p in plats:
        a = sorted({x for _, x in algs.get(p.id, [])} | {x for e in elts[p.id] if e["obligatoire"] for x in e["allergenes"]})
        out.append(
            {
                "id": p.id,
                "nom": p.nom,
                "photo": p.photo,
                "prix": p.prix,
                "prix_tiers1": p.prix_tiers1,
                "prix_tiers2": p.prix_tiers2,
                "prix_portions": {str(k): v for k, v in prix_portions(p.prix, p.prix_tiers1, p.prix_tiers2).items()},
                "sans_allergene_de": p.sans_allergene_de,
                "ingredients": ings.get(p.id, []),
                "elements": elts[p.id],
                "allergenes": a,
                "impact": impact_allergenes(db, set(a)),
            }
        )
    return out


@router.get("/plats")
def plats(_: User = Depends(cuisine), db: Session = Depends(get_db)):
    return _plats_out(db, list(db.scalars(select(Plat).order_by(Plat.nom))))


@router.post("/plats", status_code=201)
def creer_plat(body: PlatIn, request: Request, user: User = Depends(cuisine), db: Session = Depends(get_db)):
    _verifier_prix(body)
    if user.role != "cuisine" and (body.prix_tiers1 is not None or body.prix_tiers2 is not None):
        raise HTTPException(status_code=403, detail="Les prix des portions sont réglés par les chefs de cuisine.")
    ings = db.scalars(select(Ingredient).where(Ingredient.id.in_(body.ingredient_ids))).all()
    if len(ings) != len(set(body.ingredient_ids)):
        raise HTTPException(status_code=422, detail="Ingrédient inconnu.")
    if body.sans_allergene_de and db.get(Plat, body.sans_allergene_de) is None:
        raise HTTPException(status_code=422, detail="Plat principal inconnu.")
    plat = Plat(
        nom=body.nom.strip(),
        prix=body.prix,
        prix_tiers1=body.prix_tiers1,
        prix_tiers2=body.prix_tiers2,
        sans_allergene_de=body.sans_allergene_de,
    )
    db.add(plat)
    db.flush()
    for i in ings:
        db.add(PlatIngredient(plat_id=plat.id, ingredient_id=i.id))
    _remplacer_elements(db, plat, body.elements)
    if body.photo:
        plat.photo = _enregistrer_photo(body.photo, str(request.base_url))
    db.commit()
    return _plats_out(db, [plat])[0]


def _remplacer_elements(db: Session, plat: Plat, elements: list[ElementIn]) -> None:
    """Remplace la composition : un élément retiré est désactivé (les commandes passées le citent)."""
    noms = [e.nom.strip().lower() for e in elements]
    if len(noms) != len(set(noms)):
        raise HTTPException(status_code=422, detail="Deux éléments portent le même nom.")
    ing_ids = {e.ingredient_id for e in elements}
    if len(db.scalars(select(Ingredient.id).where(Ingredient.id.in_(ing_ids or {-1}))).all()) != len(ing_ids):
        raise HTTPException(status_code=422, detail="Ingrédient inconnu pour un élément.")
    existants = {
        e.id: e
        for e in db.scalars(select(PlatElement).where(PlatElement.plat_id == plat.id, PlatElement.actif.is_(True)).with_for_update())
    }
    gardes = set()
    for ordre, e in enumerate(elements):
        if e.id is not None and e.id not in existants:
            raise HTTPException(status_code=422, detail="Élément inconnu pour ce plat.")
        el = existants.get(e.id) if e.id is not None else None
        if el is None:
            el = PlatElement(plat_id=plat.id)
            db.add(el)
        el.nom = e.nom.strip()
        el.ingredient_id = e.ingredient_id
        el.obligatoire = e.obligatoire
        el.inclus_defaut = True if e.obligatoire else e.inclus_defaut
        el.supplement = 0 if e.obligatoire else e.supplement
        el.stock_restant = e.stock_restant
        el.ordre = ordre
        if e.id is not None:
            gardes.add(e.id)
    for eid, el in existants.items():
        if eid not in gardes:
            el.actif = False


@router.put("/plats/{plat_id}/elements")
def maj_elements(plat_id: int, body: list[ElementIn], _: User = Depends(cuisine), db: Session = Depends(get_db)):
    if len(body) > 20:
        raise HTTPException(status_code=422, detail="20 éléments au maximum.")
    plat = db.get(Plat, plat_id)
    if plat is None:
        raise HTTPException(status_code=404, detail="Plat introuvable.")
    _remplacer_elements(db, plat, body)
    db.commit()
    return _plats_out(db, [plat])[0]


@router.put("/plats/{plat_id}/prix")
def maj_prix_plat(plat_id: int, body: PrixIn, _: User = Depends(chef), db: Session = Depends(get_db)):
    """Prix de référence du plat. Les menus déjà publiés et les commandes passées ne changent pas."""
    _verifier_prix(body)
    plat = db.execute(select(Plat).where(Plat.id == plat_id).with_for_update()).scalar_one_or_none()
    if plat is None:
        raise HTTPException(status_code=404, detail="Plat introuvable.")
    plat.prix, plat.prix_tiers1, plat.prix_tiers2 = body.prix, body.prix_tiers1, body.prix_tiers2
    db.commit()
    return _plats_out(db, [plat])[0]


def _enregistrer_photo(data_url: str, base_url: str) -> str:
    try:
        entete, b64 = data_url.split(",", 1)
        ext = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}[entete[5:].split(";")[0]]
        contenu = base64.b64decode(b64, validate=True)
    except (ValueError, KeyError, binascii.Error):
        raise HTTPException(status_code=422, detail="Photo invalide (JPEG, PNG ou WebP).")
    if len(contenu) > 3_000_000:
        raise HTTPException(status_code=422, detail="Photo trop lourde (3 Mo max).")
    DOSSIER_PHOTOS.mkdir(parents=True, exist_ok=True)
    nom = f"{uuid.uuid4().hex}.{ext}"
    (DOSSIER_PHOTOS / nom).write_bytes(contenu)
    return f"{base_url.rstrip('/')}/static/plats/{nom}"


@router.get("/menus")
def menus(debut: _date | None = None, _: User = Depends(cuisine), db: Session = Depends(get_db)):
    aujourdhui = _date.today()
    lundi = debut or (aujourdhui - timedelta(days=aujourdhui.weekday()))
    rows = db.execute(
        select(MenuJour, Plat)
        .join(Plat, Plat.id == MenuJour.plat_id)
        .where(MenuJour.date >= lundi, MenuJour.date < lundi + timedelta(days=7))
        .order_by(MenuJour.date, MenuJour.type)
    ).all()
    return [
        {
            "id": m.id,
            "date": m.date,
            "plat_id": p.id,
            "plat_nom": p.nom,
            "type": m.type,
            "prix": m.prix,
            "prix_tiers1": m.prix_tiers1,
            "prix_tiers2": m.prix_tiers2,
            "prix_portions": {str(k): v for k, v in prix_portions(m.prix, m.prix_tiers1, m.prix_tiers2).items()},
            "portions_prevues": m.stock_prevu / 3,
            "portions_restantes": m.stock_restant / 3,
        }
        for m, p in rows
    ]


@router.post("/menus", status_code=201)
def publier_menu(body: MenuIn, _: User = Depends(cuisine), db: Session = Depends(get_db)):
    plat = db.get(Plat, body.plat_id)
    if plat is None:
        raise HTTPException(status_code=422, detail="Plat inconnu.")
    if db.scalars(select(MenuJour).where(MenuJour.date == body.date, MenuJour.plat_id == plat.id)).first():
        raise HTTPException(status_code=409, detail="Ce plat est déjà au menu ce jour-là.")
    m = MenuJour(
        date=body.date,
        plat_id=plat.id,
        # Prix figés à la publication : changer ensuite le plat ne modifie pas ce menu.
        prix=body.prix if body.prix is not None else plat.prix,
        prix_tiers1=plat.prix_tiers1 if body.prix is None else None,
        prix_tiers2=plat.prix_tiers2 if body.prix is None else None,
        stock_prevu=body.portions * 3,
        stock_restant=body.portions * 3,
        type=body.type,
    )
    db.add(m)
    db.commit()
    return {"id": m.id}


@router.put("/menus/{menu_id}")
def maj_menu(menu_id: int, body: MenuMaj, _: User = Depends(cuisine), db: Session = Depends(get_db)):
    m = db.execute(select(MenuJour).where(MenuJour.id == menu_id).with_for_update()).scalar_one_or_none()
    if m is None:
        raise HTTPException(status_code=404, detail="Menu introuvable.")
    nouveau = body.portions * 3
    deja = m.stock_prevu - m.stock_restant
    if nouveau < deja:
        raise HTTPException(status_code=409, detail="Stock inférieur aux portions déjà commandées.")
    m.stock_restant = nouveau - deja
    m.stock_prevu = nouveau
    db.commit()
    return {"id": m.id}


@router.put("/menus/{menu_id}/prix")
def maj_prix_menu(menu_id: int, body: MenuPrixIn, _: User = Depends(chef), db: Session = Depends(get_db)):
    """Prix d'un menu publié : s'applique aux commandes futures, jamais aux commandes confirmées."""
    _verifier_prix(body)
    m = db.execute(select(MenuJour).where(MenuJour.id == menu_id).with_for_update()).scalar_one_or_none()
    if m is None:
        raise HTTPException(status_code=404, detail="Menu introuvable.")
    if m.date < _date.today():
        raise HTTPException(status_code=409, detail="Ce menu est passé.")
    m.prix, m.prix_tiers1, m.prix_tiers2 = body.prix, body.prix_tiers1, body.prix_tiers2
    db.commit()
    return {"id": m.id, "prix_portions": {str(k): v for k, v in prix_portions(m.prix, m.prix_tiers1, m.prix_tiers2).items()}}


@router.delete("/menus/{menu_id}", status_code=204)
def supprimer_menu(menu_id: int, _: User = Depends(cuisine), db: Session = Depends(get_db)):
    if db.scalars(select(Reservation.id).where(Reservation.menu_jour_id == menu_id)).first():
        raise HTTPException(status_code=409, detail="Des commandes existent pour ce menu.")
    db.execute(delete(MenuJour).where(MenuJour.id == menu_id))
    db.commit()


@router.get("/fiche")
def fiche(date: _date | None = None, _: User = Depends(cuisine), db: Session = Depends(get_db)):
    return fiche_cuisine(db, date or _date.today())


# ---------- Espace cuisinier : service, vagues, salle, retours ----------


class RetourIn(BaseModel):
    eleve_id: int
    avis: int | None = Field(default=None, ge=-1, le=1)
    consommation: str | None = Field(default=None, pattern="^(termine|non_termine)$")


class RetoursIn(BaseModel):
    date: _date
    mode: str | None = None
    retours: list[RetourIn] = Field(min_length=1, max_length=200)


@router.get("/service")
def get_service(date: _date | None = None, mode: str | None = None, user: User = Depends(cuisine), db: Session = Depends(get_db)):
    return sc.service(db, user, date or _date.today(), mode)


@router.get("/vagues/{cle}")
def get_vague(cle: str, date: _date | None = None, mode: str | None = None, user: User = Depends(cuisine), db: Session = Depends(get_db)):
    return sc.vague(db, user, date or _date.today(), cle, mode)


@router.get("/salle")
def get_salle(date: _date | None = None, vague: str | None = None, mode: str | None = None, user: User = Depends(cuisine), db: Session = Depends(get_db)):
    return sc.salle(db, user, date or _date.today(), vague, mode)


@router.put("/retours")
def put_retours(body: RetoursIn, user: User = Depends(cuisine), db: Session = Depends(get_db)):
    out = sc.enregistrer_retours(db, user, body.date, body.retours, body.mode)
    db.commit()
    return out


@router.get("/eleves/{eleve_id}/stats")
def get_stats(eleve_id: int, _: User = Depends(cuisine), db: Session = Depends(get_db)):
    return sc.stats_eleve(db, eleve_id)


# ---------- Réglages du chef et statistiques ----------


class ReglagesCuisineIn(BaseModel):
    delai_preparation_min: int = Field(ge=0, le=240)


@router.get("/reglages")
def get_reglages(_: User = Depends(cuisine), db: Session = Depends(get_db)):
    return {"delai_preparation_min": db.get(Parametres, 1).delai_preparation_min}


@router.put("/reglages")
def put_reglages(body: ReglagesCuisineIn, _: User = Depends(cuisine), db: Session = Depends(get_db)):
    p = db.execute(select(Parametres).where(Parametres.id == 1).with_for_update()).scalar_one()
    p.delai_preparation_min = body.delai_preparation_min
    db.commit()
    return {"delai_preparation_min": p.delai_preparation_min}


@router.get("/statistiques")
def get_statistiques(
    periode: str = Query("semaine", pattern="^(jour|semaine|mois)$"),
    date: _date | None = None,
    mode: str | None = None,
    user: User = Depends(cuisine),
    db: Session = Depends(get_db),
):
    jour = date or aujourdhui()
    if periode == "jour":
        debut = fin = jour
    elif periode == "semaine":
        debut = jour - timedelta(days=jour.weekday())
        fin = debut + timedelta(days=6)
    else:
        debut, fin = _bornes_mois(jour.year, jour.month)
    m, _, classes = sc.perimetre(db, user, mode)
    ids = set(db.scalars(select(Eleve.id).where(Eleve.classe.in_([c.nom for c in classes] or [""]))))
    return {"periode": periode, "mode": m, **stats_cuisine(db, ids, debut, fin)}
