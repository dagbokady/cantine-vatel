"""Espace cuisinier : service du jour selon le mode, vagues, salle, retours d'assiettes, portions.

Mode « commande » : une vague = un créneau, les couverts viennent des réservations.
Mode « classe »   : une vague = une classe, les couverts viennent de l'effectif (moins les absents
                    de l'appel), plat principal ou version sans allergène selon les allergies.
Les deux modes ne sont jamais mélangés dans une même réponse.
"""
from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import date as _date
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import (
    AffectationCuisine,
    Appel,
    Classe,
    ClasseTable,
    Creneau,
    Eleve,
    MenuJour,
    Niveau,
    Place,
    Plat,
    Presence,
    Repas,
    Reservation,
    SuggestionPortion,
    TableSalle,
    User,
)
from .eleve import _allergenes_par_plat, _ingredients_par_plat

# Règles d'adaptation des portions (jamais sur un seul repas).
FENETRE = 20  # derniers repas observés
MIN_OBS = 8
SEUIL_HAUT = 0.85
SEUIL_BAS = 0.30


@dataclass
class Couvert:
    eleve: Eleve
    menu: MenuJour
    tiers: int
    vague: str
    place_id: int | None
    servi: bool


# ---------- Périmètre et mode ----------


def perimetre(db: Session, user: User, mode_demande: str | None) -> tuple[str, list[str], list[Classe]]:
    """Retourne (mode, modes disponibles, classes du périmètre).

    Un cuisinier affecté voit uniquement le mode de ses niveaux. Sans affectation (ou admin),
    il peut basculer entre les modes existants.
    """
    niveaux = []
    if user.role == "cuisine":
        niveaux = list(
            db.scalars(
                select(Niveau)
                .join(AffectationCuisine, AffectationCuisine.niveau_id == Niveau.id)
                .where(AffectationCuisine.user_id == user.id)
            )
        )
    if not niveaux:
        niveaux = list(db.scalars(select(Niveau)))
    modes = sorted({n.mode for n in niveaux}, key=lambda m: m != "commande")
    if not modes:
        raise HTTPException(status_code=409, detail="Aucun niveau configuré.")
    mode = mode_demande if mode_demande in modes else modes[0]
    ids = [n.id for n in niveaux if n.mode == mode]
    classes = list(db.scalars(select(Classe).where(Classe.niveau_id.in_(ids)).order_by(Classe.heure_passage, Classe.nom)))
    return mode, modes, classes


# ---------- Couverts du jour ----------


def _menus(db: Session, jour: _date) -> dict[int, tuple[MenuJour, Plat]]:
    rows = db.execute(select(MenuJour, Plat).join(Plat, Plat.id == MenuJour.plat_id).where(MenuJour.date == jour)).all()
    return {m.id: (m, p) for m, p in rows}


def placement_classe(db: Session, classe: Classe, eleves: list[Eleve]) -> dict[int, int]:
    """Place les élèves (ordre alphabétique) sur les tables réservées à la classe."""
    places = db.scalars(
        select(Place)
        .join(TableSalle, TableSalle.id == Place.table_id)
        .join(ClasseTable, ClasseTable.table_id == TableSalle.id)
        .where(ClasseTable.classe_id == classe.id)
        .order_by(TableSalle.nom, Place.numero)
    ).all()
    return {e.id: p.id for e, p in zip(sorted(eleves, key=lambda e: e.nom), places)}


def couverts_du_jour(db: Session, jour: _date, mode: str, classes: list[Classe]) -> tuple[list[Couvert], dict, list[dict]]:
    menus = _menus(db, jour)
    noms_classes = [c.nom for c in classes]
    couverts: list[Couvert] = []
    vagues: list[dict] = []

    if mode == "commande":
        rows = db.execute(
            select(Reservation, Eleve, Creneau)
            .join(Eleve, Eleve.id == Reservation.eleve_id)
            .join(Creneau, Creneau.id == Reservation.creneau_id)
            .where(
                Reservation.menu_jour_id.in_(list(menus) or [-1]),
                Reservation.statut != "annulee",
                Eleve.classe.in_(noms_classes or [""]),
            )
            .order_by(Creneau.heure_debut, Eleve.nom)
        ).all()
        creneaux = db.scalars(select(Creneau).where(Creneau.date == jour).order_by(Creneau.heure_debut)).all()
        for c in creneaux:
            vagues.append(
                {
                    "cle": f"c{c.id}",
                    "nom": f"{c.heure_debut.strftime('%H:%M')}",
                    "sous_titre": "Créneau",
                    "heure_debut": c.heure_debut,
                    "heure_fin": c.heure_fin,
                }
            )
        for r, e, c in rows:
            couverts.append(Couvert(e, menus[r.menu_jour_id][0], r.tiers, f"c{c.id}", r.place_id, r.statut == "servie"))
        return couverts, menus, vagues

    # Mode classe
    principal = next((m for m, _ in menus.values() if m.type == "principal"), None)
    sans = next((m for m, _ in menus.values() if m.type == "sans_allergene"), None)
    alg_principal = (
        {a.lower() for _, a in _allergenes_par_plat(db, [principal.plat_id]).get(principal.plat_id, [])}
        if principal
        else set()
    )
    servis = set(db.scalars(select(Repas.eleve_id).where(Repas.date == jour, Repas.menu_servi_id.is_not(None))))
    for cl in classes:
        vagues.append(
            {
                "cle": f"k{cl.id}",
                "nom": cl.nom,
                "sous_titre": "Classe",
                "heure_debut": cl.heure_passage,
                "heure_fin": None,
            }
        )
        if principal is None:
            continue
        eleves = list(db.scalars(select(Eleve).where(Eleve.classe == cl.nom).order_by(Eleve.nom)))
        appel = db.scalars(select(Appel).where(Appel.classe_id == cl.id, Appel.date == jour)).first()
        if appel:
            absents = set(
                db.scalars(select(Presence.eleve_id).where(Presence.appel_id == appel.id, Presence.present.is_(False)))
            )
            eleves = [e for e in eleves if e.id not in absents]
        places = placement_classe(db, cl, eleves)
        for e in eleves:
            allergique = bool(alg_principal & {a.lower() for a in e.allergies or []})
            menu = sans if allergique and sans else principal
            couverts.append(Couvert(e, menu, e.portion_defaut or 3, f"k{cl.id}", places.get(e.id), e.id in servis))
    return couverts, menus, vagues


# ---------- Agrégation par plat ----------


def _p(tiers: int) -> float:
    return round(tiers / 3, 2)


def agreger(db: Session, couverts: list[Couvert], menus: dict, mode: str) -> tuple[list[dict], list[dict]]:
    plat_ids = [p.id for _, p in menus.values()]
    ings, algs = _ingredients_par_plat(db, plat_ids), _allergenes_par_plat(db, plat_ids)
    par_menu: dict[int, list[Couvert]] = defaultdict(list)
    for c in couverts:
        par_menu[c.menu.id].append(c)

    # En mode classe, l'accompagnement suit chaque assiette.
    if mode == "classe":
        for m, _ in menus.values():
            if m.type == "accompagnement":
                par_menu[m.id] = [Couvert(c.eleve, m, c.tiers, c.vague, c.place_id, c.servi) for c in couverts]

    plats_par_id = {p.id: p for _, p in menus.values()}
    classiques, speciaux = [], []
    for menu_id, (m, p) in sorted(menus.items(), key=lambda kv: ("principal", "accompagnement", "sans_allergene").index(kv[1][0].type)):
        cs = par_menu.get(menu_id, [])
        if not cs:
            continue
        allergenes = sorted({a for _, a in algs.get(p.id, [])})
        base = {
            "menu_id": m.id,
            "plat_nom": p.nom,
            "photo": p.photo,
            "type": m.type,
            "couverts": len(cs),
            "portions": _p(sum(c.tiers for c in cs)),
            "par_portion": {str(t): n for t, n in sorted(Counter(c.tiers for c in cs).items())},
            "ingredients": ings.get(p.id, []),
            "allergenes": allergenes,
            "stock_prevu": _p(m.stock_prevu),
        }
        regimes = Counter((c.eleve.regime or "").strip() for c in cs if (c.eleve.regime or "").strip())
        base["particularites"] = [{"libelle": k, "nb": v} for k, v in regimes.most_common()]
        if m.type == "sans_allergene":
            parent = plats_par_id.get(p.sans_allergene_de) if p.sans_allergene_de else None
            alg_parent = {a for _, a in algs.get(parent.id, [])} if parent else set()
            base["remplace"] = parent.nom if parent else None
            base["evite"] = sorted(alg_parent - set(allergenes))
            base["eleves"] = [
                {
                    "id": c.eleve.id,
                    "nom": c.eleve.nom,
                    "classe": c.eleve.classe,
                    "allergies": list(c.eleve.allergies or []),
                    "regime": c.eleve.regime,
                    "tiers": c.tiers,
                    "vague": c.vague,
                }
                for c in cs
            ]
            speciaux.append(base)
        else:
            classiques.append(base)
    return classiques, speciaux


def _repas_du_jour(db: Session, jour: _date, eleve_ids: list[int]) -> dict[int, Repas]:
    if not eleve_ids:
        return {}
    return {r.eleve_id: r for r in db.scalars(select(Repas).where(Repas.date == jour, Repas.eleve_id.in_(eleve_ids)))}


def service(db: Session, user: User, jour: _date, mode_demande: str | None) -> dict:
    mode, modes, classes = perimetre(db, user, mode_demande)
    couverts, menus, vagues = couverts_du_jour(db, jour, mode, classes)
    classiques, speciaux = agreger(db, couverts, menus, mode)
    repas = _repas_du_jour(db, jour, [c.eleve.id for c in couverts])
    par_vague: dict[str, list[Couvert]] = defaultdict(list)
    for c in couverts:
        par_vague[c.vague].append(c)
    for v in vagues:
        cs = par_vague.get(v["cle"], [])
        v["eleves"] = len(cs)
        v["servis"] = sum(c.servi for c in cs)
        v["evalues"] = sum(1 for c in cs if (r := repas.get(c.eleve.id)) and r.consommation)
        v["speciaux"] = sum(1 for c in cs if c.menu.type == "sans_allergene")
        v["allergiques"] = sum(1 for c in cs if c.eleve.allergies)
    return {
        "date": jour,
        "mode": mode,
        "modes": modes,
        "niveaux": sorted({c.niveau_id for c in classes}),
        "total_eleves": len(couverts),
        "classiques": classiques,
        "speciaux": speciaux,
        "vagues": vagues,
    }


def _eleve_out(c: Couvert, r: Repas | None, place: str | None, menus: dict) -> dict:
    return {
        "id": c.eleve.id,
        "nom": c.eleve.nom,
        "photo": c.eleve.photo,
        "classe": c.eleve.classe,
        "allergies": list(c.eleve.allergies or []),
        "regime": c.eleve.regime,
        "menu_id": c.menu.id,
        "menu_type": c.menu.type,
        "plat_nom": menus[c.menu.id][1].nom,
        "tiers": c.tiers,
        "place": place,
        "servi": c.servi,
        "avis": r.avis if r else None,
        "consommation": r.consommation if r else None,
    }


def _libelles_places(db: Session, ids: list[int]) -> dict[int, str]:
    if not ids:
        return {}
    rows = db.execute(
        select(Place.id, Place.numero, TableSalle.nom).join(TableSalle, TableSalle.id == Place.table_id).where(Place.id.in_(ids))
    ).all()
    return {pid: f"{t} · {n}" for pid, n, t in rows}


def vague(db: Session, user: User, jour: _date, cle: str, mode_demande: str | None) -> dict:
    mode, _, classes = perimetre(db, user, mode_demande)
    couverts, menus, vagues = couverts_du_jour(db, jour, mode, classes)
    idx = next((i for i, v in enumerate(vagues) if v["cle"] == cle), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Vague introuvable.")
    cs = [c for c in couverts if c.vague == cle]
    classiques, speciaux = agreger(db, cs, menus, mode)
    repas = _repas_du_jour(db, jour, [c.eleve.id for c in cs])
    places = _libelles_places(db, [c.place_id for c in cs if c.place_id])
    primaire = mode == "classe"
    return {
        **vagues[idx],
        "mode": mode,
        "primaire": primaire,
        "classiques": classiques,
        "speciaux": speciaux,
        "eleves": [_eleve_out(c, repas.get(c.eleve.id), places.get(c.place_id), menus) for c in cs],
        "precedente": vagues[idx - 1]["cle"] if idx > 0 else None,
        "suivante": vagues[idx + 1]["cle"] if idx + 1 < len(vagues) else None,
    }


def salle(db: Session, user: User, jour: _date, cle: str | None, mode_demande: str | None) -> dict:
    mode, _, classes = perimetre(db, user, mode_demande)
    couverts, menus, vagues = couverts_du_jour(db, jour, mode, classes)
    cle = cle if any(v["cle"] == cle for v in vagues) else (vagues[0]["cle"] if vagues else None)
    cs = [c for c in couverts if c.vague == cle]
    repas = _repas_du_jour(db, jour, [c.eleve.id for c in cs])
    par_place = {c.place_id: c for c in cs if c.place_id}
    tables = db.scalars(select(TableSalle).order_by(TableSalle.nom)).all()
    places = db.scalars(select(Place).order_by(Place.numero)).all()
    places_par_table: dict[int, list[Place]] = defaultdict(list)
    for p in places:
        places_par_table[p.table_id].append(p)
    # Mode classe : on ne montre que les tables de la classe (sinon toute la salle).
    if mode == "classe" and cle:
        ids = set(db.scalars(select(ClasseTable.table_id).where(ClasseTable.classe_id == int(cle[1:]))))
        if ids:
            tables = [t for t in tables if t.id in ids]
    plats = sorted({c.menu.id for c in cs}, key=lambda i: ("principal", "accompagnement", "sans_allergene").index(menus[i][0].type))
    codes = {mid: chr(65 + i) for i, mid in enumerate(plats)}
    return {
        "mode": mode,
        "vague": cle,
        "vagues": [{"cle": v["cle"], "nom": v["nom"], "heure_debut": v["heure_debut"]} for v in vagues],
        "plats": [{"menu_id": mid, "code": codes[mid], "plat_nom": menus[mid][1].nom, "type": menus[mid][0].type} for mid in plats],
        "sans_place": sum(1 for c in cs if not c.place_id),
        "tables": [
            {
                "id": t.id,
                "nom": t.nom,
                "places": [
                    {
                        "id": p.id,
                        "numero": p.numero,
                        "angle": p.angle,
                        "eleve": (
                            {**_eleve_out(c, repas.get(c.eleve.id), f"{t.nom} · {p.numero}", menus), "code": codes[c.menu.id]}
                            if (c := par_place.get(p.id))
                            else None
                        ),
                    }
                    for p in places_par_table[t.id]
                ],
            }
            for t in tables
        ],
    }


# ---------- Retours d'assiettes ----------


def enregistrer_retours(db: Session, user: User, jour: _date, retours: list, mode_demande: str | None) -> list[dict]:
    mode, _, classes = perimetre(db, user, mode_demande)
    couverts, _, _ = couverts_du_jour(db, jour, mode, classes)
    par_eleve = {c.eleve.id: c for c in couverts}
    existants = _repas_du_jour(db, jour, [r.eleve_id for r in retours])
    now = datetime.now().astimezone()
    out, touches = [], set()
    for rt in retours:
        c = par_eleve.get(rt.eleve_id)
        if c is None:
            raise HTTPException(status_code=422, detail="Élève absent du service de ce jour.")
        r = existants.get(rt.eleve_id)
        if r is None:
            r = Repas(eleve_id=c.eleve.id, date=jour, menu_commande_id=c.menu.id, tiers=c.tiers)
            db.add(r)
            existants[rt.eleve_id] = r
        champs = rt.model_fields_set
        if "avis" in champs:
            r.avis = rt.avis
        if "consommation" in champs:
            r.consommation = rt.consommation
            # L'assiette a été récupérée : elle avait donc été servie.
            if rt.consommation and r.menu_servi_id is None:
                r.menu_servi_id = c.menu.id
            touches.add(c.eleve.id)
        r.saisi_par, r.saisi_a = user.id, now
        out.append({"eleve_id": c.eleve.id, "avis": r.avis, "consommation": r.consommation})
    db.flush()
    for eid in touches:
        recalculer_suggestion(db, par_eleve[eid].eleve)
    return out


# ---------- Statistiques et portions ----------


def recalculer_suggestion(db: Session, eleve: Eleve) -> SuggestionPortion | None:
    """Propose (sans jamais appliquer) une adaptation de portion à partir d'au moins MIN_OBS repas."""
    obs = db.scalars(
        select(Repas.consommation)
        .where(Repas.eleve_id == eleve.id, Repas.consommation.is_not(None))
        .order_by(Repas.date.desc())
        .limit(FENETRE)
    ).all()
    en_cours = db.scalars(
        select(SuggestionPortion).where(SuggestionPortion.eleve_id == eleve.id, SuggestionPortion.statut == "proposee")
    ).first()
    actuelle = eleve.portion_defaut or 3
    cible = None
    if len(obs) >= MIN_OBS:
        taux = sum(o == "termine" for o in obs) / len(obs)
        if taux >= SEUIL_HAUT and actuelle < 3:
            cible = actuelle + 1
        elif taux <= SEUIL_BAS and actuelle > 1:
            cible = actuelle - 1
    if cible is None:
        if en_cours:
            db.delete(en_cours)
        return None
    refus_recent = db.scalars(
        select(SuggestionPortion.id).where(
            SuggestionPortion.eleve_id == eleve.id,
            SuggestionPortion.statut == "refusee",
            SuggestionPortion.portion_suggeree == cible,
            SuggestionPortion.traite_a >= datetime.now().astimezone() - timedelta(days=14),
        )
    ).first()
    if refus_recent:
        return None
    if en_cours and en_cours.portion_suggeree == cible:
        en_cours.observations, en_cours.taux = len(obs), round(taux, 3)
        return en_cours
    if en_cours:
        db.delete(en_cours)
    s = SuggestionPortion(
        eleve_id=eleve.id,
        portion_actuelle=actuelle,
        portion_suggeree=cible,
        observations=len(obs),
        taux=round(taux, 3),
        statut="proposee",
    )
    db.add(s)
    db.flush()
    return s


def suggestion_out(s: SuggestionPortion, e: Eleve) -> dict:
    return {
        "id": s.id,
        "eleve": {"id": e.id, "nom": e.nom, "classe": e.classe, "photo": e.photo},
        "portion_actuelle": s.portion_actuelle,
        "portion_suggeree": s.portion_suggeree,
        "observations": s.observations,
        "taux": s.taux,
        "statut": s.statut,
        "created_at": s.created_at,
    }


def stats_eleve(db: Session, eleve_id: int) -> dict:
    e = db.get(Eleve, eleve_id)
    if e is None:
        raise HTTPException(status_code=404, detail="Élève introuvable.")
    repas = db.scalars(select(Repas).where(Repas.eleve_id == e.id).order_by(Repas.date)).all()
    dates_resa = set(
        db.scalars(
            select(MenuJour.date)
            .join(Reservation, Reservation.menu_jour_id == MenuJour.id)
            .where(Reservation.eleve_id == e.id, Reservation.statut != "annulee")
        )
    )
    # Mode classe : chaque repas planifié vaut commande (pas de réservation individuelle).
    commandes = len(dates_resa | {r.date for r in repas})
    termines = sum(r.consommation == "termine" for r in repas)
    non_termines = sum(r.consommation == "non_termine" for r in repas)
    observes = termines + non_termines
    semaines: dict[_date, list[Repas]] = defaultdict(list)
    for r in repas:
        if r.consommation:
            semaines[r.date - timedelta(days=r.date.weekday())].append(r)
    evolution = [
        {
            "semaine": s,
            "observes": len(rs),
            "termines": sum(r.consommation == "termine" for r in rs),
            "taux": round(sum(r.consommation == "termine" for r in rs) / len(rs), 3),
        }
        for s, rs in sorted(semaines.items())[-8:]
    ]
    sugg = db.scalars(
        select(SuggestionPortion).where(SuggestionPortion.eleve_id == e.id, SuggestionPortion.statut == "proposee")
    ).first()
    return {
        "eleve": {
            "id": e.id,
            "nom": e.nom,
            "classe": e.classe,
            "photo": e.photo,
            "allergies": list(e.allergies or []),
            "regime": e.regime,
            "portion_defaut": e.portion_defaut,
        },
        "commandes": commandes,
        "observes": observes,
        "termines": termines,
        "non_termines": non_termines,
        "taux": round(termines / observes, 3) if observes else None,
        "avis_positifs": sum(r.avis == 1 for r in repas),
        "avis_negatifs": sum(r.avis == -1 for r in repas),
        "evolution": evolution,
        "min_observations": MIN_OBS,
        "suggestion": suggestion_out(sugg, e) if sugg else None,
    }
