from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class Niveau(Base):
    __tablename__ = "niveaux"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(40), unique=True)  # Primaire, Collège, Lycée
    mode: Mapped[str] = mapped_column(String(20))  # classe, commande


class Classe(Base):
    __tablename__ = "classes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(32), unique=True)  # = Eleve.classe
    niveau_id: Mapped[int] = mapped_column(ForeignKey("niveaux.id", ondelete="RESTRICT"))
    enseignant_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
