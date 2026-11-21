"""Tests exécutés dans une transaction annulée à la fin : la base de dev reste intacte."""
from datetime import date, datetime, time

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db import engine
from app.deps import get_db
from app.main import app
from app.models import (
    Creneau, Eleve, Ingredient, IngredientAllergene, Allergene, MenuJour, Place, Plat, PlatElement,
    PlatIngredient, TableSalle, User,
)
from app.services.auth import create_token, create_user_token, hash_pin

JOUR = date(2031, 3, 4)  # jour fictif, sans aucune donnée existante
AVANT_RECRE = datetime.combine(JOUR, time(9, 0))
MIDI = datetime.combine(JOUR, time(12, 30))


@pytest.fixture
def db():
    conn = engine.connect()
    trans = conn.begin()
    session = Session(bind=conn, join_transaction_mode="create_savepoint", autoflush=False)
    try:
        yield session
    finally:
        session.close()
        trans.rollback()
        conn.close()


@pytest.fixture
def client(db):
    app.dependency_overrides[get_db] = lambda: db
    yield TestClient(app)
    app.dependency_overrides.clear()


def _ingredient(db, nom, allergene=None):
    ing = Ingredient(nom=f"test {nom}")
    db.add(ing)
    db.flush()
    if allergene:
        alg = db.query(Allergene).filter_by(nom=allergene).first() or Allergene(nom=allergene)
        db.add(alg)
        db.flush()
        db.add(IngredientAllergene(ingredient_id=ing.id, allergene_id=alg.id))
    return ing


@pytest.fixture
def jeu(db):
    """Plat « Attiéké test » : attiéké (base), poisson obligatoire, piment et alloco facultatifs."""
    attieke = _ingredient(db, "attiéké")
    poisson = _ingredient(db, "poisson", "poisson")
    piment = _ingredient(db, "piment", "piment")
    banane = _ingredient(db, "banane")
    plat = Plat(nom="Attiéké test", prix=1500, prix_tiers1=600, prix_tiers2=1000)
    db.add(plat)
    db.flush()
    db.add(PlatIngredient(plat_id=plat.id, ingredient_id=attieke.id))
    el = {
        "poisson": PlatElement(plat_id=plat.id, ingredient_id=poisson.id, nom="Poisson braisé", obligatoire=True, ordre=0),
        "piment": PlatElement(plat_id=plat.id, ingredient_id=piment.id, nom="Piment", inclus_defaut=True, ordre=1),
        "alloco": PlatElement(plat_id=plat.id, ingredient_id=banane.id, nom="Alloco", inclus_defaut=False, supplement=200, stock_restant=1, ordre=2),
    }
    db.add_all(el.values())
    menu = MenuJour(date=JOUR, plat_id=plat.id, prix=1500, prix_tiers1=600, prix_tiers2=1000, stock_prevu=30, stock_restant=30, type="principal")
    alloco_seul = Plat(nom="Alloco test", prix=500)
    db.add(alloco_seul)
    db.flush()
    accomp = MenuJour(date=JOUR, plat_id=alloco_seul.id, prix=500, stock_prevu=30, stock_restant=30, type="accompagnement")
    db.add_all([menu])
    db.flush()
    db.add(accomp)
    creneau = Creneau(date=JOUR, heure_debut=time(12, 30), heure_fin=time(13, 0), capacite=50)
    table = TableSalle(nom="TZ9", x=0, y=0, nb_places=2)
    db.add_all([creneau, table])
    db.flush()
    places = [Place(table_id=table.id, numero=i, angle=0) for i in (1, 2)]
    db.add_all(places)
    db.flush()
    return {"plat": plat, "menu": menu, "accomp": accomp, "el": el, "creneau": creneau, "places": places}


_n = [0]


@pytest.fixture
def eleve(db):
    def fabrique(allergies=(), solde=10000):
        _n[0] += 1
        e = Eleve(matricule=f"T{_n[0]:08d}", nom=f"Test Élève {_n[0]}", classe="TEST", allergies=list(allergies), solde=solde, pin_hash=hash_pin("1234"))
        db.add(e)
        db.flush()
        return e

    return fabrique


@pytest.fixture
def user(db):
    def fabrique(role, actif=True):
        _n[0] += 1
        u = User(nom=f"Test {role}", identifiant=f"test.{role}.{_n[0]}@demo.ci", secret_hash=hash_pin("motdepasse"), role=role, actif=actif)
        db.add(u)
        db.flush()
        return u

    return fabrique


def entete(u):
    tok = create_user_token(u) if isinstance(u, User) else create_token(u)
    return {"Authorization": f"Bearer {tok}"}
