from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, func, text
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class Reservation(Base):
    __tablename__ = "reservations"
    __table_args__ = (
        Index("uq_reservation_code_actif", "code", unique=True, postgresql_where=text("statut <> 'annulee'")),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    eleve_id: Mapped[int] = mapped_column(ForeignKey("eleves.id", ondelete="CASCADE"), index=True)
    menu_jour_id: Mapped[int] = mapped_column(ForeignKey("menu_jour.id", ondelete="RESTRICT"))
    # Vague et place choisies le jour même, à partir de la récréation : vides jusque-là.
    creneau_id: Mapped[int | None] = mapped_column(ForeignKey("creneaux.id", ondelete="RESTRICT"), nullable=True)
    place_id: Mapped[int | None] = mapped_column(ForeignKey("places.id", ondelete="RESTRICT"), nullable=True)
    tiers: Mapped[int] = mapped_column(Integer)  # 1, 2 ou 3 (1/3, 2/3, 3/3)
    prix: Mapped[int] = mapped_column(Integer)  # FCFA, arrondi à 25
    statut: Mapped[str] = mapped_column(String(20))  # commandee, servie, annulee
    # Code de secours à 6 caractères, unique parmi les réservations non annulées.
    code: Mapped[str | None] = mapped_column(String(6), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    servie_a: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ReservationElement(Base):
    """Composition figée au moment de la commande : nom et supplément ne changent plus."""

    __tablename__ = "reservation_elements"

    id: Mapped[int] = mapped_column(primary_key=True)
    reservation_id: Mapped[int] = mapped_column(ForeignKey("reservations.id", ondelete="CASCADE"), index=True)
    element_id: Mapped[int | None] = mapped_column(ForeignKey("plat_elements.id", ondelete="SET NULL"), nullable=True)
    nom: Mapped[str] = mapped_column(String(80))
    supplement: Mapped[int] = mapped_column(Integer, default=0)
