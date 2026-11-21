"""Limitation des tentatives de connexion et configuration de production."""
import pytest

from app.config import Settings
from app.models import Eleve
from app.services.auth import hash_pin


def test_pin_bloque_apres_5_echecs(client, db):
    db.add(Eleve(matricule="99999901T", nom="Test Sécurité", classe="6e A", pin_hash=hash_pin("1234")))
    db.flush()
    for _ in range(5):
        assert client.post("/auth/login", json={"matricule": "99999901T", "pin": "0000"}).status_code == 401
    r = client.post("/auth/login", json={"matricule": "99999901T", "pin": "1234"})
    assert r.status_code == 429
    assert "Retry-After" in r.headers


def test_succes_efface_les_echecs(client, db):
    db.add(Eleve(matricule="99999902T", nom="Test Sécurité", classe="6e A", pin_hash=hash_pin("1234")))
    db.flush()
    for _ in range(4):
        client.post("/auth/login", json={"matricule": "99999902T", "pin": "0000"})
    assert client.post("/auth/login", json={"matricule": "99999902T", "pin": "1234"}).status_code == 200
    assert client.post("/auth/login", json={"matricule": "99999902T", "pin": "0000"}).status_code == 401


def test_limite_par_ip_sur_plusieurs_comptes(client):
    for i in range(20):
        client.post("/auth/user/login", json={"identifiant": f"inconnu{i}@x.ci", "mot_de_passe": "faux1234"})
    r = client.post("/auth/user/login", json={"identifiant": "autre@x.ci", "mot_de_passe": "faux1234"})
    assert r.status_code == 429


def test_production_exige_des_secrets():
    with pytest.raises(RuntimeError):
        Settings(production=True, jwt_secret="change-me", ticket_signing_key="").verifier_production()
    with pytest.raises(RuntimeError, match="DATABASE_URL"):
        Settings(production=True, jwt_secret="x" * 44, ticket_signing_key="y" * 44).verifier_production()
    Settings(
        production=True, jwt_secret="x" * 44, ticket_signing_key="y" * 44,
        database_url="postgresql://u:p@dpg-abc-a/base",
    ).verifier_production()


def test_url_base_render_convertie():
    s = Settings(database_url="postgresql://u:p@hote/base")
    assert s.database_url == "postgresql+psycopg://u:p@hote/base"


def test_cle_ticket_derivee_stable(monkeypatch):
    from app.services import tickets

    monkeypatch.setattr(tickets.settings, "ticket_signing_key", "valeur-aleatoire-generee-par-render")
    tickets._private_key.cache_clear()
    try:
        assert tickets.public_key_pem() == tickets.public_key_pem()
        assert "BEGIN PUBLIC KEY" in tickets.public_key_pem()
    finally:
        tickets._private_key.cache_clear()
