from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class Plat(Base):
    __tablename__ = "plats"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(120))
    photo: Mapped[str | None] = mapped_column(String(255), nullable=True)
    prix: Mapped[int] = mapped_column(Integer)  # FCFA, prix plat entier
    sans_allergene_de: Mapped[int | None] = mapped_column(
        ForeignKey("plats.id", ondelete="SET NULL"), nullable=True
    )


class PlatIngredient(Base):
    __tablename__ = "plat_ingredient"

    plat_id: Mapped[int] = mapped_column(
        ForeignKey("plats.id", ondelete="CASCADE"), primary_key=True
    )
    ingredient_id: Mapped[int] = mapped_column(
        ForeignKey("ingredients.id", ondelete="CASCADE"), primary_key=True
    )
