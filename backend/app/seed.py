"""Seed de démonstration — parcours lycéen.

Lancement :
    python -m app.seed
"""
from __future__ import annotations

import math
import random
from datetime import date, time

from pwdlib import PasswordHash
from pwdlib.hashers.bcrypt import BcryptHasher
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from .db import SessionLocal, engine
from .models import (
    Allergene,
    Creneau,
    Eleve,
    Ingredient,
    IngredientAllergene,
    MenuJour,
    Parametres,
    Place,
    Plat,
    PlatIngredient,
    Reservation,
    TableSalle,
    Transaction,
    User,
)

_hasher = PasswordHash((BcryptHasher(),))


def hash_pin(pin: str) -> str:
    return _hasher.hash(pin)


# --------- Données de référence ---------

ALLERGENES = [
    "arachide",
    "gluten",
    "poisson",
    "crustacés",
    "œuf",
    "lait",
    "soja",
    "fruits à coque",
    "piment",
]

# nom ingrédient -> allergènes
INGREDIENTS = {
    "attiéké": [],
    "poisson braisé": ["poisson"],
    "poulet braisé": [],
    "banane plantain": [],
    "huile de palme": [],
    "tomate": [],
    "oignon": [],
    "piment frais": ["piment"],
    "ail": [],
    "gingembre": [],
    "cube maggi": ["gluten", "soja"],
    "sel": [],
    "arachide grillée": ["arachide"],
    "pâte d'arachide": ["arachide"],
    "riz": [],
    "feuille de manioc": [],
    "igname": [],
    "sauce graine": [],
    "farine de blé": ["gluten"],
    "œuf": ["œuf"],
    "lait concentré": ["lait"],
    "crevettes séchées": ["crustacés"],
}

# plats du jour : (nom, prix FCFA, liste ingrédients, type, nom plat principal dont c'est la version sans allergène)
PLATS_JOUR = [
    (
        "Attiéké poisson braisé",
        1500,
        ["attiéké", "poisson braisé", "tomate", "oignon", "piment frais", "huile de palme", "sel"],
        "principal",
        None,
    ),
    (
        "Attiéké poulet braisé (sans poisson)",
        1500,
        ["attiéké", "poulet braisé", "tomate", "oignon", "ail", "huile de palme", "sel"],
        "sans_allergene",
        "Attiéké poisson braisé",
    ),
    (
        "Alloco",
        500,
        ["banane plantain", "huile de palme", "sel"],
        "accompagnement",
        None,
    ),
]

NOMS_LYCEENS = [
    "Kouadio Yao", "Aya Traoré", "N'Guessan Marc", "Fatou Diallo", "Konan Serge",
    "Mariam Koné", "Bakary Touré", "Adjoua Brou", "Ismaël Ouattara", "Chantal Zadi",
    "Boris Kouamé", "Rokia Cissé", "Yannick Gnamien", "Esther Kouassi", "Moussa Sanogo",
    "Grâce Bamba", "Thierry Kakou", "Linda Soro", "Christ Phanuel", "Prisca Yao",
    "Didier N'Dri", "Awa Coulibaly", "Franck Tanoh", "Rachel Loba", "Olivier Assi",
    "Salimata Fofana", "Hervé Bony", "Nadège Konaté", "Patrick Kouassi", "Mireille Aka",
]

CLASSES = ["Seconde A", "Seconde C", "Première D", "Terminale A", "Terminale C", "Terminale D"]


def arrondi_25(n: float) -> int:
    return int(math.ceil(n / 25.0) * 25)


def run(db: Session) -> None:
    # Nettoyage dans l'ordre des dépendances
    db.execute(delete(Reservation))
    db.execute(delete(Transaction))
    db.execute(delete(MenuJour))
    db.execute(delete(Creneau))
    db.execute(delete(PlatIngredient))
    db.execute(delete(Plat))
    db.execute(delete(IngredientAllergene))
    db.execute(delete(Ingredient))
    db.execute(delete(Allergene))
    db.execute(delete(Place))
    db.execute(delete(TableSalle))
    db.execute(delete(Eleve))
    db.execute(delete(User))
    db.execute(delete(Parametres))
    db.flush()

    # Paramètres
    db.add(
        Parametres(
            id=1,
            ouverture_commandes=time(18, 0),
            cloture_commandes=time(10, 0),
            decouvert_max=1500,
        )
    )

    # Allergènes
    allergenes = {nom: Allergene(nom=nom) for nom in ALLERGENES}
    db.add_all(allergenes.values())
    db.flush()

    # Ingrédients + liaisons
    ingredients: dict[str, Ingredient] = {}
    for nom, allergs in INGREDIENTS.items():
        ing = Ingredient(nom=nom)
        db.add(ing)
        ingredients[nom] = ing
    db.flush()

    for nom, allergs in INGREDIENTS.items():
        for a in allergs:
            db.add(
                IngredientAllergene(
                    ingredient_id=ingredients[nom].id,
                    allergene_id=allergenes[a].id,
                )
            )
    db.flush()

    # Plats du jour
    plats_by_name: dict[str, Plat] = {}
    for nom, prix, ings, _type, _parent in PLATS_JOUR:
        p = Plat(nom=nom, prix=prix)
        db.add(p)
        plats_by_name[nom] = p
    db.flush()

    for nom, _prix, ings, _type, parent_nom in PLATS_JOUR:
        if parent_nom:
            plats_by_name[nom].sans_allergene_de = plats_by_name[parent_nom].id
        for i in ings:
            db.add(PlatIngredient(plat_id=plats_by_name[nom].id, ingredient_id=ingredients[i].id))
    db.flush()

    # Menu du jour (aujourd'hui)
    today = date.today()
    menu_by_type: dict[str, MenuJour] = {}
    for nom, prix, _ings, type_, _parent in PLATS_JOUR:
        # Stock exprimé en tiers de portion : 60 portions = 180 tiers pour le principal,
        # 30 portions pour la version sans allergène, 40 pour l'accompagnement.
        portions = {"principal": 60, "sans_allergene": 30, "accompagnement": 40}[type_]
        m = MenuJour(
            date=today,
            plat_id=plats_by_name[nom].id,
            prix=prix,
            stock_prevu=portions * 3,
            stock_restant=portions * 3,
            type=type_,
        )
        db.add(m)
        menu_by_type[nom] = m
    db.flush()

    # Créneaux de 20 min, 12 h 45 -> 14 h 00, capacité 24
    creneaux: list[Creneau] = []
    for h, m in [(12, 45), (13, 5), (13, 25), (13, 45)]:
        fin_h, fin_m = (h, m + 20) if m + 20 < 60 else (h + 1, m + 20 - 60)
        c = Creneau(
            date=today,
            heure_debut=time(h, m),
            heure_fin=time(fin_h, fin_m),
            capacite=24,
        )
        db.add(c)
        creneaux.append(c)
    db.flush()

    # Salle : 8 tables rondes de 6 places, disposées en grille 4x2
    tables: list[TableSalle] = []
    for idx in range(8):
        col = idx % 4
        row = idx // 4
        t = TableSalle(
            nom=f"T{idx + 1}",
            x=120.0 + col * 160.0,
            y=120.0 + row * 200.0,
            nb_places=6,
        )
        db.add(t)
        tables.append(t)
    db.flush()

    places: list[Place] = []
    for t in tables:
        for n in range(6):
            angle = 60.0 * n  # 6 places → 60° entre chacune
            p = Place(table_id=t.id, numero=n + 1, angle=angle)
            db.add(p)
            places.append(p)
    db.flush()

    # Un parent de démo pour Awa
    parent_awa = User(
        nom="Kady Coulibaly",
        identifiant="parent.awa@demo.ci",
        secret_hash=_hasher.hash("motdepasse"),
        role="parent",
    )
    db.add(parent_awa)
    db.flush()

    # Élève Awa (allergique à l'arachide)
    awa = Eleve(
        matricule="LYC-2026-001",
        nom="Awa Coulibaly",
        classe="Terminale D",
        photo=None,
        pin_hash=hash_pin("1234"),
        allergies=["arachide"],
        solde=2000,
        parent_id=parent_awa.id,
    )
    db.add(awa)
    db.flush()
    db.add(Transaction(eleve_id=awa.id, type="recharge", montant=2000, libelle="Recharge de démo"))

    # 30 autres lycéens
    rnd = random.Random(42)
    autres: list[Eleve] = []
    for idx, nom in enumerate(NOMS_LYCEENS, start=2):
        matricule = f"LYC-2026-{idx:03d}"
        allergies: list[str] = []
        # ~1 élève sur 6 a une allergie aléatoire
        if rnd.random() < 0.18:
            allergies = [rnd.choice(["arachide", "poisson", "gluten", "lait"])]
        solde = rnd.choice([500, 1000, 1500, 2000, 2500, 3000])
        e = Eleve(
            matricule=matricule,
            nom=nom,
            classe=rnd.choice(CLASSES),
            photo=None,
            pin_hash=hash_pin("1234"),
            allergies=allergies,
            solde=solde,
            parent_id=None,
        )
        db.add(e)
        autres.append(e)
    db.flush()

    for e in autres:
        db.add(
            Transaction(
                eleve_id=e.id,
                type="recharge",
                montant=e.solde,
                libelle="Recharge initiale",
            )
        )

    # Réservations de démo : ~18 élèves commandent, pour remplir quelques places
    menu_principal = menu_by_type["Attiéké poisson braisé"]
    menu_sans = menu_by_type["Attiéké poulet braisé (sans poisson)"]

    # Places occupées : (creneau_id, place_id)
    occupees: set[tuple[int, int]] = set()
    commandants = rnd.sample(autres, 18)
    for e in commandants:
        # Choix du menu compatible
        if any(a in ("poisson",) for a in e.allergies):
            menu = menu_sans
        else:
            menu = rnd.choice([menu_principal, menu_principal, menu_sans])
        if menu.stock_restant < 3:
            continue

        tiers = rnd.choice([2, 3, 3])  # majorité portion pleine
        prix = arrondi_25(round(menu.prix * tiers / 3))
        if e.solde - prix < -1500:
            continue

        # Créneau et place libres
        creneau = rnd.choice(creneaux)
        libres = [p for p in places if (creneau.id, p.id) not in occupees]
        if not libres:
            continue
        place = rnd.choice(libres)
        occupees.add((creneau.id, place.id))

        res = Reservation(
            eleve_id=e.id,
            menu_jour_id=menu.id,
            creneau_id=creneau.id,
            place_id=place.id,
            tiers=tiers,
            prix=prix,
            statut="commandee",
        )
        db.add(res)
        menu.stock_restant -= tiers
        e.solde -= prix
        db.add(
            Transaction(
                eleve_id=e.id,
                type="debit",
                montant=-prix,
                libelle=f"Commande {menu.id}",
            )
        )

    db.commit()
    n_eleves = db.scalar(select(func.count(Eleve.id)))
    n_res = db.scalar(select(func.count(Reservation.id)))
    print(f"Seed OK : {n_eleves} élèves, {n_res} réservations.")


def main() -> None:
    with SessionLocal() as db:
        run(db)


if __name__ == "__main__":
    main()
