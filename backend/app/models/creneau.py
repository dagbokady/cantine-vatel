from datetime import date as _date
from datetime import time as _time

from sqlalchemy import Date, Integer, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class Creneau(Base):
    __tablename__ = "creneaux"
    __table_args__ = (
        UniqueConstraint("date", "heure_debut", name="uq_creneau_date_debut"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    date: Mapped[_date] = mapped_column(Date, index=True)
    heure_debut: Mapped[_time] = mapped_column(Time)
    heure_fin: Mapped[_time] = mapped_column(Time)
    capacite: Mapped[int] = mapped_column(Integer)
