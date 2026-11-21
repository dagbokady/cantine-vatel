from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    matricule: str
    pin: str = Field(min_length=4, max_length=6)


class SetPinRequest(BaseModel):
    matricule: str
    nouveau_pin: str = Field(min_length=4, max_length=6)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    nom: str
    matricule: str


class UserLoginRequest(BaseModel):
    identifiant: str
    mot_de_passe: str = Field(min_length=4, max_length=128)


class ParentRegisterRequest(BaseModel):
    nom: str = Field(min_length=2, max_length=120)
    identifiant: str = Field(min_length=3, max_length=120)
    mot_de_passe: str = Field(min_length=6, max_length=128)


class UserTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    nom: str
    role: str


class MotDePasseOubliRequest(BaseModel):
    identifiant: str = Field(min_length=3, max_length=120)


class ReinitialisationRequest(BaseModel):
    token: str = Field(min_length=20, max_length=1000)
    mot_de_passe: str = Field(min_length=8, max_length=128)
