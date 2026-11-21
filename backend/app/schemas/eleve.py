from datetime import date, datetime, time

from pydantic import BaseModel, Field


class MeResponse(BaseModel):
    id: int
    matricule: str
    nom: str
    classe: str
    photo: str | None
    allergies: list[str]
    solde: int


class ElementOption(BaseModel):
    id: int
    nom: str
    obligatoire: bool
    inclus_defaut: bool
    supplement: int
    disponible: bool
    allergenes: list[str]
    bloque: str | None  # raison si l'élément est incompatible avec les allergies de l'élève


class OptionMenu(BaseModel):
    menu_jour_id: int
    plat_id: int
    nom: str
    photo: str | None
    prix: int
    type: str
    stock_restant: int
    ingredients: list[str]
    prix_portions: dict[str, int] = {}
    elements: list[ElementOption] = []
    compatible: bool
    raison: str | None


class MenuDuJourResponse(BaseModel):
    date: date
    commandes_ouvertes: bool
    cloture_commandes: time
    vague_ouverte: bool = False  # jour même, après la récréation
    heure_recreation: time | None = None
    compatibles: list[OptionMenu]
    incompatibles: list[OptionMenu]


class CreneauLite(BaseModel):
    id: int
    heure_debut: time
    heure_fin: time


class CreneauDispo(BaseModel):
    id: int
    heure_debut: time
    heure_fin: time
    capacite: int
    places_restantes: int


class CreneauxJourResponse(BaseModel):
    date: date
    creneaux: list[CreneauDispo]


class PlaceLite(BaseModel):
    id: int
    table_nom: str
    numero: int
    nb_places: int | None = None
    # Chaises de la table (numéro, angle) : la carte de place reprend le plan de salle.
    sieges: list[tuple[int, float]] = []


class PlaceSalle(BaseModel):
    id: int
    numero: int
    angle: float
    etat: str  # "libre" | "prise"


class TableSalleLite(BaseModel):
    id: int
    nom: str
    x: float
    y: float
    nb_places: int
    places: list[PlaceSalle]


class SalleResponse(BaseModel):
    creneau_id: int
    largeur: float
    hauteur: float
    tables: list[TableSalleLite]


class ReservationCreate(BaseModel):
    menu_jour_id: int
    tiers: int
    # Facultatifs : la vague se choisit le jour même, à partir de la récréation.
    creneau_id: int | None = None
    place_id: int | None = None
    # Éléments facultatifs retenus ; absent = composition par défaut du plat.
    elements: list[int] | None = Field(default=None, max_length=30)


class VagueChoix(BaseModel):
    creneau_id: int
    place_id: int


class ReservationCreated(BaseModel):
    id: int
    menu_jour_id: int
    creneau_id: int | None
    place_id: int | None
    tiers: int
    prix: int
    statut: str
    ticket: str | None
    code: str | None = None


class MenuAVenir(BaseModel):
    date: date
    commandable: bool
    compatibles: list["OptionMenu"]
    incompatibles: list["OptionMenu"]


class PublicKeyResponse(BaseModel):
    algorithm: str
    public_key_pem: str


class ReservationDuJourResponse(BaseModel):
    id: int
    menu_jour_id: int
    plat_nom: str
    plat_photo: str | None
    tiers: int
    prix: int
    statut: str
    date: date
    creneau: CreneauLite | None
    place: PlaceLite | None
    ticket: str | None
    code: str | None = None
    composition: list[str] = []
    annulable: bool
    cloture_commandes: time
    vague_a_choisir: bool = False
    choix_vague_ouvert: bool = False
    heure_recreation: time | None = None
    avis: int | None = None


class AvisRequest(BaseModel):
    avis: int = Field(ge=-1, le=1)


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
