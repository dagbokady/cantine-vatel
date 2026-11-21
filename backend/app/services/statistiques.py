"""Statistiques de l'administration : jour courant et historique.

Trois notions distinctes, jamais déduites l'une de l'autre :
- commandé : réservation non annulée (mode Commande) ou couvert prévu par l'effectif (mode Classe) ;
- servi    : le plat est entré dans le service (ticket scanné, plateau remis ou assiette récupérée) ;
- consommé : retour d'assiette réellement saisi (« termine » ou « non_termine »).

Taux de gaspillage = repas non terminés / repas commandés × 100. Un repas sans retour n'est
jamais compté comme terminé.
"""
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import date as _date
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..models import Classe, Eleve, MenuJour, Niveau, Plat, Repas, Reservation
from .service_cuisine import couverts_du_jour

MIN_REPAS_CLASSEMENT = 5  # en dessous, on ne classe pas un élève
MIN_AVIS_CLASSEMENT = 3  # en dessous, on ne classe pas un plat


def aujourdhui() -> _date:
    """Journée réelle selon le fuseau de l'établissement."""
    return datetime.now(ZoneInfo(settings.fuseau_horaire)).date()


@dataclass
class _Repas:
    eleve_id: int
    jour: _date
    menu_id: int | None = None
    servi: bool = False
    tiers: int | None = None
    consommation: str | None = None
    avis: int | None = None


def _collecter(db: Session, debut: _date, fin: _date) -> list[_Repas]:
    """Un enregistrement par (élève, jour) commandé sur la période."""
    par_cle: dict[tuple[int, _date], _Repas] = {}

    # Mode Commande : réservations non annulées.
    for r, jour in db.execute(
        select(Reservation, MenuJour.date)
        .join(MenuJour, MenuJour.id == Reservation.menu_jour_id)
        .where(MenuJour.date.between(debut, fin), Reservation.statut != "annulee")
    ):
        par_cle[(r.eleve_id, jour)] = _Repas(r.eleve_id, jour, r.menu_jour_id, r.statut == "servie", r.tiers)

    # Mode Classe : couverts prévus (effectif moins absents), jours passés ou courant uniquement.
    classes = list(db.scalars(select(Classe).join(Niveau, Niveau.id == Classe.niveau_id).where(Niveau.mode == "classe")))
    if classes:
        jours_menu = db.scalars(
            select(MenuJour.date).where(MenuJour.date.between(debut, min(fin, aujourdhui())), MenuJour.type == "principal").distinct()
        ).all()
        for jour in jours_menu:
            couverts, _, _ = couverts_du_jour(db, jour, "classe", classes)
            for c in couverts:
                par_cle.setdefault((c.eleve.id, jour), _Repas(c.eleve.id, jour, c.menu.id, c.servi, c.tiers))

    # Retours d'assiettes et avis. Un repas enregistré sans commande connue reste un repas commandé.
    for rp in db.scalars(select(Repas).where(Repas.date.between(debut, fin))):
        x = par_cle.setdefault((rp.eleve_id, rp.date), _Repas(rp.eleve_id, rp.date))
        x.menu_id = rp.menu_servi_id or rp.menu_commande_id or x.menu_id
        x.servi = x.servi or rp.menu_servi_id is not None
        x.consommation, x.avis = rp.consommation, rp.avis
        x.tiers = x.tiers or rp.tiers
    return list(par_cle.values())


def _resume(repas: list[_Repas]) -> dict:
    commandes = len(repas)
    termines = sum(r.consommation == "termine" for r in repas)
    non_termines = sum(r.consommation == "non_termine" for r in repas)
    return {
        "commandes": commandes,
        "servis": sum(r.servi for r in repas),
        "termines": termines,
        "non_termines": non_termines,
        "sans_retour": commandes - termines - non_termines,
        "taux_gaspillage": round(100 * non_termines / commandes, 1) if commandes else None,
        "likes": sum(r.avis == 1 for r in repas),
        "dislikes": sum(r.avis == -1 for r in repas),
    }


def _plats(db: Session, repas: list[_Repas]) -> dict[int, Plat]:
    ids = {r.menu_id for r in repas if r.menu_id}
    if not ids:
        return {}
    return {m: p for m, p in db.execute(select(MenuJour.id, Plat).join(Plat, Plat.id == MenuJour.plat_id).where(MenuJour.id.in_(ids)))}


def _ratio(likes: int, dislikes: int) -> float | None:
    return round(100 * likes / (likes + dislikes), 1) if likes + dislikes else None


def _avis_par_plat(db: Session, repas: list[_Repas]) -> list[dict]:
    plats = _plats(db, repas)
    agg: dict[int, dict] = {}
    for r in repas:
        p = plats.get(r.menu_id)
        if p is None:
            continue
        a = agg.setdefault(p.id, {"plat_id": p.id, "plat_nom": p.nom, "photo": p.photo, "commandes": 0, "likes": 0, "dislikes": 0})
        a["commandes"] += 1
        a["likes"] += r.avis == 1
        a["dislikes"] += r.avis == -1
    out = [{**a, "ratio": _ratio(a["likes"], a["dislikes"])} for a in agg.values()]
    return sorted(out, key=lambda a: (a["ratio"] is None, -(a["ratio"] or 0), -a["commandes"]))


def stats_jour(db: Session, jour: _date) -> dict:
    repas = _collecter(db, jour, jour)
    return {"periode": "jour", "date": jour, "resume": _resume(repas), "avis": _avis_par_plat(db, repas)}


def _bornes_mois(annee: int, mois: int) -> tuple[_date, _date]:
    debut = _date(annee, mois, 1)
    suivant = _date(annee + mois // 12, mois % 12 + 1, 1)
    return debut, suivant - timedelta(days=1)


def _classement_eleves(db: Session, repas: list[_Repas]) -> list[dict]:
    par_eleve: dict[int, list[_Repas]] = defaultdict(list)
    for r in repas:
        par_eleve[r.eleve_id].append(r)
    retenus = {eid: rs for eid, rs in par_eleve.items() if len(rs) >= MIN_REPAS_CLASSEMENT}
    if not retenus:
        return []
    eleves = {e.id: e for e in db.scalars(select(Eleve).where(Eleve.id.in_(list(retenus))))}
    out = []
    for eid, rs in retenus.items():
        non = sum(r.consommation == "non_termine" for r in rs)
        if not non or eid not in eleves:
            continue
        e = eleves[eid]
        out.append(
            {
                "eleve_id": eid,
                "nom": e.nom,
                "matricule": e.matricule,
                "classe": e.classe,
                "photo": e.photo,
                "commandes": len(rs),
                "observes": sum(r.consommation is not None for r in rs),
                "non_termines": non,
                "taux": round(100 * non / len(rs), 1),
            }
        )
    return sorted(out, key=lambda x: (-x["taux"], -x["non_termines"]))[:10]


def stats_mois(db: Session, annee: int, mois: int) -> dict:
    debut, fin = _bornes_mois(annee, mois)
    repas = _collecter(db, debut, fin)
    p_debut, p_fin = _bornes_mois(annee - (mois == 1), 12 if mois == 1 else mois - 1)
    precedent = _collecter(db, p_debut, p_fin)

    par_jour: dict[_date, list[_Repas]] = defaultdict(list)
    for r in repas:
        par_jour[r.jour].append(r)
    evolution = []
    for jour, rs in sorted(par_jour.items()):
        s = _resume(rs)
        evolution.append(
            {
                "date": jour,
                "commandes": s["commandes"],
                "non_termines": s["non_termines"],
                "taux_gaspillage": s["taux_gaspillage"],
                "likes": s["likes"],
                "dislikes": s["dislikes"],
                "appreciation": _ratio(s["likes"], s["dislikes"]),
            }
        )

    avis = _avis_par_plat(db, repas)
    notes = [a for a in avis if a["likes"] + a["dislikes"] >= MIN_AVIS_CLASSEMENT]
    return {
        "periode": "mois",
        "mois": f"{annee:04d}-{mois:02d}",
        "resume": _resume(repas),
        "precedent": {"mois": f"{p_debut.year:04d}-{p_debut.month:02d}", "resume": _resume(precedent)},
        "avis": avis,
        "evolution": evolution,
        "eleves_gaspillage": _classement_eleves(db, repas),
        "plats_aimes": sorted(notes, key=lambda a: (-a["ratio"], -a["likes"]))[:5],
        "plats_moins_aimes": sorted(notes, key=lambda a: (a["ratio"], -a["dislikes"]))[:5],
        "min_repas_classement": MIN_REPAS_CLASSEMENT,
        "min_avis_classement": MIN_AVIS_CLASSEMENT,
    }


# ---------- Statistiques Cuisine : quantités, portions, gaspillage par plat ----------


def _par_plat_cuisine(db: Session, repas: list[_Repas]) -> list[dict]:
    plats = _plats(db, repas)
    types = dict(db.execute(select(MenuJour.id, MenuJour.type).where(MenuJour.id.in_(list(plats) or [-1]))).all())
    agg: dict[int, dict] = {}
    for r in repas:
        p = plats.get(r.menu_id)
        if p is None:
            continue
        a = agg.setdefault(
            p.id,
            {"plat_id": p.id, "plat_nom": p.nom, "photo": p.photo, "special": False, "commandes": 0, "tiers": 0,
             "par_portion": {"1": 0, "2": 0, "3": 0}, "termines": 0, "non_termines": 0, "likes": 0, "dislikes": 0},
        )
        a["special"] = a["special"] or types.get(r.menu_id) == "sans_allergene"
        a["commandes"] += 1
        if r.tiers in (1, 2, 3):
            a["tiers"] += r.tiers
            a["par_portion"][str(r.tiers)] += 1
        a["termines"] += r.consommation == "termine"
        a["non_termines"] += r.consommation == "non_termine"
        a["likes"] += r.avis == 1
        a["dislikes"] += r.avis == -1
    out = []
    for a in agg.values():
        tiers = a.pop("tiers")
        out.append({
            **a,
            "portions": round(tiers / 3, 1),
            "taux_gaspillage": round(100 * a["non_termines"] / a["commandes"], 1) if a["commandes"] else None,
            "ratio": _ratio(a["likes"], a["dislikes"]),
        })
    return sorted(out, key=lambda a: (a["special"], -a["commandes"]))


def stats_cuisine(db: Session, eleve_ids: set[int], debut: _date, fin: _date) -> dict:
    """Restreint aux élèves du périmètre du cuisinier."""
    repas = [r for r in _collecter(db, debut, fin) if r.eleve_id in eleve_ids]
    plats = _par_plat_cuisine(db, repas)
    portions = {"1": 0, "2": 0, "3": 0}
    for r in repas:
        if r.tiers in (1, 2, 3):
            portions[str(r.tiers)] += 1
    return {
        "debut": debut,
        "fin": fin,
        "resume": _resume(repas),
        "portions_equivalentes": round(sum(r.tiers or 0 for r in repas) / 3, 1),
        "par_portion": portions,
        "speciaux": sum(p["commandes"] for p in plats if p["special"]),
        "plats": plats,
    }
