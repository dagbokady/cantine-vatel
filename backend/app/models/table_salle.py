from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class TableSalle(Base):
    __tablename__ = "tables"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(32), unique=True)
    x: Mapped[float] = mapped_column(Float)
    y: Mapped[float] = mapped_column(Float)
    nb_places: Mapped[int] = mapped_column(Integer)


class Place(Base):
    __tablename__ = "places"
    __table_args__ = (UniqueConstraint("table_id", "numero", name="uq_place_table_num"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    table_id: Mapped[int] = mapped_column(ForeignKey("tables.id", ondelete="CASCADE"))
    numero: Mapped[int] = mapped_column(Integer)
    angle: Mapped[float] = mapped_column(Float)  # degrés, position autour de la table
    pmr: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
