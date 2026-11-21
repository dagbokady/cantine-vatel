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
