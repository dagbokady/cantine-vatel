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
    eleve_id: int
    montant: int = Field(ge=500, le=100000)
    operateur: str = Field(pattern="^(wave|mtn|orange|moov)$")
    telephone: str = Field(min_length=1, max_length=20)
    cle_idempotence: str = Field(min_length=16, max_length=64, pattern="^[A-Za-z0-9-]+$")
    simuler_echec: bool = False


class RechargeOut(BaseModel):
    reference: str
    statut: str  # en_attente, validee, echouee
    montant: int
    eleve_id: int
    eleve_nom: str
    operateur: str
    telephone_masque: str
    motif_echec: str | None
    created_at: datetime
    solde: int


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
