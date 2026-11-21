"""SEED_DEMO : le chargement de la démonstration ne bloque jamais l'ouverture du port."""
import threading
import time

from fastapi.testclient import TestClient

from app import main, seed
from app.config import settings


def test_seed_en_tache_de_fond(monkeypatch):
    monkeypatch.setattr(settings, "seed_demo", True)
    libere = threading.Event()
    monkeypatch.setattr(seed, "charger_demo_si_vide", lambda db: libere.wait(5) and False)
    monkeypatch.setattr("app.referentiel.charger_referentiel", lambda db: None)

    debut = time.monotonic()
    with TestClient(main.app) as client:
        assert time.monotonic() - debut < 2  # démarré alors que le seed n'est pas fini
        assert client.get("/health").status_code == 200
    libere.set()
