"""Rechargement Mobile Money SIMULÉ.

Aucun opérateur n'est contacté et aucun argent ne circule : la transaction est créée en base
(« en_attente »), puis un traitement simulé la passe à « validee » (crédit) ou « echouee ».
Le solde n'est modifié qu'ici, côté serveur, une seule fois par transaction.
"""
from __future__ import annotations

import re
import secrets
import time
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Eleve, Transaction, User
from .notifications import notifier

OPERATEURS = {"wave": "Wave", "mtn": "MTN MoMo", "orange": "Orange Money", "moov": "Moov Money"}
DELAI_TRAITEMENT = 2.0  # secondes, délai minimum simulé
MOTIF_ECHEC = "Paiement refusé par l'opérateur (scénario d'échec simulé)."


def normaliser_telephone(brut: str) -> str:
    chiffres = re.sub(r"\D", "", brut)
    if chiffres.startswith("225") and len(chiffres) == 13:
        chiffres = chiffres[3:]
    if not re.fullmatch(r"0\d{9}", chiffres):
        raise HTTPException(status_code=422, detail="Numéro invalide : 10 chiffres attendus (ex. 07 00 00 00 00).")
    return chiffres


def masquer(tel: str) -> str:
    return f"{tel[:2]} •• •• {tel[6:8]} {tel[8:]}"


def creer_recharge(
    db: Session, parent: User, eleve: Eleve, montant: int, operateur: str, telephone: str, cle: str, echec: bool
) -> Transaction:
    """Crée la transaction en attente. Rejouer la même clé renvoie la même transaction (double clic)."""
    existante = db.scalars(select(Transaction).where(Transaction.cle_idempotence == cle)).first()
    if existante:
        if existante.parent_id != parent.id or existante.eleve_id != eleve.id or existante.montant != montant:
            raise HTTPException(status_code=409, detail="Clé de paiement déjà utilisée pour une autre opération.")
        return existante
    tel = normaliser_telephone(telephone)
    tx = Transaction(
        eleve_id=eleve.id,
        parent_id=parent.id,
        type="recharge",
        montant=montant,
        libelle=f"Recharge {OPERATEURS[operateur]} (simulation)",
        statut="en_attente",
        reference_externe=f"SIM-{datetime.now():%y%m%d}-{secrets.token_hex(3).upper()}",
        operateur=operateur,
        telephone_masque=masquer(tel),
        cle_idempotence=cle,
        simulation_echec=echec,
    )
    db.add(tx)
    db.flush()
    return tx


def traiter_recharge(db: Session, parent: User, reference: str) -> Transaction:
    """Traitement simulé, idempotent : seul le premier appel peut créditer."""
    tx = db.execute(
        select(Transaction)
        .where(Transaction.reference_externe == reference, Transaction.parent_id == parent.id)
        .with_for_update()
    ).scalar_one_or_none()
    if tx is None:
        raise HTTPException(status_code=404, detail="Paiement introuvable.")
    if tx.statut != "en_attente":
        return tx
    attente = DELAI_TRAITEMENT - (datetime.now().astimezone() - tx.created_at).total_seconds()
    if attente > 0:
        time.sleep(min(attente, DELAI_TRAITEMENT))
    eleve = db.execute(select(Eleve).where(Eleve.id == tx.eleve_id).with_for_update()).scalar_one()
    tx.traitee_a = datetime.now().astimezone()
    if tx.simulation_echec:
        tx.statut = "echouee"
        tx.motif_echec = MOTIF_ECHEC
    else:
        eleve.solde += tx.montant
        tx.statut = "validee"
        notifier(db, eleve, f"Recharge de {tx.montant} F validée ({OPERATEURS[tx.operateur]}, simulation). Nouveau solde : {eleve.solde} F.")
    db.flush()
    return tx
