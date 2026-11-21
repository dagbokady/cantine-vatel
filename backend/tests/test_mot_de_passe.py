"""Réinitialisation du mot de passe par e-mail : admin, chef cuisinier et parent."""
import re

import pytest

from app.routers import auth as auth_router


@pytest.fixture
def boite(monkeypatch):
    envoyes = []
    monkeypatch.setattr(auth_router, "envoyer", lambda dest, sujet, texte, html=None: envoyes.append((dest, texte, html)))
    auth_router._derniers_envois.clear()
    return envoyes


@pytest.mark.parametrize("role", ["admin", "cuisine", "parent"])
def test_reinitialisation_par_mail(client, user, boite, role):
    u = user(role)
    r = client.post("/auth/mot-de-passe/oubli", json={"identifiant": u.identifiant.upper()})
    assert r.status_code == 202
    assert len(boite) == 1 and boite[0][0] == u.identifiant
    token = re.search(r"/pro/reinitialiser\?token=(\S+)", boite[0][1]).group(1)
    assert "Choisir mon mot de passe" in boite[0][2]

    assert client.post("/auth/mot-de-passe/reinitialiser", json={"token": token, "mot_de_passe": "nouveau-mdp-2026"}).status_code == 204
    # Lien à usage unique, ancien mot de passe refusé, nouveau accepté.
    assert client.post("/auth/mot-de-passe/reinitialiser", json={"token": token, "mot_de_passe": "encore-un-autre"}).status_code == 400
    assert client.post("/auth/user/login", json={"identifiant": u.identifiant, "mot_de_passe": "motdepasse"}).status_code == 401
    r = client.post("/auth/user/login", json={"identifiant": u.identifiant, "mot_de_passe": "nouveau-mdp-2026"})
    assert r.status_code == 200 and r.json()["role"] == role


@pytest.mark.parametrize("role,actif", [("agent", True), ("enseignant", True), ("admin", False)])
def test_pas_de_mail_hors_roles_ou_compte_inactif(client, user, boite, role, actif):
    u = user(role, actif=actif)
    assert client.post("/auth/mot-de-passe/oubli", json={"identifiant": u.identifiant}).status_code == 202
    assert boite == []


def test_compte_inconnu_meme_reponse_et_anti_rafale(client, user, boite):
    inconnu = client.post("/auth/mot-de-passe/oubli", json={"identifiant": "personne@demo.ci"})
    u = user("parent")
    connu = client.post("/auth/mot-de-passe/oubli", json={"identifiant": u.identifiant})
    assert inconnu.json() == connu.json()
    client.post("/auth/mot-de-passe/oubli", json={"identifiant": u.identifiant})
    assert len(boite) == 1  # deuxième demande dans la minute ignorée


def test_jeton_invalide(client):
    assert client.post("/auth/mot-de-passe/reinitialiser", json={"token": "x" * 40, "mot_de_passe": "nouveau-mdp-2026"}).status_code == 400


def test_envoi_smtp(monkeypatch):
    """Le service mail construit et envoie le message via STARTTLS quand SMTP est configuré."""
    from app.services import mail

    traces = {}

    class FauxSMTP:
        def __init__(self, hote, port, timeout):
            traces["serveur"] = (hote, port)
        def __enter__(self):
            return self
        def __exit__(self, *a):
            return False
        def starttls(self, context):
            traces["tls"] = True
        def login(self, u, p):
            traces["login"] = u
        def send_message(self, msg):
            traces["msg"] = msg

    monkeypatch.setattr(mail.smtplib, "SMTP", FauxSMTP)
    monkeypatch.setattr(mail.settings, "smtp_host", "smtp.exemple.ci")
    monkeypatch.setattr(mail.settings, "smtp_user", "compte")
    mail.envoyer("chef@demo.ci", "Réinitialisation", "texte", "<p>html</p>")
    assert traces["serveur"] == ("smtp.exemple.ci", 587) and traces["tls"] and traces["login"] == "compte"
    assert traces["msg"]["To"] == "chef@demo.ci" and traces["msg"].is_multipart()

