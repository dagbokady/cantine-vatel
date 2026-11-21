"""composition des plats, prix des portions par le chef, code de secours, comptes désactivables

Revision ID: b81c3f6d2e40
Revises: a7d4e9b2c310
"""
import secrets

import sqlalchemy as sa
from alembic import op

revision = "b81c3f6d2e40"
down_revision = "a7d4e9b2c310"
branch_labels = None
depends_on = None

ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"


def upgrade() -> None:
    op.create_table(
        "plat_elements",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("plat_id", sa.Integer(), sa.ForeignKey("plats.id", ondelete="CASCADE"), nullable=False),
        sa.Column("ingredient_id", sa.Integer(), sa.ForeignKey("ingredients.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("nom", sa.String(80), nullable=False),
        sa.Column("obligatoire", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("inclus_defaut", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("supplement", sa.Integer(), server_default="0", nullable=False),
        sa.Column("stock_restant", sa.Integer(), nullable=True),
        sa.Column("ordre", sa.Integer(), server_default="0", nullable=False),
        sa.Column("actif", sa.Boolean(), server_default="true", nullable=False),
        sa.CheckConstraint("supplement >= 0", name="ck_element_supplement"),
        sa.CheckConstraint("stock_restant IS NULL OR stock_restant >= 0", name="ck_element_stock"),
    )
    op.create_index("ix_plat_elements_plat_id", "plat_elements", ["plat_id"])

    op.create_table(
        "reservation_elements",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("reservation_id", sa.Integer(), sa.ForeignKey("reservations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("element_id", sa.Integer(), sa.ForeignKey("plat_elements.id", ondelete="SET NULL"), nullable=True),
        sa.Column("nom", sa.String(80), nullable=False),
        sa.Column("supplement", sa.Integer(), nullable=False),
    )
    op.create_index("ix_reservation_elements_reservation_id", "reservation_elements", ["reservation_id"])

    for table in ("plats", "menu_jour"):
        op.add_column(table, sa.Column("prix_tiers1", sa.Integer(), nullable=True))
        op.add_column(table, sa.Column("prix_tiers2", sa.Integer(), nullable=True))

    op.add_column("users", sa.Column("actif", sa.Boolean(), server_default="true", nullable=False))

    op.add_column("reservations", sa.Column("code", sa.String(6), nullable=True))
    # Codes des commandes encore actives : générés ici pour qu'aucune ne reste sans code de secours.
    conn = op.get_bind()
    ids = [r[0] for r in conn.execute(sa.text("SELECT id FROM reservations WHERE statut <> 'annulee'"))]
    pris: set[str] = set()
    for rid in ids:
        code = "".join(secrets.choice(ALPHABET) for _ in range(6))
        while code in pris:
            code = "".join(secrets.choice(ALPHABET) for _ in range(6))
        pris.add(code)
        conn.execute(sa.text("UPDATE reservations SET code = :c WHERE id = :i"), {"c": code, "i": rid})
    op.create_index(
        "uq_reservation_code_actif", "reservations", ["code"], unique=True, postgresql_where=sa.text("statut <> 'annulee'")
    )


def downgrade() -> None:
    op.drop_index("uq_reservation_code_actif", table_name="reservations")
    op.drop_column("reservations", "code")
    op.drop_column("users", "actif")
    for table in ("menu_jour", "plats"):
        op.drop_column(table, "prix_tiers2")
        op.drop_column(table, "prix_tiers1")
    op.drop_index("ix_reservation_elements_reservation_id", table_name="reservation_elements")
    op.drop_table("reservation_elements")
    op.drop_index("ix_plat_elements_plat_id", table_name="plat_elements")
    op.drop_table("plat_elements")
