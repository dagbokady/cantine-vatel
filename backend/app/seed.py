"""Seed de démonstration — parcours lycéen.

Lancement :
    python -m app.seed
"""
from __future__ import annotations

import math
import random
from datetime import date, datetime, time, timedelta

from pwdlib import PasswordHash
from pwdlib.hashers.bcrypt import BcryptHasher
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from .db import SessionLocal, engine
from .models import (
    AffectationCuisine,
    Allergene,
    Appel,
    ClasseTable,
    Repas,
    SuggestionPortion,
    Classe,
    Niveau,
    Notification,
    Presence,
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
    "citron": [],
    "concombre": [],
    "poisson frit": ["poisson"],
    "viande ou poulet": [],
    "épices": [],
    "poulet": [],
    "aubergine": [],
    "carotte": [],
    "chou": [],
    "manioc": [],
    "graine de palme": [],
    "poisson ou viande": ["poisson"],
}

_WM = "https://commons.wikimedia.org/wiki/Special:FilePath/"
PHOTOS = {
    "Attiéké poisson braisé": _WM + "Atti%C3%A9k%C3%A9%20et%20poisson.jpg?width=800",
    "Attiéké poulet braisé (sans poisson)": _WM + "Atti%C3%A9k%C3%A9%20au%20poulet.jpg?width=800",
    "Alloco poisson": _WM + "Alloco%20Poisson%20braiser.JPG?width=800",
    "Riz sauce arachide": "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=70&auto=format",
    "Kédjénou de poulet": _WM + "Kedjenou%20poulet%20sauce%20claire.JPG?width=800",
    "Riz au gras": _WM + "Riz%20gras%20sommeill%C3%A9%20de%20legumes%20suivis%20d%27un%20poisson%20carpe.jpg?width=800",
    "Foutou sauce graine": "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=70&auto=format",
    "Alloco poulet braisé": _WM + "Alloco%20au%20poulet.jpg?width=800",
}

# Plats du catalogue (cuisine), utilisés dans les menus de la semaine
PLATS_CATALOGUE = [
    ("Alloco poisson", 1500, ["banane plantain", "poisson frit", "oignon", "piment frais", "tomate"], "principal", None),
    ("Kédjénou de poulet", 2000, ["poulet", "tomate", "oignon", "aubergine", "piment frais", "épices"], "principal", None),
    ("Riz au gras", 1500, ["riz", "tomate", "oignon", "carotte", "chou", "viande ou poulet"], "principal", None),
    ("Foutou sauce graine", 2000, ["banane plantain", "manioc", "graine de palme", "poisson ou viande", "épices"], "principal", None),
    ("Alloco poulet braisé", 2000, ["banane plantain", "poulet braisé", "oignon", "tomate", "piment frais"], "principal", None),
]

# plats du jour : (nom, prix FCFA, liste ingrédients, type, nom plat principal dont c'est la version sans allergène)
PLATS_JOUR = [
    (
        "Attiéké poisson braisé",
        2000,
        ["attiéké", "poisson braisé", "oignon", "tomate", "piment frais", "citron"],
        "principal",
        None,
    ),
    (
        "Attiéké poulet braisé (sans poisson)",
        2000,
        ["attiéké", "poulet braisé", "oignon", "tomate", "piment frais", "concombre"],
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

# Plats de la semaine (hors aujourd'hui) : même format que PLATS_JOUR
PLATS_SEMAINE = [
    (
        "Riz sauce arachide",
        1500,
        ["riz", "pâte d'arachide", "tomate", "oignon", "viande ou poulet", "épices"],
        "principal",
        None,
    ),
    (
        "Riz sauce tomate (sans arachide)",
        1500,
        ["riz", "poulet braisé", "tomate", "oignon", "ail", "sel"],
        "sans_allergene",
        "Riz sauce arachide",
    ),
]

NOMS_CM1 = ["Yasmine Ouattara", "Kevin Brou", "Grâce Kassi", "Ismaël Sanogo", "Prisca Zadi", "Ange Dosso", "Nadia Coulibaly", "Fabrice Assi"]

NOMS_PRIMAIRE = [
    "Inès Koffi", "Junior Kouamé", "Aïcha Diabaté", "Samuel Yapi", "Océane Gbagbo",
    "Hamed Bamba", "Lucie N'Goran", "Mohamed Koné", "Divine Aka", "Emmanuel Tra",
]

# Comptes de démo (mot de passe commun : motdepasse)
COMPTES = [
    ("Admin Vatel", "admin@demo.ci", "admin"),
    ("Chef Konan", "cuisine@demo.ci", "cuisine"),
    ("Agent Yao", "agent@demo.ci", "agent"),
    ("Mme Touré", "enseignant@demo.ci", "enseignant"),
]

CLASSES = ["Seconde A", "Seconde C", "Première D", "Terminale A", "Terminale C", "Terminale D"]


def arrondi_25(n: float) -> int:
    return int(math.ceil(n / 25.0) * 25)


def run(db: Session) -> None:
    # Nettoyage dans l'ordre des dépendances
    db.execute(delete(SuggestionPortion))
    db.execute(delete(Repas))
    db.execute(delete(ClasseTable))
    db.execute(delete(AffectationCuisine))
    db.execute(delete(Presence))
    db.execute(delete(Appel))
    db.execute(delete(Notification))
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
    db.execute(delete(Classe))
    db.execute(delete(Niveau))
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
            delai_preparation_min=60,
            heure_recreation=time(10, 0),
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
    for nom, prix, ings, _type, _parent in PLATS_JOUR + PLATS_SEMAINE + PLATS_CATALOGUE:
        p = Plat(nom=nom, prix=prix, photo=PHOTOS.get(nom))
        db.add(p)
        plats_by_name[nom] = p
    db.flush()

    for nom, _prix, ings, _type, parent_nom in PLATS_JOUR + PLATS_SEMAINE + PLATS_CATALOGUE:
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

    # Menus des autres jours ouvrés de la semaine (consultables par les parents)
    lundi = today - timedelta(days=today.weekday())
    for k in range(5):
        jour = lundi + timedelta(days=k)
        if jour == today:
            continue
        plats_jour = PLATS_SEMAINE if k % 2 == 0 else [PLATS_CATALOGUE[k % len(PLATS_CATALOGUE)]]
        for nom, prix, _ings, type_, _parent in plats_jour:
            portions = 60 if type_ == "principal" else 30
            db.add(
                MenuJour(
                    date=jour,
                    plat_id=plats_by_name[nom].id,
                    prix=prix,
                    stock_prevu=portions * 3,
                    stock_restant=portions * 3,
                    type=type_,
                )
            )
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

    # Comptes personnel
    comptes: dict[str, User] = {}
    for nom, ident, role in COMPTES:
        u = User(nom=nom, identifiant=ident, secret_hash=_hasher.hash("motdepasse"), role=role)
        db.add(u)
        comptes[role] = u
    db.flush()

    # Niveaux et classes (mode par niveau)
    niv_primaire = Niveau(nom="Primaire", mode="classe")
    niv_college = Niveau(nom="Collège", mode="commande")
    niv_lycee = Niveau(nom="Lycée", mode="commande")
    db.add_all([niv_primaire, niv_college, niv_lycee])
    db.flush()
    cm2 = Classe(nom="CM2 A", niveau_id=niv_primaire.id, enseignant_id=comptes["enseignant"].id, heure_passage=time(11, 45))
    cm1 = Classe(nom="CM1 B", niveau_id=niv_primaire.id, heure_passage=time(11, 30))
    db.add_all([cm2, cm1])
    for c in CLASSES:
        db.add(Classe(nom=c, niveau_id=niv_lycee.id))
    db.flush()

    # Deux cuisiniers : l'un en mode commande (collège, lycée), l'autre en mode classe (primaire)
    cheffe = User(nom="Cheffe Adjoua", identifiant="cuisine.primaire@demo.ci", secret_hash=_hasher.hash("motdepasse"), role="cuisine")
    db.add(cheffe)
    db.flush()
    db.add_all([
        AffectationCuisine(user_id=comptes["cuisine"].id, niveau_id=niv_college.id),
        AffectationCuisine(user_id=comptes["cuisine"].id, niveau_id=niv_lycee.id),
        AffectationCuisine(user_id=cheffe.id, niveau_id=niv_primaire.id),
    ])

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
        matricule="12026001L",
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
        matricule = f"12026{idx:03d}L"
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

    # Élèves de primaire (mode Classe : pas de connexion élève)
    for idx, nom in enumerate(NOMS_PRIMAIRE, start=1):
        db.add(
            Eleve(
                matricule=f"22026{idx:03d}P",
                nom=nom,
                classe="CM2 A",
                photo=None,
                pin_hash=None,
                allergies=["arachide"] if idx in (2, 7) else (["gluten"] if idx == 5 else []),
                solde=0,
                parent_id=None,
            )
        )
    for idx, nom in enumerate(NOMS_CM1, start=1):
        db.add(
            Eleve(
                matricule=f"220261{idx:02d}P",
                nom=nom,
                classe="CM1 B",
                pin_hash=None,
                allergies=["poisson"] if idx == 3 else [],
                regime="sans porc" if idx in (4, 6) else None,
                solde=0,
            )
        )
    db.flush()

    # Mode classe : tables réservées (CM1 B en T5-T6, CM2 A en T7-T8)
    for cl, noms in ((cm1, ("T5", "T6")), (cm2, ("T7", "T8"))):
        for t in tables:
            if t.nom in noms:
                db.add(ClasseTable(classe_id=cl.id, table_id=t.id))

    # Historique de retours d'assiettes du primaire (3 semaines) pour alimenter les statistiques
    profils = {"Junior Kouamé": 0.95, "Divine Aka": 0.15, "Kevin Brou": 0.2}
    for e in db.scalars(select(Eleve).where(Eleve.classe.in_(["CM2 A", "CM1 B"]))):
        p_fini = profils.get(e.nom, 0.7)
        if e.nom == "Junior Kouamé":
            e.portion_defaut = 2
        for k in range(1, 22):
            jour = today - timedelta(days=k)
            if jour.weekday() >= 5:
                continue
            db.add(Repas(
                eleve_id=e.id, date=jour, tiers=e.portion_defaut or 3,
                consommation="termine" if rnd.random() < p_fini else "non_termine",
                avis=1 if rnd.random() < 0.75 else -1,
            ))
    db.flush()
    from .services.service_cuisine import recalculer_suggestion
    for e in db.scalars(select(Eleve).where(Eleve.classe.in_(["CM2 A", "CM1 B"]))):
        recalculer_suggestion(db, e)

    # Réservations de démo : ~18 élèves commandent, pour remplir quelques places
    menu_principal = menu_by_type["Attiéké poisson braisé"]
    menu_sans = menu_by_type["Attiéké poulet braisé (sans poisson)"]

    # Places occupées : (creneau_id, place_id)
    occupees: set[tuple[int, int]] = set()

    # Aperçu complet pour 12026001L (Awa) et 12026002L
    eleve2 = next(e for e in autres if e.matricule == "12026002L")
    demo_eleves(db, awa, eleve2, parent_awa, plats_by_name, creneaux, places, menu_by_type, occupees, today)

    commandants = rnd.sample([e for e in autres if e is not eleve2], 18)
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
    print("Comptes (mot de passe : motdepasse) : " + ", ".join(c[1] for c in COMPTES) + ", cuisine.primaire@demo.ci, parent.awa@demo.ci, parent.kouadio@demo.ci")


def demo_eleves(db, awa, eleve2, parent_awa, plats_by_name, creneaux, places, menu_by_type, occupees, today):
    """Historique de plusieurs semaines, parents, notifications et commande du jour."""
    parent2 = User(
        nom="Yao Kouadio Père",
        identifiant="parent.kouadio@demo.ci",
        secret_hash=_hasher.hash("motdepasse"),
        role="parent",
    )
    db.add(parent2)
    db.flush()
    eleve2.parent_id = parent2.id
    eleve2.allergies = ["poisson"]
    eleve2.regime = "Sans porc"
    awa.regime = "Pas de piment fort"

    def tx(e, type_, montant, libelle, quand):
        db.add(Transaction(eleve_id=e.id, type=type_, montant=montant, libelle=libelle, created_at=quand))

    def notif(parent, e, message, quand, lue=True):
        db.add(Notification(parent_id=parent.id, eleve_id=e.id, message=message, created_at=quand, lue=lue))

    # Jours ouvrés passés (3 semaines)
    jours = []
    d = today - timedelta(days=1)
    while len(jours) < 15:
        if d.weekday() < 5:
            jours.append(d)
        d -= timedelta(days=1)
    jours.reverse()

    menus_existants = {
        (m.date, m.plat_id): m for m in db.scalars(select(MenuJour).where(MenuJour.date < today))
    }

    def menu(jour, nom, type_):
        plat = plats_by_name[nom]
        m = menus_existants.get((jour, plat.id))
        if m is None:
            m = MenuJour(date=jour, plat_id=plat.id, prix=plat.prix, stock_prevu=180 if type_ == "principal" else 90,
                         stock_restant=0, type=type_)
            db.add(m)
            db.flush()
            menus_existants[(jour, plat.id)] = m
        return m

    soldes = {awa.id: awa.solde, eleve2.id: eleve2.solde}  # recharges initiales déjà en base
    profils = [(awa, parent_awa, 15000), (eleve2, parent2, 12000)]
    for e, parent, recharge in profils:
        quand = datetime.combine(jours[0] - timedelta(days=3), time(19, 30)).astimezone()
        tx(e, "recharge", recharge, "Recharge mobile money (simulée)", quand)
        soldes[e.id] += recharge
        notif(parent, e, f"Recharge de {recharge} F validée.", quand)

    for k, jour in enumerate(jours):
        c = Creneau(date=jour, heure_debut=time(12, 45), heure_fin=time(13, 5), capacite=24)
        db.add(c)
        db.flush()
        semaine_riz = (jour.isocalendar().week + k) % 2 == 0
        principal = ("Riz sauce arachide", "principal") if semaine_riz else ("Attiéké poisson braisé", "principal")
        sans = ("Riz sauce tomate (sans arachide)", "sans_allergene") if semaine_riz else ("Attiéké poulet braisé (sans poisson)", "sans_allergene")
        for idx, (e, parent, _r) in enumerate(profils):
            if k % 5 == 4 and e is eleve2:
                continue  # jour sans cantine
            # Awa : arachide → version sans arachide les jours de riz ; 002 : poisson → sans poisson
            allergique = ("arachide" in e.allergies and semaine_riz) or ("poisson" in e.allergies and not semaine_riz)
            nom, type_ = sans if allergique else principal
            m = menu(jour, nom, type_)
            tiers = [3, 2, 3, 2, 3][k % 5] if e is awa else [3, 3, 2][k % 3]
            prix = arrondi_25(m.prix * tiers / 3)
            commande = datetime.combine(jour - timedelta(days=1), time(20, 10 + idx)).astimezone()
            annulee = e is awa and k == 6
            servie = datetime.combine(jour, time(12, 48 + idx * 3)).astimezone()
            db.add(Reservation(eleve_id=e.id, menu_jour_id=m.id, creneau_id=c.id, place_id=places[idx * 7].id,
                               tiers=tiers, prix=prix, statut="annulee" if annulee else "servie",
                               created_at=commande, servie_a=None if annulee else servie))
            soldes[e.id] -= prix
            tx(e, "debit", -prix, f"Réservation {nom} ({tiers}/3)", commande)
            prenom = e.nom.split()[0]
            if annulee:
                quand = datetime.combine(jour, time(8, 30)).astimezone()
                soldes[e.id] += prix
                tx(e, "remboursement", prix, f"Annulation {nom} ({tiers}/3)", quand)
                notif(parent, e, f"{prenom} a annulé sa commande du {jour.strftime('%d/%m')} : {prix} F remboursés.", quand)
            else:
                notif(parent, e, f"{prenom} a déjeuné à {servie.strftime('%H h %M')} : {nom} ({tiers}/3).", servie)
        if k == 7:
            for e, parent, recharge in profils:
                quand = datetime.combine(jour, time(18, 0)).astimezone()
                tx(e, "recharge", 10000, "Recharge mobile money (simulée)", quand)
                soldes[e.id] += 10000
                notif(parent, e, "Recharge de 10000 F validée.", quand)
    db.flush()

    awa.solde = soldes[awa.id]
    eleve2.solde = soldes[eleve2.id]

    # Commande du jour d'Awa (écran récapitulatif + ticket)
    m = menu_by_type["Attiéké poisson braisé"]
    c, place = creneaux[0], places[0]
    occupees.add((c.id, place.id))
    commande = datetime.combine(today - timedelta(days=1), time(20, 5)).astimezone()
    db.add(Reservation(eleve_id=awa.id, menu_jour_id=m.id, creneau_id=c.id, place_id=place.id,
                       tiers=2, prix=arrondi_25(m.prix * 2 / 3), statut="commandee", created_at=commande))
    m.stock_restant -= 2
    prix_awa = arrondi_25(m.prix * 2 / 3)
    awa.solde -= prix_awa
    tx(awa, "debit", -prix_awa, "Réservation Attiéké poisson braisé (2/3)", commande)
    notif(parent_awa, awa, f"Awa a commandé Attiéké poisson braisé (2/3) pour 12 h 45. Solde : {awa.solde} F.", commande, lue=False)
    notif(parent2, eleve2, f"Solde de Kouadio : {eleve2.solde} F.", datetime.now().astimezone(), lue=False)


def main() -> None:
    with SessionLocal() as db:
        run(db)


if __name__ == "__main__":
    main()
