"""Ajoute des plats commandables pour tester avec les élèves, sans rien effacer.

Lancement :
    python -m app.seed_tests              # menus + vagues sur 8 jours
    python -m app.seed_tests --recharger  # + recharge de test des élèves à faible solde

Idempotent : relancer le script complète les stocks sans créer de doublons.
"""
from __future__ import annotations

import sys
from datetime import date, datetime, time, timedelta

from sqlalchemy import select

from .db import SessionLocal
from .models import Creneau, Eleve, Ingredient, MenuJour, Plat, PlatElement, PlatIngredient, Transaction

JOURS = 8  # aujourd'hui + 7 jours
PORTIONS = {"principal": 60, "sans_allergene": 30, "accompagnement": 40}

# Rotation des menus : (nom du plat, type)
ROTATION = [
    [
        ("Attiéké poisson braisé", "principal"),
        ("Attiéké poulet braisé (sans poisson)", "sans_allergene"),
        ("Kédjénou de poulet", "principal"),
    ],
    [
        ("Riz sauce arachide", "principal"),
        ("Riz sauce tomate (sans arachide)", "sans_allergene"),
        ("Alloco poulet braisé", "principal"),
    ],
    [
        ("Foutou sauce graine", "principal"),
        ("Riz au gras", "principal"),
        ("Attiéké poulet braisé (sans poisson)", "sans_allergene"),
    ],
    [
        ("Alloco poisson", "principal"),
        ("Riz sauce tomate (sans arachide)", "sans_allergene"),
        ("Riz au gras", "principal"),
    ],
]

# Composition des plats : (élément, ingrédient, obligatoire, inclus par défaut, supplément FCFA).
# L'ingrédient d'un élément sort de la base du plat : l'élève peut alors le retirer.
COMPOSITIONS = {
    "Attiéké poisson braisé": [
        ("Attiéké", "attiéké", True, True, 0),
        ("Poisson braisé", "poisson braisé", True, True, 0),
        ("Piment", "piment frais", False, True, 0),
        ("Alloco", "banane plantain", False, False, 250),
    ],
    "Attiéké poulet braisé (sans poisson)": [
        ("Attiéké", "attiéké", True, True, 0),
        ("Poulet braisé", "poulet braisé", True, True, 0),
        ("Piment", "piment frais", False, True, 0),
        ("Alloco", "banane plantain", False, False, 250),
    ],
    "Riz sauce arachide": [
        ("Riz", "riz", True, True, 0),
        ("Sauce arachide", "pâte d'arachide", True, True, 0),
        ("Alloco", "banane plantain", False, False, 250),
    ],
    "Riz sauce tomate (sans arachide)": [
        ("Riz", "riz", True, True, 0),
        ("Alloco", "banane plantain", False, False, 250),
    ],
    "Kédjénou de poulet": [("Piment", "piment frais", False, True, 0)],
    "Alloco poulet braisé": [("Piment", "piment frais", False, True, 0)],
    "Alloco poisson": [("Piment", "piment frais", False, True, 0)],
}


def appliquer_compositions(db) -> int:
    """Idempotent : n'ajoute que les éléments absents, sans toucher à ceux réglés par la cuisine."""
    ings = {i.nom: i for i in db.scalars(select(Ingredient))}
    ajoutes = 0
    for nom_plat, elements in COMPOSITIONS.items():
        plat = db.scalars(select(Plat).where(Plat.nom == nom_plat)).first()
        if plat is None:
            continue
        deja = {e.nom for e in db.scalars(select(PlatElement).where(PlatElement.plat_id == plat.id))}
        for ordre, (nom, ing, oblig, defaut, supp) in enumerate(elements):
            if nom in deja or ing not in ings:
                continue
            db.query(PlatIngredient).filter_by(plat_id=plat.id, ingredient_id=ings[ing].id).delete()
            db.add(PlatElement(plat_id=plat.id, ingredient_id=ings[ing].id, nom=nom, obligatoire=oblig,
                               inclus_defaut=defaut, supplement=supp, ordre=ordre))
            ajoutes += 1
    db.flush()
    return ajoutes


VAGUES_MIDI = [(12, 45), (13, 5), (13, 25), (13, 45)]
SOLDE_TEST = 10000


def _plus_20(h: int, m: int) -> time:
    total = h * 60 + m + 20
    return time(total // 60 % 24, total % 60)


def _vagues_du_jour(jour: date, now: datetime) -> list[tuple[int, int]]:
    """Aujourd'hui : vagues toutes les 20 min jusqu'à 22 h pour pouvoir commander maintenant."""
    if jour != now.date():
        return VAGUES_MIDI
    vagues = list(VAGUES_MIDI)
    h, m = 14, 5
    while h < 22:
        vagues.append((h, m))
        t = _plus_20(h, m)
        h, m = t.hour, t.minute
    return vagues


def run(db, recharger: bool) -> None:
    now = datetime.now()
    today = now.date()
    plats = {p.nom: p for p in db.scalars(select(Plat))}
    manquants = {nom for menu in ROTATION for nom, _ in menu} - plats.keys()
    if manquants:
        raise SystemExit(f"Plats absents du catalogue (lancer d'abord python -m app.seed) : {sorted(manquants)}")

    elements = appliquer_compositions(db)
    menus_ajoutes = stocks_completes = vagues_ajoutees = 0
    for k in range(JOURS):
        jour = today + timedelta(days=k)
        existants = {m.plat_id: m for m in db.scalars(select(MenuJour).where(MenuJour.date == jour))}
        for nom, type_ in ROTATION[jour.toordinal() % len(ROTATION)]:
            plat = plats[nom]
            tiers = PORTIONS[type_] * 3
            m = existants.get(plat.id)
            if m is None:
                db.add(MenuJour(date=jour, plat_id=plat.id, prix=plat.prix, prix_tiers1=plat.prix_tiers1,
                                prix_tiers2=plat.prix_tiers2, stock_prevu=tiers, stock_restant=tiers, type=type_))
                menus_ajoutes += 1
            elif m.stock_restant < tiers // 2:
                m.stock_prevu += tiers - m.stock_restant
                m.stock_restant = tiers
                stocks_completes += 1

        heures = set(db.scalars(select(Creneau.heure_debut).where(Creneau.date == jour)))
        for h, mi in _vagues_du_jour(jour, now):
            if time(h, mi) not in heures:
                db.add(Creneau(date=jour, heure_debut=time(h, mi), heure_fin=_plus_20(h, mi), capacite=24))
                vagues_ajoutees += 1

    recharges = 0
    if recharger:
        for e in db.scalars(select(Eleve).where(Eleve.solde < SOLDE_TEST // 2)):
            montant = SOLDE_TEST - e.solde
            e.solde = SOLDE_TEST
            db.add(Transaction(eleve_id=e.id, type="recharge", montant=montant, libelle="Recharge de test",
                               statut="validee", traitee_a=now.astimezone()))
            recharges += 1

    db.commit()
    print(f"Éléments de composition ajoutés : {elements} · Menus ajoutés : {menus_ajoutes} · stocks complétés : {stocks_completes} · "
          f"vagues ajoutées : {vagues_ajoutees} · élèves rechargés : {recharges}")


def main() -> None:
    with SessionLocal() as db:
        run(db, recharger="--recharger" in sys.argv)


if __name__ == "__main__":
    main()
