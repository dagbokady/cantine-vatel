"""Paiements : interface PaymentProvider. Seul le fournisseur simulé est branché (hackathon)."""
from __future__ import annotations

import uuid
from typing import Protocol

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Eleve, Transaction
from .notifications import notifier


class PaymentProvider(Protocol):
    def creer_lien(self, reference: str, montant: int) -> str | None: ...
    def verifier(self, reference: str) -> tuple[str, int]:
        """Retourne (statut, montant) tels que vus par l'agrégateur."""
        ...


class SimulatedProvider:
    """Accepte tout paiement : simule l'agrégateur (aucun argent réel)."""

    def __init__(self) -> None:
        self._montants: dict[str, int] = {}

    def creer_lien(self, reference: str, montant: int) -> str | None:
        self._montants[reference] = montant
        return None

    def verifier(self, reference: str) -> tuple[str, int]:
        return "ACCEPTED", self._montants.get(reference, 0)


provider: PaymentProvider = SimulatedProvider()


def initier_recharge(db: Session, eleve: Eleve, montant: int) -> Transaction:
    reference = f"SIM-{uuid.uuid4().hex[:16]}"
    tx = Transaction(
        eleve_id=eleve.id,
        type="recharge",
        montant=montant,
        libelle="Recharge (paiement simulé)",
        statut="en_attente",
        reference_externe=reference,
    )
    db.add(tx)
    db.flush()
    provider.creer_lien(reference, montant)
    return tx


def valider_paiement(db: Session, reference: str) -> Transaction:
    """Validation idempotente (R12) : vérifie auprès de l'agrégateur puis crédite une seule fois."""
    tx = db.execute(
        select(Transaction).where(Transaction.reference_externe == reference).with_for_update()
    ).scalar_one_or_none()
    if tx is None:
        raise HTTPException(status_code=404, detail="Paiement introuvable.")
    if tx.statut == "validee":
        return tx
    statut, montant = provider.verifier(reference)
    if statut != "ACCEPTED" or montant != tx.montant:
        tx.statut = "refusee"
        db.flush()
        raise HTTPException(status_code=409, detail="Paiement refusé par l'agrégateur.")
    eleve = db.execute(
        select(Eleve).where(Eleve.id == tx.eleve_id).with_for_update()
    ).scalar_one()
    eleve.solde += tx.montant
    tx.statut = "validee"
    notifier(db, eleve, f"Recharge de {tx.montant} F validée. Nouveau solde : {eleve.solde} F.")
    db.flush()
    return tx
