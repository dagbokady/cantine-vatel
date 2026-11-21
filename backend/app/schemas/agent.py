from datetime import time

from pydantic import BaseModel


class ServirRequest(BaseModel):
    ticket: str


class EleveComptoir(BaseModel):
    nom: str
    classe: str
    photo: str | None
    allergies: list[str]


class ServirResponse(BaseModel):
    ok: bool
    raison: str | None = None
    eleve: EleveComptoir | None = None
    plat_nom: str | None = None
    plat_photo: str | None = None
    tiers: int | None = None
    table_nom: str | None = None
    place_numero: int | None = None
    heure_debut: time | None = None
    heure_fin: time | None = None


class ServiceDuJour(BaseModel):
    commandes: int
    servies: int
