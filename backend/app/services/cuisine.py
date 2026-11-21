"""Cuisine : base ingrédients-allergènes, plats, menus, fiche cuisine."""
from __future__ import annotations

from collections import defaultdict
from datetime import date as _date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import (
    Classe,
    Creneau,
    Eleve,
    MenuJour,
    Niveau,
    Place,
    Plat,
    Reservation,
    TableSalle,
)
from .eleve import _allergenes_par_plat

MARGE = 0.05


def impact_allergenes(db: Session, allergenes: set[str]) -> dict:
    """C3 : nombre et pourcentage d'élèves qui ne peuvent pas manger ce plat."""
    total = db.scalar(select(func.count(Eleve.id))) or 0
    if not allergenes or not total:
        return {"eleves": 0, "pourcentage": 0.0, "total": total}
    concernes = db.scalar(
        select(func.count(Eleve.id)).where(Eleve.allergies.overlap(sorted(allergenes)))
    ) or 0
    return {"eleves": concernes, "pourcentage": round(100 * concernes / total, 1), "total": total}


def fiche_cuisine(db: Session, jour: _date) -> dict:
    menus = db.execute(
        select(MenuJour, Plat).join(Plat, Plat.id == MenuJour.plat_id).where(MenuJour.date == jour)
    ).all()
    menu_ids = [m.id for m, _ in menus]
    rows = db.execute(
        select(Reservation, Eleve, Creneau, Place, TableSalle)
        .join(Eleve, Eleve.id == Reservation.eleve_id)
        .join(Creneau, Creneau.id == Reservation.creneau_id)
        .join(Place, Place.id == Reservation.place_id)
        .join(TableSalle, TableSalle.id == Place.table_id)
        .where(Reservation.menu_jour_id.in_(menu_ids or [-1]), Reservation.statut != "annulee")
        .order_by(Creneau.heure_debut, Eleve.nom)
    ).all()

    par_menu: dict[int, dict] = {}
    for m, p in menus:
        par_menu[m.id] = {
            "plat_nom": p.nom,
            "type": m.type,
            "commandes": 0,
            "tiers": 0,
            "stock_prevu_portions": m.stock_prevu / 3,
            "par_creneau": defaultdict(lambda: {"commandes": 0, "tiers": 0}),
            "par_classe": defaultdict(lambda: {"commandes": 0, "tiers": 0}),
        }
    plateaux = []
    for r, e, c, pl, t in rows:
        d = par_menu[r.menu_jour_id]
        d["commandes"] += 1
        d["tiers"] += r.tiers
        cle = f"{c.heure_debut.strftime('%H:%M')}–{c.heure_fin.strftime('%H:%M')}"
        d["par_creneau"][cle]["commandes"] += 1
        d["par_creneau"][cle]["tiers"] += r.tiers
        d["par_classe"][e.classe]["commandes"] += 1
        d["par_classe"][e.classe]["tiers"] += r.tiers
        if d["type"] == "sans_allergene":
            plateaux.append(
                {
                    "nom": e.nom,
                    "classe": e.classe,
                    "photo": e.photo,
                    "allergies": list(e.allergies or []),
                    "plat_nom": d["plat_nom"],
                    "portion": r.tiers,
                    "creneau": cle,
                    "place": f"{t.nom} · {pl.numero}",
                }
            )

    def portions(tiers: int) -> float:
        return round(tiers / 3, 2)

    plats = []
    for d in par_menu.values():
        plats.append(
            {
                "plat_nom": d["plat_nom"],
                "type": d["type"],
                "commandes": d["commandes"],
                "portions": portions(d["tiers"]),
                "portions_avec_marge": round(d["tiers"] / 3 * (1 + MARGE), 1),
                "stock_prevu_portions": d["stock_prevu_portions"],
                "par_creneau": [
                    {"cle": k, "commandes": v["commandes"], "portions": portions(v["tiers"])}
                    for k, v in sorted(d["par_creneau"].items())
                ],
                "par_classe": [
                    {"cle": k, "commandes": v["commandes"], "portions": portions(v["tiers"])}
                    for k, v in sorted(d["par_classe"].items())
                ],
            }
        )

    # Mode Classe : effectifs des classes, plateaux sans allergène nominatifs.
    principal = next((p for m, p in menus if m.type == "principal"), None)
    alg_principal = (
        {a for _, a in _allergenes_par_plat(db, [principal.id]).get(principal.id, [])}
        if principal
        else set()
    )
    classes_mode_classe = []
    for cl in db.scalars(
        select(Classe).join(Niveau, Niveau.id == Classe.niveau_id).where(Niveau.mode == "classe")
    ):
        eleves = db.scalars(select(Eleve).where(Eleve.classe == cl.nom).order_by(Eleve.nom)).all()
        sans = [e for e in eleves if alg_principal & {a.lower() for a in e.allergies or []}]
        classes_mode_classe.append(
            {"classe": cl.nom, "effectif": len(eleves), "sans_allergene": len(sans)}
        )
        for e in sans:
            plateaux.append(
                {
                    "nom": e.nom,
                    "classe": e.classe,
                    "photo": e.photo,
                    "allergies": list(e.allergies or []),
                    "plat_nom": "Version sans allergène",
                    "portion": 3,
                    "creneau": "Créneau de la classe",
                    "place": "—",
                }
            )

    return {
        "date": jour,
        "marge": MARGE,
        "plats": plats,
        "classes_mode_classe": classes_mode_classe,
        "plateaux_sans_allergene": plateaux,
    }
