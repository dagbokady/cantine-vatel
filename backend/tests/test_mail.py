"""Mailjet passe par son API HTTPS (ports SMTP bloqués sur Render gratuit)."""
import httpx

from app.config import settings
from app.services import mail


def test_mailjet_par_api_https(monkeypatch):
    monkeypatch.setattr(settings, "smtp_host", "in-v3.mailjet.com")
    monkeypatch.setattr(settings, "smtp_user", "cle")
    monkeypatch.setattr(settings, "smtp_password", "secret")
    monkeypatch.setattr(settings, "smtp_from", "Cantine Vatel <contact@exemple.ci>")
    envois = []

    def faux_post(url, json, auth, timeout):
        envois.append((url, json, auth))
        return httpx.Response(200, request=httpx.Request("POST", url))

    monkeypatch.setattr(mail.httpx, "post", faux_post)
    monkeypatch.setattr(mail.smtplib, "SMTP", lambda *a, **k: (_ for _ in ()).throw(AssertionError("SMTP utilisé")))
    mail.envoyer("parent@exemple.ci", "Sujet", "Texte", "<p>Html</p>")

    url, corps, auth = envois[0]
    assert url == "https://api.mailjet.com/v3.1/send"
    assert auth == ("cle", "secret")
    message = corps["Messages"][0]
    assert message["From"] == {"Email": "contact@exemple.ci", "Name": "Cantine Vatel"}
    assert message["To"] == [{"Email": "parent@exemple.ci"}]
    assert message["HTMLPart"] == "<p>Html</p>"
