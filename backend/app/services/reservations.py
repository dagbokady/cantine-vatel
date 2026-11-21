"""Création d'une réservation en une seule transaction verrouillée.

Toutes les vérifications métier sont faites sous verrou pour éviter les
courses (place prise, créneau plein, stock épuisé, double réservation). Une
erreur métier remonte en HTTP 409 avec un message en français.
"""
from __future__ import annotations

from datetime import date as _date
from datetime import datetime, time, timedelta

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import (
    Allergene,
    Creneau,
    Eleve,
    Ingredient,
    IngredientAllergene,
    MenuJour,
    Parametres,
    Place,
    Plat,
    PlatIngredient,
    Reservation,
    Transaction,
)
from ..utils.prix import prix_menu
from .codes import nouveau_code
from .composition import composer, enregistrer_composition, rendre_stock_composition
from .notifications import notifier, notifier_solde


def heure_limite(debut: time, delai_min: int) -> time:
    """Dernière heure de commande pour une vague : début de la vague moins le délai de préparation."""
    limite = datetime.combine(_date.today(), debut) - timedelta(minutes=delai_min)
    return limite.time() if limite.date() == _date.today() else time.min


def _hh(t: time) -> str:
    return t.strftime("%H h %M")


def _conflit(msg: str) -> HTTPException:
    return HTTPException(status_code=409, detail=msg)


def _allergenes_du_plat(db: Session, plat_id: int) -> set[str]:
    rows = db.execute(
        select(Allergene.nom)
        .join(IngredientAllergene, IngredientAllergene.allergene_id == Allergene.id)
        .join(Ingredient, Ingredient.id == IngredientAllergene.ingredient_id)
        .join(PlatIngredient, PlatIngredient.ingredient_id == Ingredient.id)
        .where(PlatIngredient.plat_id == plat_id)
    ).all()
    return {a.lower() for (a,) in rows}


def jour_de_commande(db: Session, params: Parametres, now: datetime) -> tuple[_date | None, bool]:
    """Date pour laquelle l'élève peut commander maintenant, et si le choix de vague est ouvert.

    - Le jour même : jusqu'à l'heure limite de la dernière vague (début moins délai de préparation).
    - La veille : à partir de l'ouverture des commandes (ex. 18 h), sans choix de vague.
    Le choix de la vague n'ouvre que le jour même, à partir de la récréation.
    """
    today = now.date()
    dernier = db.scalar(select(func.max(Creneau.heure_debut)).where(Creneau.date == today))
    if dernier is not None and now.time() < heure_limite(dernier, params.delai_preparation_min):
        return today, now.time() >= params.heure_recreation
    if now.time() >= params.ouverture_commandes:
        return today + timedelta(days=1), False
    if dernier is None and db.scalars(select(MenuJour.id).where(MenuJour.date == today)).first():
        return today, False  # menu publié mais aucune vague encore définie
    return None, False


def _reserver_vague(db: Session, params: Parametres, res: Reservation, creneau_id: int, place_id: int, now: datetime) -> Creneau:
    """Attribue vague et place sous verrou : jour même, après la récréation, avant l'heure limite."""
    today = now.date()
    if now.time() < params.heure_recreation:
        raise _conflit(f"Le choix de la vague ouvre à la récréation, à {_hh(params.heure_recreation)}.")
    creneau = db.execute(select(Creneau).where(Creneau.id == creneau_id).with_for_update()).scalar_one_or_none()
    if creneau is None or creneau.date != today:
        raise _conflit("Vague indisponible aujourd'hui.")
    # Délai de préparation réglé par la cuisine, vérifié ici et non seulement dans l'interface.
    limite = heure_limite(creneau.heure_debut, params.delai_preparation_min)
    if now.time() >= limite:
        raise _conflit(
            f"Commandes closes pour la vague de {_hh(creneau.heure_debut)} depuis {_hh(limite)} : choisis une vague plus tard."
        )
    occ = db.scalar(
        select(func.count(Reservation.id)).where(Reservation.creneau_id == creneau.id, Reservation.statut != "annulee")
    )
    if occ >= creneau.capacite:
        raise _conflit("Cette vague est complète.")
    place = db.execute(select(Place).where(Place.id == place_id).with_for_update()).scalar_one_or_none()
    if place is None:
        raise _conflit("Place introuvable.")
    prise = db.execute(
        select(Reservation.id).where(
            Reservation.place_id == place.id, Reservation.creneau_id == creneau.id, Reservation.statut != "annulee"
        )
    ).first()
    if prise is not None:
        raise _conflit("Cette place vient d'être prise, choisis-en une autre.")
    res.creneau_id, res.place_id = creneau.id, place.id
    return creneau


def creer_reservation(
    db: Session,
    eleve: Eleve,
    *,
    menu_jour_id: int,
    tiers: int,
    now: datetime,
    creneau_id: int | None = None,
    place_id: int | None = None,
    elements: list[int] | None = None,
) -> Reservation:
    if tiers not in (1, 2, 3):
        raise _conflit("Portion invalide.")
    if (creneau_id is None) != (place_id is None):
        raise _conflit("Choisis à la fois une vague et une place.")

    params = db.get(Parametres, 1)
    if params is None:
        raise _conflit("Paramètres indisponibles.")
    jour, _ = jour_de_commande(db, params, now)

    # Verrou sur l'élève (pour empêcher double-débit concurrent).
    db.execute(select(Eleve).where(Eleve.id == eleve.id).with_for_update()).scalar_one()

    # Menu verrouillé pour MAJ du stock.
    menu = db.execute(select(MenuJour).where(MenuJour.id == menu_jour_id).with_for_update()).scalar_one_or_none()
    if menu is None or jour is None or menu.date != jour:
        raise _conflit("Les commandes ne sont pas ouvertes pour ce plat.")
    # Un accompagnement se choisit dans la composition d'un plat, jamais seul.
    if menu.type == "accompagnement":
        raise _conflit("Choisis d'abord un plat principal : l'accompagnement se personnalise dans ton plat.")

    # Une seule réservation active par jour de repas.
    deja = db.execute(
        select(Reservation.id)
        .join(MenuJour, MenuJour.id == Reservation.menu_jour_id)
        .where(Reservation.eleve_id == eleve.id, MenuJour.date == menu.date, Reservation.statut != "annulee")
    ).first()
    if deja is not None:
        raise _conflit("Tu as déjà une commande pour ce jour.")
    if menu.stock_restant < tiers:
        raise _conflit("Stock insuffisant pour cette portion.")

    plat = db.get(Plat, menu.plat_id)
    if plat is None:
        raise _conflit("Plat introuvable.")

    # Allergies vérifiées côté serveur sur la composition finale : aucun contournement possible.
    allergies_eleve = {a.lower() for a in (eleve.allergies or [])}
    retenus, supplements = composer(db, plat.id, elements, allergies_eleve, _allergenes_du_plat(db, plat.id))

    if eleve.solde < 0:
        raise _conflit("Ton solde est négatif : demande à ton parent de recharger.")
    prix = prix_menu(menu, tiers) + supplements
    solde_apres = eleve.solde - prix
    if solde_apres < -params.decouvert_max:
        raise _conflit("Solde insuffisant pour cette portion.")

    reservation = Reservation(
        eleve_id=eleve.id, menu_jour_id=menu.id, tiers=tiers, prix=prix, statut="commandee", code=nouveau_code(db)
    )
    creneau = None
    if creneau_id is not None:
        if menu.date != now.date():
            raise _conflit("La vague se choisit le jour même.")
        creneau = _reserver_vague(db, params, reservation, creneau_id, place_id, now)

    menu.stock_restant -= tiers
    eleve.solde = solde_apres
    db.add(reservation)
    db.flush()
    enregistrer_composition(db, reservation.id, retenus)
    db.add(Transaction(eleve_id=eleve.id, type="debit", montant=-prix, libelle=f"Réservation {plat.nom} ({tiers}/3)"))
    quand = f"pour {_hh(creneau.heure_debut)}" if creneau else f"pour le {menu.date.strftime('%d/%m')}"
    notifier(db, eleve, f"{eleve.nom.split()[0]} a commandé {plat.nom} ({tiers}/3) {quand}.")
    notifier_solde(db, eleve)

    db.flush()
    return reservation


def choisir_vague(db: Session, eleve: Eleve, reservation_id: int, creneau_id: int, place_id: int, now: datetime) -> Reservation:
    """Le jour même, à partir de la récréation : l'élève rattache sa commande à une vague et une place."""
    params = db.get(Parametres, 1)
    if params is None:
        raise _conflit("Paramètres indisponibles.")
    res = db.execute(
        select(Reservation).where(Reservation.id == reservation_id, Reservation.eleve_id == eleve.id).with_for_update()
    ).scalar_one_or_none()
    if res is None:
        raise HTTPException(status_code=404, detail="Commande introuvable.")
    menu = db.get(MenuJour, res.menu_jour_id)
    if res.statut != "commandee" or menu is None or menu.date != now.date():
        raise _conflit("Cette commande ne peut plus recevoir de vague.")
    if res.creneau_id is not None:
        raise _conflit("Ta vague est déjà choisie.")
    _reserver_vague(db, params, res, creneau_id, place_id, now)
    db.flush()
    return res


def annuler_reservation(
    db: Session, eleve: Eleve, reservation_id: int, now: datetime
) -> Reservation:
    """Annule, rembourse, rend le stock et libère la place (R6 : avant la clôture)."""
    params = db.get(Parametres, 1)
    if params is None:
        raise _conflit("Paramètres indisponibles.")

    db.execute(select(Eleve).where(Eleve.id == eleve.id).with_for_update()).scalar_one()
    res = db.execute(
        select(Reservation)
        .where(Reservation.id == reservation_id, Reservation.eleve_id == eleve.id)
        .with_for_update()
    ).scalar_one_or_none()
    if res is None:
        raise HTTPException(status_code=404, detail="Réservation introuvable.")
    if res.statut != "commandee":
        raise _conflit("Cette réservation ne peut plus être annulée.")

    menu = db.execute(
        select(MenuJour).where(MenuJour.id == res.menu_jour_id).with_for_update()
    ).scalar_one()
    # Commande pour un jour futur : annulable ; le jour même : avant la clôture principale.
    if menu.date < now.date() or (menu.date == now.date() and now.time() >= params.cloture_commandes):
        raise _conflit(
            f"Annulation impossible après {params.cloture_commandes.strftime('%H h %M')}."
        )

    plat = db.get(Plat, menu.plat_id)
    menu.stock_restant += res.tiers
    rendre_stock_composition(db, res.id)
    eleve.solde += res.prix
    res.statut = "annulee"
    db.add(
        Transaction(
            eleve_id=eleve.id,
            type="remboursement",
            montant=res.prix,
            libelle=f"Annulation {plat.nom if plat else ''} ({res.tiers}/3)".strip(),
        )
    )
    db.flush()
    return res
