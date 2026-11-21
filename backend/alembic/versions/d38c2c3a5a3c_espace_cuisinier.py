"""espace_cuisinier

Revision ID: d38c2c3a5a3c
Revises: ce5546d699cd
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d38c2c3a5a3c"
down_revision: Union[str, Sequence[str], None] = "ce5546d699cd"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("classes", sa.Column("heure_passage", sa.Time(), nullable=True))
    op.add_column("eleves", sa.Column("portion_defaut", sa.Integer(), server_default="3", nullable=False))
    op.create_table(
        "affectations_cuisine",
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("niveau_id", sa.Integer(), sa.ForeignKey("niveaux.id", ondelete="CASCADE"), primary_key=True),
    )
    op.create_table(
        "classe_tables",
        sa.Column("classe_id", sa.Integer(), sa.ForeignKey("classes.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("table_id", sa.Integer(), sa.ForeignKey("tables.id", ondelete="CASCADE"), primary_key=True),
    )
    op.create_table(
        "repas",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("eleve_id", sa.Integer(), sa.ForeignKey("eleves.id", ondelete="CASCADE"), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("menu_commande_id", sa.Integer(), sa.ForeignKey("menu_jour.id", ondelete="SET NULL"), nullable=True),
        sa.Column("menu_servi_id", sa.Integer(), sa.ForeignKey("menu_jour.id", ondelete="SET NULL"), nullable=True),
        sa.Column("tiers", sa.Integer(), nullable=False),
        sa.Column("consommation", sa.String(20), nullable=True),
        sa.Column("avis", sa.SmallInteger(), nullable=True),
        sa.Column("saisi_par", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("saisi_a", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("eleve_id", "date", name="uq_repas_eleve_date"),
    )
    op.create_index("ix_repas_eleve_id", "repas", ["eleve_id"])
    op.create_index("ix_repas_date", "repas", ["date"])
    op.create_table(
        "suggestions_portion",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("eleve_id", sa.Integer(), sa.ForeignKey("eleves.id", ondelete="CASCADE"), nullable=False),
        sa.Column("portion_actuelle", sa.Integer(), nullable=False),
        sa.Column("portion_suggeree", sa.Integer(), nullable=False),
        sa.Column("observations", sa.Integer(), nullable=False),
        sa.Column("taux", sa.Float(), nullable=False),
        sa.Column("statut", sa.String(20), nullable=False, server_default="proposee"),
        sa.Column("traite_par", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("traite_a", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_suggestions_portion_eleve_id", "suggestions_portion", ["eleve_id"])


def downgrade() -> None:
    op.drop_table("suggestions_portion")
    op.drop_table("repas")
    op.drop_table("classe_tables")
    op.drop_table("affectations_cuisine")
    op.drop_column("eleves", "portion_defaut")
    op.drop_column("classes", "heure_passage")
