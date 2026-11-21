"""Code de secours à 6 caractères associé à une réservation.

Alphabet sans caractères ambigus (ni 0/O, ni 1/I) : 32^6 ≈ 1 milliard de combinaisons,
tirées par `secrets`. L'unicité parmi les réservations non annulées est garantie par
un index unique partiel ; le code ne contient ni n'expose aucun jeton.
"""
from __future__ import annotations

import re
import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Reservation

ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
LONGUEUR = 6
_FORMAT = re.compile(f"^[{ALPHABET}]{{{LONGUEUR}}}$")


def normaliser_code(saisie: str) -> str | None:
    """Majuscules, espaces et tirets retirés ; None si le format est impossible."""
    c = re.sub(r"[\s-]", "", saisie or "").upper()
    return c if _FORMAT.match(c) else None


def nouveau_code(db: Session) -> str:
    for _ in range(20):
        code = "".join(secrets.choice(ALPHABET) for _ in range(LONGUEUR))
        if db.scalar(select(Reservation.id).where(Reservation.code == code, Reservation.statut != "annulee")) is None:
            return code
    raise RuntimeError("Impossible de générer un code de secours unique.")
