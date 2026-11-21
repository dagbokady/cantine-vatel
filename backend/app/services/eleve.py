"""Lecture du menu du jour et compatibilité allergies pour un élève."""
from __future__ import annotations

from datetime import date as _date
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import (
    Allergene,
    Ingredient,
    IngredientAllergene,
    MenuJour,
    Parametres,
    Plat,
    PlatIngredient,
)


def _ingredients_par_plat(db: Session, plat_ids: list[int]) -> dict[int, list[str]]:
    if not plat_ids:
        return {}
    rows = db.execute(
        select(PlatIngredient.plat_id, Ingredient.nom)
        .join(Ingredient, Ingredient.id == PlatIngredient.ingredient_id)
        .where(PlatIngredient.plat_id.in_(plat_ids))
    ).all()
    out: dict[int, list[str]] = {pid: [] for pid in plat_ids}
    for plat_id, nom in rows:
        out[plat_id].append(nom)
    return out


def _allergenes_par_plat(db: Session, plat_ids: list[int]) -> dict[int, list[tuple[str, str]]]:
    """Pour chaque plat, liste de (ingredient, allergène) présents."""
    if not plat_ids:
        return {}
    rows = db.execute(
        select(PlatIngredient.plat_id, Ingredient.nom, Allergene.nom)
        .join(Ingredient, Ingredient.id == PlatIngredient.ingredient_id)
        .join(IngredientAllergene, IngredientAllergene.ingredient_id == Ingredient.id)
        .join(Allergene, Allergene.id == IngredientAllergene.allergene_id)
        .where(PlatIngredient.plat_id.in_(plat_ids))
    ).all()
    out: dict[int, list[tuple[str, str]]] = {pid: [] for pid in plat_ids}
    for plat_id, ing, alg in rows:
        out[plat_id].append((ing, alg))
    return out


def options_menu_du_jour(
    db: Session,
    allergies_eleve: list[str],
    today: _date,
) -> tuple[list[dict], list[dict]]:
    menus = db.execute(
        select(MenuJour, Plat)
        .join(Plat, Plat.id == MenuJour.plat_id)
        .where(MenuJour.date == today)
        .order_by(MenuJour.type, Plat.nom)
    ).all()

    plat_ids = [p.id for _, p in menus]
    ings_map = _ingredients_par_plat(db, plat_ids)
    alg_map = _allergenes_par_plat(db, plat_ids)
    allergies_set = {a.lower() for a in allergies_eleve or []}

    compatibles: list[dict] = []
    incompatibles: list[dict] = []
    for menu, plat in menus:
        conflits = [
            (ing, alg)
            for ing, alg in alg_map.get(plat.id, [])
            if alg.lower() in allergies_set
        ]
        compatible = not conflits
        raison = None
        if conflits:
            # On expose l'allergène et l'ingrédient concerné.
            alg = conflits[0][1]
            ing = conflits[0][0]
            raison = f"Contient {alg} ({ing})"
        item = {
            "menu_jour_id": menu.id,
            "plat_id": plat.id,
            "nom": plat.nom,
            "photo": plat.photo,
            "prix": menu.prix,
            "type": menu.type,
            "stock_restant": menu.stock_restant,
            "ingredients": ings_map.get(plat.id, []),
            "compatible": compatible,
            "raison": raison,
        }
        if compatible:
            compatibles.append(item)
        else:
            incompatibles.append(item)
    return compatibles, incompatibles


def commandes_ouvertes(db: Session, now: datetime) -> tuple[bool, "Parametres"]:
    params = db.get(Parametres, 1)
    if params is None:
        return False, None  # type: ignore[return-value]
    # Clôture = heure limite le jour même. Ouvert si l'heure actuelle < clôture.
    ouverte = now.time() < params.cloture_commandes
    return ouverte, params
