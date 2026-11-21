"""Signature Ed25519 des tickets de réservation.

La clé privée est en PEM (PKCS8) dans TICKET_SIGNING_KEY. Si elle est vide,
une clé est générée en mémoire au premier appel — pratique en dev, à éviter
en prod (le ticket devient invérifiable après redémarrage).
"""
from __future__ import annotations

import base64
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
