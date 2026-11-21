"""Référentiel d'allergènes et d'ingrédients.

Base large chargée au démarrage (idempotent) : le parent coche un allergène ou un aliment
sans avoir à le créer, et la cuisine retrouve les ingrédients courants déjà liés à leurs allergènes.

Exécution manuelle : python -m app.referentiel
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Allergene, Ingredient, IngredientAllergene

# catégorie -> allergènes (ou aliments à éviter)
ALLERGENES_PAR_CATEGORIE: dict[str, list[str]] = {
    "Allergènes majeurs": [
        "arachide", "gluten", "lait", "œuf", "poisson", "crustacés", "mollusques", "soja",
        "fruits à coque", "sésame", "céleri", "moutarde", "lupin", "sulfites",
    ],
    "Fruits": [
        "agrumes", "ananas", "avocat", "banane", "fraise", "kiwi", "mangue", "noix de coco",
        "papaye", "pêche", "pomme", "raisin", "fruit de la passion", "goyave",
    ],
    "Légumes et légumineuses": [
        "tomate", "aubergine", "poivron", "gombo", "carotte", "pois", "haricot", "lentille",
        "pois chiche", "maïs", "manioc", "champignon", "épinard", "chou",
    ],
    "Viandes": ["porc", "bœuf", "volaille", "agneau et mouton", "abats", "gibier"],
    "Épices et condiments": [
        "piment", "poivre", "ail", "oignon", "gingembre", "cannelle", "curry", "muscade",
        "glutamate", "vinaigre", "cacao", "coriandre",
    ],
    "Autres": ["miel", "levure", "gélatine", "colorants", "caféine", "huile de palme", "alcool"],
}

TOUS_ALLERGENES = [a for liste in ALLERGENES_PAR_CATEGORIE.values() for a in liste]
CATEGORIE_DE = {a: c for c, liste in ALLERGENES_PAR_CATEGORIE.items() for a in liste}

# ingrédient -> allergènes qu'il porte
INGREDIENTS: dict[str, list[str]] = {
    # Féculents et céréales
    "riz": [], "riz parfumé": [], "attiéké": ["manioc"], "manioc": ["manioc"], "gari": ["manioc"],
    "foutou banane": ["banane"], "foutou igname": [], "placali": ["manioc"], "kabato": ["maïs"],
    "igname": [], "banane plantain": ["banane"], "patate douce": [], "pomme de terre": [],
    "taro": [], "fonio": [], "mil": [], "sorgho": [], "maïs": ["maïs"], "semoule de maïs": ["maïs"],
    "farine de maïs": ["maïs"], "farine de blé": ["gluten"], "pain": ["gluten", "levure"],
    "pain de mie": ["gluten", "lait", "levure"], "pâtes": ["gluten", "œuf"], "spaghetti": ["gluten"],
    "macaroni": ["gluten"], "couscous": ["gluten"], "semoule de blé": ["gluten"], "boulgour": ["gluten"],
    "avoine": ["gluten"], "orge": ["gluten"], "seigle": ["gluten"], "chapelure": ["gluten"],
    "biscuit": ["gluten", "lait", "œuf"], "pâte feuilletée": ["gluten", "lait"], "crêpe": ["gluten", "lait", "œuf"],
    # Légumes
    "tomate": ["tomate"], "concentré de tomate": ["tomate"], "oignon": ["oignon"], "échalote": ["oignon"],
    "poireau": [], "ail": ["ail"], "aubergine": ["aubergine"], "aubergine locale (gnangnan)": ["aubergine"],
    "gombo": ["gombo"], "poivron": ["poivron"], "carotte": ["carotte"], "chou": ["chou"], "chou-fleur": ["chou"],
    "brocoli": ["chou"], "concombre": [], "courgette": [], "laitue": [], "épinard": ["épinard"],
    "feuille de manioc": ["manioc"], "feuille de patate": [], "feuille de baobab": [], "haricot vert": ["haricot"],
    "petits pois": ["pois"], "betterave": [], "navet": [], "champignon": ["champignon"], "céleri": ["céleri"],
    "persil": [], "coriandre": ["coriandre"], "basilic": [], "menthe": [], "citronnelle": [],
    # Légumineuses
    "haricot rouge": ["haricot"], "haricot blanc": ["haricot"], "niébé": ["haricot"], "lentille": ["lentille"],
    "pois chiche": ["pois chiche"], "soja": ["soja"], "tofu": ["soja"], "sauce soja": ["soja", "gluten"],
    "lupin": ["lupin"],
    # Fruits
    "citron": ["agrumes"], "orange": ["agrumes"], "pamplemousse": ["agrumes"], "mandarine": ["agrumes"],
    "ananas": ["ananas"], "mangue": ["mangue"], "papaye": ["papaye"], "banane douce": ["banane"],
    "avocat": ["avocat"], "pastèque": [], "melon": [], "fraise": ["fraise"], "kiwi": ["kiwi"], "pomme": ["pomme"],
    "poire": [], "raisin": ["raisin"], "raisin sec": ["raisin", "sulfites"], "pêche": ["pêche"],
    "abricot": [], "goyave": ["goyave"], "fruit de la passion": ["fruit de la passion"], "corossol": [],
    "noix de coco": ["noix de coco"], "lait de coco": ["noix de coco"], "bissap (hibiscus)": [],
    "tamarin": [], "baobab (pain de singe)": [],
    # Viandes et volailles
    "poulet": ["volaille"], "poulet braisé": ["volaille"], "poulet bicyclette": ["volaille"],
    "dinde": ["volaille"], "pintade": ["volaille"], "canard": ["volaille"], "bœuf": ["bœuf"],
    "viande hachée": ["bœuf"], "veau": ["bœuf"], "mouton": ["agneau et mouton"], "agneau": ["agneau et mouton"],
    "chèvre": ["agneau et mouton"], "porc": ["porc"], "lardons": ["porc"], "jambon": ["porc"],
    "saucisse": ["porc"], "merguez": ["bœuf", "agneau et mouton"], "foie": ["abats"], "tripes": ["abats"],
    "agouti": ["gibier"], "lapin": ["gibier"], "escargot": ["mollusques"],
    "viande ou poulet": ["bœuf", "volaille"],
    # Poissons et fruits de mer
    "poisson": ["poisson"], "poisson braisé": ["poisson"], "poisson frit": ["poisson"], "poisson fumé": ["poisson"],
    "poisson séché": ["poisson"], "thon": ["poisson"], "sardine": ["poisson"], "maquereau": ["poisson"],
    "tilapia": ["poisson"], "capitaine": ["poisson"], "carpe": ["poisson"], "saumon": ["poisson"],
    "anchois": ["poisson"], "colin": ["poisson"], "poisson ou viande": ["poisson", "bœuf"],
    "crevettes": ["crustacés"], "crevettes séchées": ["crustacés"], "crabe": ["crustacés"],
    "langouste": ["crustacés"], "écrevisse": ["crustacés"], "moules": ["mollusques"],
    "calamar": ["mollusques"], "huître": ["mollusques"], "poulpe": ["mollusques"],
    # Œufs et produits laitiers
    "œuf": ["œuf"], "mayonnaise": ["œuf", "moutarde"], "lait": ["lait"], "lait concentré": ["lait"],
    "lait en poudre": ["lait"], "beurre": ["lait"], "crème fraîche": ["lait"], "fromage": ["lait"],
    "fromage râpé": ["lait"], "yaourt": ["lait"], "dèguè": ["lait", "maïs"], "lait caillé": ["lait"],
    # Oléagineux et fruits à coque
    "arachide": ["arachide"], "arachide grillée": ["arachide"], "pâte d'arachide": ["arachide"],
    "huile d'arachide": ["arachide"], "noix de cajou": ["fruits à coque"], "amande": ["fruits à coque"],
    "noisette": ["fruits à coque"], "noix": ["fruits à coque"], "pistache": ["fruits à coque"],
    "sésame": ["sésame"], "huile de sésame": ["sésame"], "graine de courge (pistache locale)": [],
    "graine de palme": [], "sauce graine": [],
    # Huiles et matières grasses
    "huile de palme": ["huile de palme"], "huile végétale": [], "huile de tournesol": [],
    "huile d'olive": [], "huile de soja": ["soja"], "margarine": ["lait", "soja"],
    # Épices, sauces et condiments
    "sel": [], "poivre": ["poivre"], "piment": ["piment"], "piment frais": ["piment"], "piment sec": ["piment"],
    "gingembre": ["gingembre"], "cannelle": ["cannelle"], "muscade": ["muscade"], "curry": ["curry", "moutarde", "céleri"],
    "cumin": [], "clou de girofle": [], "laurier": [], "thym": [], "soumbala": ["haricot"],
    "cube maggi": ["gluten", "soja", "glutamate"], "bouillon cube": ["gluten", "glutamate", "céleri"],
    "moutarde": ["moutarde"], "ketchup": ["tomate", "vinaigre"], "vinaigre": ["vinaigre", "sulfites"],
    "sauce tomate": ["tomate"], "épices": [], "akpi (djansang)": [], "ail en poudre": ["ail"],
    # Sucré et divers
    "sucre": [], "miel": ["miel"], "chocolat": ["cacao", "lait", "soja"], "cacao": ["cacao"],
    "vanille": [], "levure": ["levure"], "levure chimique": [], "gélatine": ["gélatine", "porc"],
    "colorant alimentaire": ["colorants"], "café": ["caféine"], "thé": ["caféine"], "jus de fruits": ["agrumes"],
    "boisson gazeuse": ["caféine", "colorants"], "confiture": ["sulfites"], "vin de cuisine": ["alcool", "sulfites"],
}


def charger_referentiel(db: Session) -> int:
    """Ajoute les allergènes, ingrédients et liaisons manquants. Ne supprime rien. Renvoie le nombre d'ajouts."""
    ajouts = 0
    algs = {a.nom: a for a in db.scalars(select(Allergene))}
    for nom in TOUS_ALLERGENES:
        if nom not in algs:
            algs[nom] = Allergene(nom=nom)
            db.add(algs[nom])
            ajouts += 1
    ings = {i.nom: i for i in db.scalars(select(Ingredient))}
    for nom in INGREDIENTS:
        if nom not in ings:
            ings[nom] = Ingredient(nom=nom)
            db.add(ings[nom])
            ajouts += 1
    db.flush()
    liens = set(db.execute(select(IngredientAllergene.ingredient_id, IngredientAllergene.allergene_id)).all())
    for nom, allergs in INGREDIENTS.items():
        for a in allergs:
            cle = (ings[nom].id, algs[a].id)
            if cle not in liens:
                db.add(IngredientAllergene(ingredient_id=cle[0], allergene_id=cle[1]))
                liens.add(cle)
                ajouts += 1
    db.commit()
    return ajouts


if __name__ == "__main__":
    from .db import SessionLocal

    with SessionLocal() as s:
        print(f"Référentiel : {charger_referentiel(s)} ajout(s).")
