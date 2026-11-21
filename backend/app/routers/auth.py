from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..deps import get_db
from ..models import Eleve
from ..schemas.auth import LoginRequest, SetPinRequest, TokenResponse
from ..services.auth import authenticate_eleve, create_token, hash_pin

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    eleve = authenticate_eleve(db, body.matricule, body.pin)
    if eleve is None:
        raise HTTPException(status_code=401, detail="Matricule ou PIN incorrect.")
    token = create_token(eleve)
    return TokenResponse(
        access_token=token,
        nom=eleve.nom,
        matricule=eleve.matricule,
    )


@router.post("/pin", response_model=TokenResponse)
def set_pin(body: SetPinRequest, db: Session = Depends(get_db)):
    eleve = db.scalars(select(Eleve).where(Eleve.matricule == body.matricule)).first()
    if eleve is None:
        raise HTTPException(status_code=404, detail="Matricule inconnu.")
    eleve.pin_hash = hash_pin(body.nouveau_pin)
    db.commit()
    db.refresh(eleve)
    token = create_token(eleve)
    return TokenResponse(
        access_token=token,
        nom=eleve.nom,
        matricule=eleve.matricule,
    )
