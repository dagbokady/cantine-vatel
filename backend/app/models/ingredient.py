from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class Ingredient(Base):
    __tablename__ = "ingredients"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(120), unique=True)


class IngredientAllergene(Base):
    __tablename__ = "ingredient_allergene"

    ingredient_id: Mapped[int] = mapped_column(
        ForeignKey("ingredients.id", ondelete="CASCADE"), primary_key=True
    )
    allergene_id: Mapped[int] = mapped_column(
        ForeignKey("allergenes.id", ondelete="CASCADE"), primary_key=True
    )
