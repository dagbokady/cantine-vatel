"""vague_jour_meme : commande sans vague, heure de récréation, matricules ivoiriens

Revision ID: a7d4e9b2c310
Revises: f52c8d3e1a20
"""
import re

import sqlalchemy as sa
from alembic import op

revision = "a7d4e9b2c310"
down_revision = "f52c8d3e1a20"
branch_labels = None
depends_on = None

FORMAT = re.compile(r"^[0-9]{8}[A-Z]$")
PREFIXES = {"LYC": ("1", "L"), "COL": ("3", "C"), "PRI": ("2", "P")}


def _convertir(ancien: str, eid: int, pris: set[str]) -> str:
    """Matricule de démonstration (ex. LYC-2026-001) vers le format ivoirien (ex. 12026001L)."""
    chiffres = re.sub(r"\D", "", ancien)
    chiffre, lettre = PREFIXES.get(ancien[:3].upper(), ("9", "X"))
    m = f"{chiffre}{chiffres[-7:]}{lettre}" if len(chiffres) >= 7 else ""
    if not FORMAT.fullmatch(m) or m in pris:
        m = f"{90000000 + eid:08d}X"
    return m


def upgrade() -> None:
    # La vague (créneau et place) se choisit le jour même : facultative à la commande.
    op.alter_column("reservations", "creneau_id", existing_type=sa.Integer(), nullable=True)
    op.alter_column("reservations", "place_id", existing_type=sa.Integer(), nullable=True)
    op.add_column("parametres", sa.Column("heure_recreation", sa.Time(), server_default="10:00", nullable=False))

    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id, matricule FROM eleves ORDER BY id")).all()
    pris = {m for _, m in rows if FORMAT.fullmatch(m or "")}
    for eid, ancien in rows:
        if FORMAT.fullmatch(ancien or ""):
            continue
        nouveau = _convertir(ancien or "", eid, pris)
        pris.add(nouveau)
        conn.execute(sa.text("UPDATE eleves SET matricule = :m WHERE id = :i"), {"m": nouveau, "i": eid})


def downgrade() -> None:
    op.drop_column("parametres", "heure_recreation")
    op.alter_column("reservations", "place_id", existing_type=sa.Integer(), nullable=False)
    op.alter_column("reservations", "creneau_id", existing_type=sa.Integer(), nullable=False)
