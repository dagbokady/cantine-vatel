from datetime import date, datetime, time

from pydantic import BaseModel


class MeResponse(BaseModel):
    id: int
    matricule: str
    nom: str
    classe: str
    photo: str | None
    allergies: list[str]
    solde: int


class OptionMenu(BaseModel):
    menu_jour_id: int
    plat_id: int
    nom: str
    photo: str | None
    prix: int
    type: str
    stock_restant: int
    ingredients: list[str]
    compatible: bool
    raison: str | None


class MenuDuJourResponse(BaseModel):
    date: date
    commandes_ouvertes: bool
    cloture_commandes: time
    compatibles: list[OptionMenu]
    incompatibles: list[OptionMenu]


class CreneauLite(BaseModel):
    id: int
    heure_debut: time
    heure_fin: time


class PlaceLite(BaseModel):
    id: int
    table_nom: str
    numero: int


class ReservationDuJourResponse(BaseModel):
    id: int
    menu_jour_id: int
    plat_nom: str
    plat_photo: str | None
    tiers: int
    prix: int
    statut: str
    creneau: CreneauLite
    place: PlaceLite


class HistoriqueReservation(BaseModel):
    id: int
    date: date
    plat_nom: str
    tiers: int
    prix: int
    statut: str


class HistoriqueTransaction(BaseModel):
    id: int
    created_at: datetime
    type: str
    montant: int
    libelle: str


class HistoriqueResponse(BaseModel):
    reservations: list[HistoriqueReservation]
    transactions: list[HistoriqueTransaction]
