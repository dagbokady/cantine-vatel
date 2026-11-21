"""recharge_mobile_money

Revision ID: e41a7b2c9d10
Revises: d38c2c3a5a3c
"""
import sqlalchemy as sa
from alembic import op

revision = "e41a7b2c9d10"
down_revision = "d38c2c3a5a3c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("transactions", sa.Column("parent_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True))
    op.add_column("transactions", sa.Column("operateur", sa.String(20), nullable=True))
    op.add_column("transactions", sa.Column("telephone_masque", sa.String(20), nullable=True))
    op.add_column("transactions", sa.Column("cle_idempotence", sa.String(64), nullable=True))
    op.add_column("transactions", sa.Column("simulation_echec", sa.Boolean(), server_default="false", nullable=False))
    op.add_column("transactions", sa.Column("motif_echec", sa.String(160), nullable=True))
    op.add_column("transactions", sa.Column("traitee_a", sa.DateTime(timezone=True), nullable=True))
    op.create_unique_constraint("uq_transactions_cle_idempotence", "transactions", ["cle_idempotence"])
    op.create_index("ix_transactions_parent_id", "transactions", ["parent_id"])


def downgrade() -> None:
    op.drop_index("ix_transactions_parent_id", "transactions")
    op.drop_constraint("uq_transactions_cle_idempotence", "transactions")
    for c in ("traitee_a", "motif_echec", "simulation_echec", "cle_idempotence", "telephone_masque", "operateur", "parent_id"):
        op.drop_column("transactions", c)
