from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class Eleve(Base):
    __tablename__ = "eleves"

    id: Mapped[int] = mapped_column(primary_key=True)
    matricule: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    nom: Mapped[str] = mapped_column(String(120))
    classe: Mapped[str] = mapped_column(String(32))
    photo: Mapped[str | None] = mapped_column(String(255), nullable=True)
    pin_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)  # None = PIN à choisir
    regime: Mapped[str | None] = mapped_column(String(80), nullable=True)
    allergies: Mapped[list[str]] = mapped_column(ARRAY(String), server_default="{}")
    solde: Mapped[int] = mapped_column(Integer, default=0)  # FCFA
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
