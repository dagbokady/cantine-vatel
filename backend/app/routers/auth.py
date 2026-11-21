from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..deps import get_db
from ..models import Eleve, User
from ..schemas.auth import (
    LoginRequest,
    ParentRegisterRequest,
    SetPinRequest,
    TokenResponse,
    UserLoginRequest,
    UserTokenResponse,
)
from ..services.auth import (
    authenticate_eleve,
    authenticate_user,
    create_token,
    create_user_token,
    hash_pin,
)

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
    if eleve.pin_hash is not None:
        raise HTTPException(
            status_code=409,
            detail="Ton PIN existe déjà. Demande à ton parent de réactiver ton accès.",
        )
    eleve.pin_hash = hash_pin(body.nouveau_pin)
    db.commit()
    db.refresh(eleve)
    token = create_token(eleve)
    return TokenResponse(
        access_token=token,
        nom=eleve.nom,
        matricule=eleve.matricule,
    )


@router.post("/user/login", response_model=UserTokenResponse)
def user_login(body: UserLoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, body.identifiant, body.mot_de_passe)
    if user is None:
        raise HTTPException(status_code=401, detail="Identifiant ou mot de passe incorrect.")
    return UserTokenResponse(access_token=create_user_token(user), nom=user.nom, role=user.role)


@router.post("/parent/register", response_model=UserTokenResponse, status_code=201)
def parent_register(body: ParentRegisterRequest, db: Session = Depends(get_db)):
    identifiant = body.identifiant.strip().lower()
    if db.scalars(select(User).where(User.identifiant == identifiant)).first():
        raise HTTPException(status_code=409, detail="Un compte existe déjà avec cet identifiant.")
    user = User(
        nom=body.nom.strip(),
        identifiant=identifiant,
        secret_hash=hash_pin(body.mot_de_passe),
        role="parent",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserTokenResponse(access_token=create_user_token(user), nom=user.nom, role=user.role)
