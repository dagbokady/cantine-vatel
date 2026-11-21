from datetime import time as _time

from sqlalchemy import Integer, Time, text
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class Parametres(Base):
    """Table à une seule ligne : id = 1."""

    __tablename__ = "parametres"

    id: Mapped[int] = mapped_column(primary_key=True)
    ouverture_commandes: Mapped[_time] = mapped_column(Time)  # ex. 18:00 la veille
    cloture_commandes: Mapped[_time] = mapped_column(Time)  # ex. 10:00
    decouvert_max: Mapped[int] = mapped_column(Integer)  # FCFA, découvert autorisé
    # Réglé par le chef : la commande ferme ce nombre de minutes avant le début de la vague.
    delai_preparation_min: Mapped[int] = mapped_column(Integer, default=60, server_default=text("60"))
    # Le choix de la vague ouvre à la récréation, le jour même.
    heure_recreation: Mapped[_time] = mapped_column(Time, default=_time(10, 0), server_default=text("'10:00'"))
