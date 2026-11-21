"""Préparation de la base pour la mise en ligne.

Garde : comptes admin, élèves rattachés à un parent et leurs parents, plats (sauf « Alloco » simple),
référentiel ingrédients/allergènes et configuration (paramètres, salle, classes).
Supprime : réservations, menus, créneaux datés, transactions, notifications, appels, repas et autres comptes.
Les soldes des élèves gardés repartent à 0 (plus aucune transaction).

Aperçu : python -m app.mise_en_ligne
Exécution : python -m app.mise_en_ligne --appliquer
"""

import sys

from sqlalchemy import delete, func, or_, select, update
from sqlalchemy.orm import Session

from .models import (
    Appel, Creneau, Eleve, MenuJour, Notification, Plat, Presence, Repas, Reservation,
    SuggestionPortion, Transaction, User,
)
from .models.plat import PlatElement
from .models.reservation import ReservationElement
from .referentiel import charger_referentiel

PLATS_RETIRES = ["Alloco"]


def preparer(db: Session, appliquer: bool) -> None:
    eleves = list(db.scalars(select(Eleve).where(Eleve.parent_id.is_not(None))))
    parents = {e.parent_id for e in eleves}
    gardes = list(db.scalars(select(User).where(or_(User.role == "admin", User.id.in_(parents)))))
    retires = list(db.scalars(select(Plat).where(func.lower(Plat.nom).in_([p.lower() for p in PLATS_RETIRES]))))

    print("Comptes gardés :", ", ".join(f"{u.nom} ({u.role})" for u in gardes))
    print("Élèves gardés :", ", ".join(e.nom for e in eleves))
    print("Plats retirés :", ", ".join(p.nom for p in retires) or "aucun")
    print("Plats gardés :", db.scalar(select(func.count(Plat.id))) - len(retires))
    if not appliquer:
        print("\nAperçu seulement. Relancer avec --appliquer pour exécuter.")
        return

    for modele in (SuggestionPortion, Repas, Presence, Appel, Notification, ReservationElement,
                   Reservation, Transaction, MenuJour, Creneau):
        db.execute(delete(modele))
    db.execute(delete(Eleve).where(Eleve.parent_id.is_(None)))
    db.execute(delete(User).where(User.id.not_in([u.id for u in gardes])))
    db.execute(update(Eleve).values(solde=0))
    for p in retires:
        db.execute(delete(PlatElement).where(PlatElement.plat_id == p.id))
        db.delete(p)
    db.commit()
    charger_referentiel(db)
    print("\nBase prête pour la mise en ligne.")


if __name__ == "__main__":
    from .db import SessionLocal

    with SessionLocal() as s:
        preparer(s, "--appliquer" in sys.argv)
