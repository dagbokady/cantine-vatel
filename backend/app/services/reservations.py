"""Création d'une réservation en une seule transaction verrouillée.

Toutes les vérifications métier sont faites sous verrou pour éviter les
courses (place prise, créneau plein, stock épuisé, double réservation). Une
erreur métier remonte en HTTP 409 avec un message en français.
"""
from __future__ import annotations

from datetime import date as _date
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import select
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
from ..utils.prix import prix_portion
from .notifications import notifier, notifier_solde


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


def creer_reservation(
    db: Session,
    eleve: Eleve,
    *,
    menu_jour_id: int,
    creneau_id: int,
    place_id: int,
    tiers: int,
    now: datetime,
) -> Reservation:
    if tiers not in (1, 2, 3):
        raise _conflit("Portion invalide.")

    params = db.get(Parametres, 1)
    if params is None:
        raise _conflit("Paramètres indisponibles.")
    apres_cloture = now.time() >= params.cloture_commandes  # R5 : stock restant, avant le créneau

    today = _date.today()

    # Verrou sur l'élève (pour empêcher double-débit concurrent).
    db.execute(
        select(Eleve).where(Eleve.id == eleve.id).with_for_update()
    ).scalar_one()

    # Une seule réservation active par jour.
    deja = db.execute(
        select(Reservation.id)
        .join(MenuJour, MenuJour.id == Reservation.menu_jour_id)
        .where(
            Reservation.eleve_id == eleve.id,
            MenuJour.date == today,
            Reservation.statut != "annulee",
        )
    ).first()
    if deja is not None:
        raise _conflit("Tu as déjà une réservation pour aujourd'hui.")

    # Menu du jour verrouillé pour MAJ du stock.
    menu = db.execute(
        select(MenuJour).where(MenuJour.id == menu_jour_id).with_for_update()
    ).scalar_one_or_none()
    if menu is None or menu.date != today:
        raise _conflit("Plat indisponible aujourd'hui.")
    if menu.stock_restant < tiers:
        raise _conflit("Stock insuffisant pour cette portion.")

    plat = db.get(Plat, menu.plat_id)
    if plat is None:
        raise _conflit("Plat introuvable.")

    # Allergies vérifiées côté serveur, l'élève n'a aucun droit de contournement.
    allergies_eleve = {a.lower() for a in (eleve.allergies or [])}
    conflit_alg = _allergenes_du_plat(db, plat.id) & allergies_eleve
    if conflit_alg:
        raise _conflit(
            f"Ce plat contient un allergène déclaré : {next(iter(conflit_alg))}."
        )

    # Créneau verrouillé pour recompter la capacité.
    creneau = db.execute(
        select(Creneau).where(Creneau.id == creneau_id).with_for_update()
    ).scalar_one_or_none()
    if creneau is None or creneau.date != today:
        raise _conflit("Créneau indisponible.")
    if apres_cloture and now.time() >= creneau.heure_debut:
        raise _conflit("Ce créneau a déjà commencé : choisis un créneau plus tard.")
    occ = db.execute(
        select(Reservation.id).where(
            Reservation.creneau_id == creneau.id,
            Reservation.statut != "annulee",
        )
    ).all()
    if len(occ) >= creneau.capacite:
        raise _conflit("Ce créneau est complet.")

    # Place verrouillée + unicité (place, créneau).
    place = db.execute(
        select(Place).where(Place.id == place_id).with_for_update()
    ).scalar_one_or_none()
    if place is None:
        raise _conflit("Place introuvable.")
    prise = db.execute(
        select(Reservation.id).where(
            Reservation.place_id == place.id,
            Reservation.creneau_id == creneau.id,
            Reservation.statut != "annulee",
        )
    ).first()
    if prise is not None:
        raise _conflit("Cette place vient d'être prise, choisis-en une autre.")

    if eleve.solde < 0:
        raise _conflit("Ton solde est négatif : demande à ton parent de recharger.")
    prix = prix_portion(menu.prix, tiers)
    solde_apres = eleve.solde - prix
    if solde_apres < -params.decouvert_max:
        raise _conflit("Solde insuffisant pour cette portion.")

    menu.stock_restant -= tiers
    eleve.solde = solde_apres

    reservation = Reservation(
        eleve_id=eleve.id,
        menu_jour_id=menu.id,
        creneau_id=creneau.id,
        place_id=place.id,
        tiers=tiers,
        prix=prix,
        statut="commandee",
    )
    db.add(reservation)

    db.add(
        Transaction(
            eleve_id=eleve.id,
            type="debit",
            montant=-prix,
            libelle=f"Réservation {plat.nom} ({tiers}/3)",
        )
    )
    notifier(
        db,
        eleve,
        f"{eleve.nom.split()[0]} a commandé {plat.nom} ({tiers}/3) pour "
        f"{creneau.heure_debut.strftime('%H h %M')}.",
    )
    notifier_solde(db, eleve)

    db.flush()
    return reservation


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
    if menu.date != now.date() or now.time() >= params.cloture_commandes:
        raise _conflit(
            f"Annulation impossible après {params.cloture_commandes.strftime('%H h %M')}."
        )

    plat = db.get(Plat, menu.plat_id)
    menu.stock_restant += res.tiers
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
