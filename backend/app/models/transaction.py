from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    eleve_id: Mapped[int] = mapped_column(ForeignKey("eleves.id", ondelete="CASCADE"), index=True)
    type: Mapped[str] = mapped_column(String(20))  # recharge, debit, remboursement
    montant: Mapped[int] = mapped_column(Integer)  # FCFA, signé (+ recharge, - debit)
    libelle: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
