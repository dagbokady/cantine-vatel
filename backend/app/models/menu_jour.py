from datetime import date as _date

from sqlalchemy import Date, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class MenuJour(Base):
    __tablename__ = "menu_jour"
    __table_args__ = (UniqueConstraint("date", "plat_id", name="uq_menu_jour_date_plat"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    date: Mapped[_date] = mapped_column(Date, index=True)
    plat_id: Mapped[int] = mapped_column(ForeignKey("plats.id", ondelete="RESTRICT"))
    prix: Mapped[int] = mapped_column(Integer)  # FCFA, prix plat entier
    # Prix des portions figés à la publication (vides = proportionnels au prix entier).
    prix_tiers1: Mapped[int | None] = mapped_column(Integer, nullable=True)
    prix_tiers2: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Stock en tiers de portion. 3 tiers = 1 portion pleine.
    stock_prevu: Mapped[int] = mapped_column(Integer)
    stock_restant: Mapped[int] = mapped_column(Integer)
    type: Mapped[str] = mapped_column(String(20))  # principal, sans_allergene, accompagnement (mode classe uniquement)
