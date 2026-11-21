from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash
from pwdlib.hashers.bcrypt import BcryptHasher
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..models import Eleve

_hasher = PasswordHash((BcryptHasher(),))

ALGORITHM = "HS256"
TOKEN_LIFETIME = timedelta(hours=24)


def verify_pin(plain: str, hashed: str) -> bool:
    return _hasher.verify(plain, hashed)


def hash_pin(pin: str) -> str:
    return _hasher.hash(pin)


def create_token(eleve: Eleve) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(eleve.id),
        "matricule": eleve.matricule,
        "role": "eleve",
        "iat": now,
        "exp": now + TOKEN_LIFETIME,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])


def authenticate_eleve(db: Session, matricule: str, pin: str) -> Eleve | None:
    eleve = db.scalars(select(Eleve).where(Eleve.matricule == matricule)).first()
    if eleve is None:
        return None
    if not verify_pin(pin, eleve.pin_hash):
        return None
    return eleve
