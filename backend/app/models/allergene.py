from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class Allergene(Base):
    __tablename__ = "allergenes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(80), unique=True)
