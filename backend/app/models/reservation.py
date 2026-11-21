from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class Reservation(Base):
    __tablename__ = "reservations"

    id: Mapped[int] = mapped_column(primary_key=True)
    eleve_id: Mapped[int] = mapped_column(ForeignKey("eleves.id", ondelete="CASCADE"), index=True)
    menu_jour_id: Mapped[int] = mapped_column(ForeignKey("menu_jour.id", ondelete="RESTRICT"))
    # Vague et place choisies le jour même, à partir de la récréation : vides jusque-là.
    creneau_id: Mapped[int | None] = mapped_column(ForeignKey("creneaux.id", ondelete="RESTRICT"), nullable=True)
    place_id: Mapped[int | None] = mapped_column(ForeignKey("places.id", ondelete="RESTRICT"), nullable=True)
    tiers: Mapped[int] = mapped_column(Integer)  # 1, 2 ou 3 (1/3, 2/3, 3/3)
    prix: Mapped[int] = mapped_column(Integer)  # FCFA, arrondi à 25
    statut: Mapped[str] = mapped_column(String(20))  # commandee, servie, annulee
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    servie_a: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
