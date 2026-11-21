from datetime import time as _time

from sqlalchemy import Integer, Time
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class Parametres(Base):
    """Table à une seule ligne : id = 1."""

    __tablename__ = "parametres"

    id: Mapped[int] = mapped_column(primary_key=True)
    ouverture_commandes: Mapped[_time] = mapped_column(Time)  # ex. 18:00 la veille
    cloture_commandes: Mapped[_time] = mapped_column(Time)  # ex. 10:00
    decouvert_max: Mapped[int] = mapped_column(Integer)  # FCFA, découvert autorisé
