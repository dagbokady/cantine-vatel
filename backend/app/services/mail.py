"""Envoi d'e-mails (SMTP). Sans configuration, le contenu est écrit dans les logs (développement)."""

import logging
import smtplib
import ssl

import certifi
from email.message import EmailMessage

from ..config import settings

log = logging.getLogger("cantine.mail")


def envoyer(dest: str, sujet: str, texte: str, html: str | None = None) -> None:
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
