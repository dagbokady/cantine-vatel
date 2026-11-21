from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from sqlalchemy.orm import Session

from .db import SessionLocal
from .models import Eleve
from .services.auth import decode_token

_bearer = HTTPBearer()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_eleve(
    creds: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
    db: Annotated[Session, Depends(get_db)],
) -> Eleve:
    try:
        payload = decode_token(creds.credentials)
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré.")
    if payload.get("role") != "eleve":
        raise HTTPException(status_code=403, detail="Accès réservé aux élèves.")
    eleve = db.get(Eleve, int(payload["sub"]))
    if eleve is None:
        raise HTTPException(status_code=401, detail="Élève introuvable.")
    return eleve
