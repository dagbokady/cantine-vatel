"""Composition des plats : éléments configurés par la cuisine, choix de l'élève, allergies.

Règles appliquées côté serveur :
- les ingrédients de base et les éléments obligatoires sont toujours servis ;
- un élément facultatif n'est servi que si l'élève le choisit ;
- les allergies sont vérifiées sur la composition finale, sans contournement possible.
"""
from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Allergene, IngredientAllergene, PlatElement, ReservationElement


def _conflit(msg: str) -> HTTPException:
    return HTTPException(status_code=409, detail=msg)


def elements_par_plat(db: Session, plat_ids: list[int], *, verrou: bool = False) -> dict[int, list[PlatElement]]:
    out: dict[int, list[PlatElement]] = {pid: [] for pid in plat_ids}
    if not plat_ids:
        return out
    q = (
        select(PlatElement)
        .where(PlatElement.plat_id.in_(plat_ids), PlatElement.actif.is_(True))
        .order_by(PlatElement.plat_id, PlatElement.ordre, PlatElement.id)
    )
    if verrou:
        q = q.with_for_update()
    for e in db.scalars(q):
        out[e.plat_id].append(e)
    return out


def allergenes_par_ingredient(db: Session, ingredient_ids: set[int]) -> dict[int, set[str]]:
    out: dict[int, set[str]] = {i: set() for i in ingredient_ids}
    if not ingredient_ids:
        return out
    rows = db.execute(
        select(IngredientAllergene.ingredient_id, Allergene.nom)
        .join(Allergene, Allergene.id == IngredientAllergene.allergene_id)
        .where(IngredientAllergene.ingredient_id.in_(ingredient_ids))
    ).all()
    for iid, nom in rows:
        out[iid].add(nom.lower())
    return out


def options_elements(db: Session, elements: list[PlatElement], allergies: set[str]) -> list[dict]:
    """Éléments proposés à l'élève, avec le blocage éventuel dû à ses allergies."""
    algs = allergenes_par_ingredient(db, {e.ingredient_id for e in elements})
    out = []
    for e in elements:
        conflit = sorted(algs.get(e.ingredient_id, set()) & allergies)
        epuise = e.stock_restant is not None and e.stock_restant <= 0
        out.append(
            {
                "id": e.id,
                "nom": e.nom,
                "obligatoire": e.obligatoire,
                "inclus_defaut": e.inclus_defaut and not conflit and not epuise,
                "supplement": e.supplement,
                "disponible": not epuise,
                "allergenes": sorted(algs.get(e.ingredient_id, set())),
                "bloque": f"Contient {conflit[0]}" if conflit else None,
            }
        )
    return out


def allergenes_obligatoires(db: Session, elements: list[PlatElement]) -> dict[str, str]:
    """Allergène -> nom de l'élément obligatoire qui le porte."""
    oblig = [e for e in elements if e.obligatoire]
    algs = allergenes_par_ingredient(db, {e.ingredient_id for e in oblig})
    out: dict[str, str] = {}
    for e in oblig:
        for a in algs.get(e.ingredient_id, set()):
            out.setdefault(a, e.nom)
    return out


def composer(
    db: Session, plat_id: int, choix: list[int] | None, allergies: set[str], allergenes_base: set[str]
) -> tuple[list[PlatElement], int]:
    """Composition finale validée (éléments verrouillés) et total des suppléments.

    `choix` : éléments facultatifs retenus par l'élève ; None = composition par défaut.
    """
    elements = elements_par_plat(db, [plat_id], verrou=True)[plat_id]
    par_id = {e.id: e for e in elements}
    if choix is not None:
        inconnus = set(choix) - set(par_id)
        if inconnus:
            raise _conflit("Un élément choisi n'est plus proposé pour ce plat.")
    algs = allergenes_par_ingredient(db, {e.ingredient_id for e in elements})

    retenus: list[PlatElement] = []
    for e in elements:
        conflit = algs.get(e.ingredient_id, set()) & allergies
        if e.obligatoire:
            garde = True
        elif choix is None:
            # Composition par défaut : un élément incompatible ou épuisé est simplement retiré.
            garde = e.inclus_defaut and not conflit and (e.stock_restant is None or e.stock_restant > 0)
        else:
            garde = e.id in choix
        if not garde:
            continue
        if conflit:
            raise _conflit(f"« {e.nom} » contient un allergène déclaré : {next(iter(sorted(conflit)))}.")
        if e.stock_restant is not None and e.stock_restant <= 0:
            raise _conflit(f"« {e.nom} » n'est plus disponible.")
        retenus.append(e)

    conflit_base = allergenes_base & allergies
    if conflit_base:
        raise _conflit(f"Ce plat contient un allergène déclaré : {next(iter(sorted(conflit_base)))}.")
    return retenus, sum(e.supplement for e in retenus if not e.obligatoire)


def enregistrer_composition(db: Session, reservation_id: int, retenus: list[PlatElement]) -> None:
    for e in retenus:
        if e.stock_restant is not None:
            e.stock_restant -= 1
        db.add(ReservationElement(reservation_id=reservation_id, element_id=e.id, nom=e.nom, supplement=0 if e.obligatoire else e.supplement))


def rendre_stock_composition(db: Session, reservation_id: int) -> None:
    ids = [
        i
        for (i,) in db.execute(
            select(ReservationElement.element_id).where(
                ReservationElement.reservation_id == reservation_id, ReservationElement.element_id.is_not(None)
            )
        )
    ]
    if not ids:
        return
    for e in db.scalars(select(PlatElement).where(PlatElement.id.in_(ids)).with_for_update()):
        if e.stock_restant is not None:
            e.stock_restant += 1


def noms_composition(db: Session, reservation_ids: list[int]) -> dict[int, list[str]]:
    out: dict[int, list[str]] = {r: [] for r in reservation_ids}
    if not reservation_ids:
        return out
    for rid, nom in db.execute(
        select(ReservationElement.reservation_id, ReservationElement.nom)
        .where(ReservationElement.reservation_id.in_(reservation_ids))
        .order_by(ReservationElement.id)
    ):
        out[rid].append(nom)
    return out


def allergenes_reservation(db: Session, reservation_id: int) -> set[str]:
    """Allergènes des éléments réellement servis avec la commande."""
    ing_ids = {
        i
        for (i,) in db.execute(
            select(PlatElement.ingredient_id)
            .join(ReservationElement, ReservationElement.element_id == PlatElement.id)
            .where(ReservationElement.reservation_id == reservation_id)
        )
    }
    return set().union(*allergenes_par_ingredient(db, ing_ids).values()) if ing_ids else set()
