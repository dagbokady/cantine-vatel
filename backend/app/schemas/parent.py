from datetime import date, datetime

from pydantic import BaseModel, Field


class EnfantOut(BaseModel):
    id: int
    nom: str
    classe: str
    matricule: str
    photo: str | None
    allergies: list[str]
    regime: str | None
    solde: int
    acces_actif: bool


class EnfantVerif(BaseModel):
    nom: str
    classe: str


class RattacherRequest(BaseModel):
    matricule: str


class AllergiesRequest(BaseModel):
    allergies: list[str]
    regime: str | None = Field(default=None, max_length=80)


class RechargeRequest(BaseModel):
    montant: int = Field(ge=500, le=100000)


class PaiementOut(BaseModel):
    reference: str
    statut: str
    montant: int
    solde: int


class WebhookRequest(BaseModel):
    reference: str


class RepasOut(BaseModel):
    id: int
    date: date
    plat_nom: str
    ingredients: list[str]
    allergenes: list[str]
    tiers: int
    prix: int
    statut: str
    servie_a: datetime | None


class TransactionOut(BaseModel):
    id: int
    created_at: datetime
    type: str
    montant: int
    libelle: str
    statut: str


class HistoriqueEnfant(BaseModel):
    repas: list[RepasOut]
    transactions: list[TransactionOut]


class PlatMenu(BaseModel):
    nom: str
    type: str
    prix: int
    ingredients: list[str]
    allergenes: list[str]
    photo: str | None = None


class JourMenu(BaseModel):
    date: date
    plats: list[PlatMenu]


class NotificationOut(BaseModel):
    id: int
    message: str
    lue: bool
    created_at: datetime
