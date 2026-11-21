import time
from html import escape

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..deps import get_db
from ..models import Eleve, User
from ..schemas.auth import (
    LoginRequest,
    MotDePasseOubliRequest,
    ReinitialisationRequest,
    ParentRegisterRequest,
    SetPinRequest,
    TokenResponse,
    UserLoginRequest,
    UserTokenResponse,
)
from ..services.scolarite import normaliser_matricule
from ..services.auth import (
    authenticate_eleve,
    authenticate_user,
    create_token,
    ROLES_RESET,
    create_reset_token,
    create_user_token,
    hash_pin,
    user_from_reset_token,
)
from ..config import settings
from ..services.mail import envoyer
from ..services import limites

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    matricule = normaliser_matricule(body.matricule)
    compte = f"eleve:{matricule}"
    limites.verifier(request, compte)
    eleve = authenticate_eleve(db, matricule, body.pin)
    if eleve is None:
        limites.echec(request, compte)
        raise HTTPException(status_code=401, detail="Matricule ou PIN incorrect.")
    limites.succes(compte)
    token = create_token(eleve)
    return TokenResponse(
        access_token=token,
        nom=eleve.nom,
        matricule=eleve.matricule,
    )


@router.post("/pin", response_model=TokenResponse)
def set_pin(body: SetPinRequest, request: Request, db: Session = Depends(get_db)):
    limites.verifier(request, "pin")
    eleve = db.scalars(select(Eleve).where(Eleve.matricule == normaliser_matricule(body.matricule))).first()
    if eleve is None:
        limites.echec(request, "pin")
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
def user_login(body: UserLoginRequest, request: Request, db: Session = Depends(get_db)):
    compte = f"user:{body.identifiant.strip().lower()}"
    limites.verifier(request, compte)
    user = authenticate_user(db, body.identifiant, body.mot_de_passe)
    if user is None:
        limites.echec(request, compte)
        raise HTTPException(status_code=401, detail="Identifiant ou mot de passe incorrect.")
    limites.succes(compte)
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


_derniers_envois: dict[str, float] = {}


@router.post("/mot-de-passe/oubli", status_code=202)
def mot_de_passe_oubli(body: MotDePasseOubliRequest, taches: BackgroundTasks, db: Session = Depends(get_db)):
    """Envoie un lien de réinitialisation (admin, cuisine, parent). Réponse identique que le compte existe ou non."""
    identifiant = body.identifiant.strip().lower()
    maintenant = time.monotonic()
    recent = maintenant - _derniers_envois.get(identifiant, -1e9) < 60
    user = db.scalars(select(User).where(User.identifiant == identifiant)).first()
    if not recent and user and user.actif and user.role in ROLES_RESET and "@" in identifiant:
        _derniers_envois[identifiant] = maintenant
        lien = f"{settings.url_publique}/pro/reinitialiser?token={create_reset_token(user)}"
        texte = (
            f"Bonjour {user.nom},\n\nPour choisir un nouveau mot de passe Cantine Vatel, ouvrez ce lien "
            f"(valable 30 minutes, une seule fois) :\n{lien}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail."
        )
        html = (
            f'<div style="font-family:Inter,Arial,sans-serif;color:#222222;max-width:480px">'
            f'<p style="color:#FF5A5F;font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase">Cantine Vatel</p>'
            f'<h1 style="font-size:24px">Nouveau mot de passe</h1>'
            f"<p>Bonjour {escape(user.nom)},</p><p>Ce lien est valable 30 minutes et ne sert qu'une fois.</p>"
            f'<p><a href="{escape(lien)}" style="display:inline-block;background:#222222;color:#FFFFFF;padding:14px 24px;'
            f'border-radius:999px;text-decoration:none;font-weight:600">Choisir mon mot de passe</a></p>'
            f'<p style="color:#717171;font-size:13px">Si vous n\'êtes pas à l\'origine de cette demande, ignorez cet e-mail.</p></div>'
        )
        taches.add_task(envoyer, identifiant, "Réinitialisation de votre mot de passe", texte, html)
    return {"detail": "Si un compte correspond à cette adresse, un e-mail vient d'être envoyé."}


@router.post("/mot-de-passe/reinitialiser", status_code=204)
def reinitialiser_mot_de_passe(body: ReinitialisationRequest, db: Session = Depends(get_db)):
    user = user_from_reset_token(db, body.token)
    if user is None:
        raise HTTPException(status_code=400, detail="Lien invalide ou expiré. Refaites une demande.")
    user.secret_hash = hash_pin(body.mot_de_passe)
    db.commit()
