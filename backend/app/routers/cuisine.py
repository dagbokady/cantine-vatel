import base64
import binascii
import uuid
from datetime import date as _date
from datetime import timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..deps import get_db, require_roles
from ..models import (
    Allergene,
    Ingredient,
    IngredientAllergene,
    MenuJour,
    Plat,
    PlatIngredient,
    Reservation,
    User,
)
from ..services.cuisine import fiche_cuisine, impact_allergenes
from ..services.eleve import _allergenes_par_plat, _ingredients_par_plat

router = APIRouter(prefix="/cuisine", tags=["cuisine"])
cuisine = require_roles("cuisine", "admin")
DOSSIER_PHOTOS = Path(__file__).resolve().parents[2] / "static" / "plats"


class IngredientIn(BaseModel):
    nom: str = Field(min_length=2, max_length=120)
    allergenes: list[str] = []


class PlatIn(BaseModel):
    nom: str = Field(min_length=2, max_length=120)
    prix: int = Field(ge=0, le=20000)
    ingredient_ids: list[int] = Field(min_length=1)
    sans_allergene_de: int | None = None
    photo: str | None = None  # data URL (photo prise par la cantine)


class MenuIn(BaseModel):
    date: _date
    plat_id: int
    type: str = Field(pattern="^(principal|sans_allergene|accompagnement)$")
    portions: int = Field(ge=1, le=2000)
    prix: int | None = Field(default=None, ge=0)


class MenuMaj(BaseModel):
    portions: int = Field(ge=0, le=2000)


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


def _plats_out(db: Session, plats: list[Plat]) -> list[dict]:
    ids = [p.id for p in plats]
    ings, algs = _ingredients_par_plat(db, ids), _allergenes_par_plat(db, ids)
    out = []
    for p in plats:
        a = sorted({x for _, x in algs.get(p.id, [])})
        out.append(
            {
                "id": p.id,
                "nom": p.nom,
                "photo": p.photo,
                "prix": p.prix,
                "sans_allergene_de": p.sans_allergene_de,
                "ingredients": ings.get(p.id, []),
                "allergenes": a,
                "impact": impact_allergenes(db, set(a)),
            }
        )
    return out


@router.get("/plats")
def plats(_: User = Depends(cuisine), db: Session = Depends(get_db)):
    return _plats_out(db, list(db.scalars(select(Plat).order_by(Plat.nom))))


@router.post("/plats", status_code=201)
def creer_plat(body: PlatIn, request: Request, _: User = Depends(cuisine), db: Session = Depends(get_db)):
    ings = db.scalars(select(Ingredient).where(Ingredient.id.in_(body.ingredient_ids))).all()
    if len(ings) != len(set(body.ingredient_ids)):
        raise HTTPException(status_code=422, detail="Ingrédient inconnu.")
    if body.sans_allergene_de and db.get(Plat, body.sans_allergene_de) is None:
        raise HTTPException(status_code=422, detail="Plat principal inconnu.")
    plat = Plat(nom=body.nom.strip(), prix=body.prix, sans_allergene_de=body.sans_allergene_de)
    db.add(plat)
    db.flush()
    for i in ings:
        db.add(PlatIngredient(plat_id=plat.id, ingredient_id=i.id))
    if body.photo:
        plat.photo = _enregistrer_photo(body.photo, str(request.base_url))
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
        prix=body.prix if body.prix is not None else plat.prix,
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


@router.delete("/menus/{menu_id}", status_code=204)
def supprimer_menu(menu_id: int, _: User = Depends(cuisine), db: Session = Depends(get_db)):
    if db.scalars(select(Reservation.id).where(Reservation.menu_jour_id == menu_id)).first():
        raise HTTPException(status_code=409, detail="Des commandes existent pour ce menu.")
    db.execute(delete(MenuJour).where(MenuJour.id == menu_id))
    db.commit()


@router.get("/fiche")
def fiche(date: _date | None = None, _: User = Depends(cuisine), db: Session = Depends(get_db)):
    return fiche_cuisine(db, date or _date.today())
