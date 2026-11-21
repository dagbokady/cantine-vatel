"""SEED_DEMO : la démonstration n'est chargée que sur une base sans aucun compte."""
from sqlalchemy import select

from app import seed
from app.models import User


def test_jamais_sur_une_base_utilisee(db, user, monkeypatch):
    user("admin")
    appels = []
    monkeypatch.setattr(seed, "run", appels.append)
    assert seed.charger_demo_si_vide(db) is False
    assert appels == []


def test_charge_la_demo_sur_une_base_vide(db, monkeypatch):
    # Simule une base vide pour le seul test d'existence, puis lance le vrai seed (transaction annulée).
    scalars = db.scalars
    premier = [True]

    def faux_scalars(*a, **k):
        if premier.pop() if premier else False:
            return type("Vide", (), {"first": lambda self: None})()
        return scalars(*a, **k)

    monkeypatch.setattr(db, "scalars", faux_scalars)
    assert seed.charger_demo_si_vide(db) is True
    assert scalars(select(User).where(User.identifiant == "admin@demo.ci")).first() is not None
