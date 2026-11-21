"""Espace cuisinier : affectations, placement des classes, suivi des repas, suggestions de portion."""
from datetime import date as _date
from datetime import datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, SmallInteger, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class AffectationCuisine(Base):
    """Un cuisinier est affecté à un ou plusieurs niveaux, tous du même mode."""

    __tablename__ = "affectations_cuisine"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    niveau_id: Mapped[int] = mapped_column(ForeignKey("niveaux.id", ondelete="CASCADE"), primary_key=True)


class ClasseTable(Base):
    """Mode classe : tables réservées à une classe pendant sa vague."""

    __tablename__ = "classe_tables"

    classe_id: Mapped[int] = mapped_column(ForeignKey("classes.id", ondelete="CASCADE"), primary_key=True)
    table_id: Mapped[int] = mapped_column(ForeignKey("tables.id", ondelete="CASCADE"), primary_key=True)


class Repas(Base):
    """Un repas d'un élève : commandé, servi, réellement consommé (jamais déduit), avis."""

    __tablename__ = "repas"
    __table_args__ = (UniqueConstraint("eleve_id", "date", name="uq_repas_eleve_date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    eleve_id: Mapped[int] = mapped_column(ForeignKey("eleves.id", ondelete="CASCADE"), index=True)
    date: Mapped[_date] = mapped_column(Date, index=True)
    menu_commande_id: Mapped[int | None] = mapped_column(ForeignKey("menu_jour.id", ondelete="SET NULL"), nullable=True)
    menu_servi_id: Mapped[int | None] = mapped_column(ForeignKey("menu_jour.id", ondelete="SET NULL"), nullable=True)
    tiers: Mapped[int] = mapped_column(Integer)
    consommation: Mapped[str | None] = mapped_column(String(20), nullable=True)  # termine, non_termine
    avis: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)  # 1 apprécié, -1 non apprécié
    saisi_par: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    saisi_a: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SuggestionPortion(Base):
    __tablename__ = "suggestions_portion"

    id: Mapped[int] = mapped_column(primary_key=True)
    eleve_id: Mapped[int] = mapped_column(ForeignKey("eleves.id", ondelete="CASCADE"), index=True)
    portion_actuelle: Mapped[int] = mapped_column(Integer)  # tiers
    portion_suggeree: Mapped[int] = mapped_column(Integer)
    observations: Mapped[int] = mapped_column(Integer)
    taux: Mapped[float] = mapped_column(Float)
    statut: Mapped[str] = mapped_column(String(20), default="proposee")  # proposee, validee, refusee
    traite_par: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    traite_a: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
