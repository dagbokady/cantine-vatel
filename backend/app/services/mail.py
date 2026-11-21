"""Envoi d'e-mails : API HTTPS pour Mailjet, sinon SMTP. Sans configuration, contenu écrit dans les logs."""

import logging
import smtplib
import ssl

import certifi
import httpx
from email.message import EmailMessage
from email.utils import parseaddr

from ..config import settings

log = logging.getLogger("cantine.mail")


def _envoyer_mailjet(dest: str, sujet: str, texte: str, html: str | None) -> None:
    """API HTTPS de Mailjet, mêmes identifiants que son SMTP (clé API, clé secrète)."""
    nom, adresse = parseaddr(settings.smtp_from)
    message = {
        "From": {"Email": adresse, "Name": nom or "Cantine Vatel"},
        "To": [{"Email": dest}],
        "Subject": sujet,
        "TextPart": texte,
    }
    if html:
        message["HTMLPart"] = html
    r = httpx.post(
        "https://api.mailjet.com/v3.1/send",
        json={"Messages": [message]},
        auth=(settings.smtp_user, settings.smtp_password),
        timeout=15,
    )
    r.raise_for_status()


def envoyer(dest: str, sujet: str, texte: str, html: str | None = None) -> None:
    # Mailjet par HTTPS : Render gratuit bloque les ports SMTP sortants (25, 465, 587).
    if "mailjet" in settings.smtp_host.lower():
        try:
            _envoyer_mailjet(dest, sujet, texte, html)
        except httpx.HTTPStatusError as exc:
            log.error("Échec d'envoi Mailjet à %s : %s %s", dest, exc.response.status_code, exc.response.text)
        except Exception:
            log.exception("Échec d'envoi Mailjet à %s", dest)
        return
    if not settings.smtp_host:
        log.warning("SMTP non configuré. E-mail pour %s : %s\n%s", dest, sujet, texte)
        return
    msg = EmailMessage()
    msg["From"], msg["To"], msg["Subject"] = settings.smtp_from, dest, sujet
    msg.set_content(texte)
    if html:
        msg.add_alternative(html, subtype="html")
    ctx = ssl.create_default_context(cafile=certifi.where())  # certificats fiables même sur le Python macOS
    try:
        if settings.smtp_ssl:
            with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, context=ctx, timeout=15) as s:
                if settings.smtp_user:
                    s.login(settings.smtp_user, settings.smtp_password)
                s.send_message(msg)
        else:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as s:
                s.starttls(context=ctx)
                if settings.smtp_user:
                    s.login(settings.smtp_user, settings.smtp_password)
                s.send_message(msg)
    except Exception:  # l'utilisateur reçoit la même réponse : on journalise seulement
        log.exception("Échec d'envoi de l'e-mail à %s", dest)
