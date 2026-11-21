from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class Plat(Base):
    __tablename__ = "plats"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(120))
    photo: Mapped[str | None] = mapped_column(String(255), nullable=True)
    prix: Mapped[int] = mapped_column(Integer)  # FCFA, prix plat entier (portion 3/3)
    # Prix des portions 1/3 et 2/3 réglés par le chef ; vides = proportionnels au prix entier.
    prix_tiers1: Mapped[int | None] = mapped_column(Integer, nullable=True)
    prix_tiers2: Mapped[int | None] = mapped_column(Integer, nullable=True)
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


class PlatElement(Base):
    """Élément de la composition d'un plat, configuré par la cuisine (ex. alloco, piment).

    Les ingrédients de base (PlatIngredient) sont toujours présents ; un élément obligatoire
    est toujours servi, un élément facultatif peut être ajouté ou retiré par l'élève.
    """

    __tablename__ = "plat_elements"

    id: Mapped[int] = mapped_column(primary_key=True)
    plat_id: Mapped[int] = mapped_column(ForeignKey("plats.id", ondelete="CASCADE"), index=True)
    # Ingrédient porteur des allergènes de l'élément : vérification sur la composition finale.
    ingredient_id: Mapped[int] = mapped_column(ForeignKey("ingredients.id", ondelete="RESTRICT"))
    nom: Mapped[str] = mapped_column(String(80))
    obligatoire: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    inclus_defaut: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    supplement: Mapped[int] = mapped_column(Integer, default=0, server_default="0")  # FCFA
    # Stock en unités ; vide = non suivi.
    stock_restant: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ordre: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    actif: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
