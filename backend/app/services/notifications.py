from sqlalchemy.orm import Session

from ..models import Eleve, Notification

SEUIL_SOLDE_BAS = 1000  # FCFA


def notifier(db: Session, eleve: Eleve, message: str) -> None:
    """Notification in-app au parent de l'élève (aucune si non rattaché)."""
    if eleve.parent_id:
        db.add(Notification(parent_id=eleve.parent_id, eleve_id=eleve.id, message=message))


def notifier_solde(db: Session, eleve: Eleve) -> None:
    prenom = eleve.nom.split()[0]
    if eleve.solde < 0:
        notifier(db, eleve, f"{prenom} utilise son découvert : solde {eleve.solde} F.")
    elif eleve.solde < SEUIL_SOLDE_BAS:
        notifier(db, eleve, f"Solde bas pour {prenom} : {eleve.solde} F.")
