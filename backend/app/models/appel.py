from datetime import date as _date
from datetime import datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class Appel(Base):
    __tablename__ = "appels"
    __table_args__ = (UniqueConstraint("classe_id", "date", name="uq_appel_classe_date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    classe_id: Mapped[int] = mapped_column(ForeignKey("classes.id", ondelete="CASCADE"))
    date: Mapped[_date] = mapped_column(Date, index=True)
    enseignant_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    valide_a: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Presence(Base):
    __tablename__ = "presences"

    appel_id: Mapped[int] = mapped_column(
        ForeignKey("appels.id", ondelete="CASCADE"), primary_key=True
    )
    eleve_id: Mapped[int] = mapped_column(
        ForeignKey("eleves.id", ondelete="CASCADE"), primary_key=True
    )
    present: Mapped[bool] = mapped_column(Boolean)
