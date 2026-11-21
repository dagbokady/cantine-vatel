"""Signature Ed25519 des tickets de réservation.

La clé privée est en PEM (PKCS8) dans TICKET_SIGNING_KEY. Si elle est vide,
une clé est générée en mémoire au premier appel — pratique en dev, à éviter
en prod (le ticket devient invérifiable après redémarrage).
"""
from __future__ import annotations

import base64
import hashlib
import json
from functools import lru_cache

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)

from ..config import settings


@lru_cache(maxsize=1)
def _private_key() -> Ed25519PrivateKey:
    pem = (settings.ticket_signing_key or "").strip()
    if not pem:
        return Ed25519PrivateKey.generate()
    if "BEGIN" not in pem:
        # Valeur aléatoire (ex. générée par Render) : la graine de 32 octets en est dérivée.
        return Ed25519PrivateKey.from_private_bytes(hashlib.sha256(pem.encode()).digest())
    key = serialization.load_pem_private_key(pem.encode(), password=None)
    if not isinstance(key, Ed25519PrivateKey):
        raise RuntimeError("TICKET_SIGNING_KEY n'est pas une clé Ed25519.")
    return key


def public_key_pem() -> str:
    pub: Ed25519PublicKey = _private_key().public_key()
    return pub.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode()


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def sign_ticket(payload: dict) -> str:
    """Retourne `<b64(payload)>.<b64(signature)>`."""
    body = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    sig = _private_key().sign(body)
    return f"{_b64url(body)}.{_b64url(sig)}"


def ticket_pour(reservation, eleve, menu_date) -> str:
    """Ticket QR signé : commande, élève, date, créneau, place, plat, portion."""
    return sign_ticket(
        {
            "reservation_id": reservation.id,
            "eleve_id": eleve.id,
            "matricule": eleve.matricule,
            "date": menu_date.isoformat(),
            "menu_jour_id": reservation.menu_jour_id,
            "creneau_id": reservation.creneau_id,
            "place_id": reservation.place_id,
            "tiers": reservation.tiers,
            "prix": reservation.prix,
            "iat": int(reservation.created_at.timestamp()),
        }
    )


def _b64url_decode(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def verify_ticket(ticket: str) -> dict | None:
    """Retourne le payload si la signature est valide, sinon None."""
    try:
        body_b64, sig_b64 = ticket.strip().split(".")
        body = _b64url_decode(body_b64)
        _private_key().public_key().verify(_b64url_decode(sig_b64), body)
        return json.loads(body)
    except Exception:
        return None
