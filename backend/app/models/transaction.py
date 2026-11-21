from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    eleve_id: Mapped[int] = mapped_column(ForeignKey("eleves.id", ondelete="CASCADE"), index=True)
    type: Mapped[str] = mapped_column(String(20))  # recharge, debit, remboursement
    montant: Mapped[int] = mapped_column(Integer)  # FCFA, signé (+ recharge, - debit)
    libelle: Mapped[str] = mapped_column(String(255))
    statut: Mapped[str] = mapped_column(String(20), default="validee", server_default="validee")  # en_attente, validee, echouee
    reference_externe: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    # Rechargement Mobile Money simulé (aucun opérateur réel n'est contacté)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    operateur: Mapped[str | None] = mapped_column(String(20), nullable=True)  # wave, mtn, orange, moov
    telephone_masque: Mapped[str | None] = mapped_column(String(20), nullable=True)
    cle_idempotence: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    simulation_echec: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    motif_echec: Mapped[str | None] = mapped_column(String(160), nullable=True)
    traitee_a: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
