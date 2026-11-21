"""delai_preparation

Revision ID: f52c8d3e1a20
Revises: e41a7b2c9d10
"""
import sqlalchemy as sa
from alembic import op

revision = "f52c8d3e1a20"
down_revision = "e41a7b2c9d10"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("parametres", sa.Column("delai_preparation_min", sa.Integer(), server_default="60", nullable=False))


def downgrade() -> None:
    op.drop_column("parametres", "delai_preparation_min")
