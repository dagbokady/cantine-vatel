"""init parcours lyceen

Revision ID: 0001_init_lyceen
Revises:
Create Date: 2026-11-21

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0001_init_lyceen"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nom", sa.String(120), nullable=False),
        sa.Column("identifiant", sa.String(120), nullable=False, unique=True),
        sa.Column("secret_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_users_identifiant", "users", ["identifiant"])

    op.create_table(
        "eleves",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("matricule", sa.String(32), nullable=False, unique=True),
        sa.Column("nom", sa.String(120), nullable=False),
        sa.Column("classe", sa.String(32), nullable=False),
        sa.Column("photo", sa.String(255), nullable=True),
        sa.Column("pin_hash", sa.String(255), nullable=False),
        sa.Column(
            "allergies",
            postgresql.ARRAY(sa.String()),
            nullable=False,
            server_default="{}",
        ),
        sa.Column("solde", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "parent_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_eleves_matricule", "eleves", ["matricule"])

    op.create_table(
        "allergenes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nom", sa.String(80), nullable=False, unique=True),
    )

    op.create_table(
        "ingredients",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nom", sa.String(120), nullable=False, unique=True),
    )

    op.create_table(
        "ingredient_allergene",
        sa.Column(
            "ingredient_id",
            sa.Integer(),
            sa.ForeignKey("ingredients.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "allergene_id",
            sa.Integer(),
            sa.ForeignKey("allergenes.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )

    op.create_table(
        "plats",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nom", sa.String(120), nullable=False),
        sa.Column("photo", sa.String(255), nullable=True),
        sa.Column("prix", sa.Integer(), nullable=False),
        sa.Column(
            "sans_allergene_de",
            sa.Integer(),
            sa.ForeignKey("plats.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )

    op.create_table(
        "plat_ingredient",
        sa.Column(
            "plat_id",
            sa.Integer(),
            sa.ForeignKey("plats.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "ingredient_id",
            sa.Integer(),
            sa.ForeignKey("ingredients.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )

    op.create_table(
        "menu_jour",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column(
            "plat_id",
            sa.Integer(),
            sa.ForeignKey("plats.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("prix", sa.Integer(), nullable=False),
        sa.Column("stock_prevu", sa.Integer(), nullable=False),
        sa.Column("stock_restant", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(20), nullable=False),
        sa.UniqueConstraint("date", "plat_id", name="uq_menu_jour_date_plat"),
    )
    op.create_index("ix_menu_jour_date", "menu_jour", ["date"])

    op.create_table(
        "creneaux",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("heure_debut", sa.Time(), nullable=False),
        sa.Column("heure_fin", sa.Time(), nullable=False),
        sa.Column("capacite", sa.Integer(), nullable=False),
        sa.UniqueConstraint("date", "heure_debut", name="uq_creneau_date_debut"),
    )
    op.create_index("ix_creneaux_date", "creneaux", ["date"])

    op.create_table(
        "tables",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nom", sa.String(32), nullable=False, unique=True),
        sa.Column("x", sa.Float(), nullable=False),
        sa.Column("y", sa.Float(), nullable=False),
        sa.Column("nb_places", sa.Integer(), nullable=False),
    )

    op.create_table(
        "places",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "table_id",
            sa.Integer(),
            sa.ForeignKey("tables.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("numero", sa.Integer(), nullable=False),
        sa.Column("angle", sa.Float(), nullable=False),
        sa.UniqueConstraint("table_id", "numero", name="uq_place_table_num"),
    )

    op.create_table(
        "reservations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "eleve_id",
            sa.Integer(),
            sa.ForeignKey("eleves.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "menu_jour_id",
            sa.Integer(),
            sa.ForeignKey("menu_jour.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "creneau_id",
            sa.Integer(),
            sa.ForeignKey("creneaux.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "place_id",
            sa.Integer(),
            sa.ForeignKey("places.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("tiers", sa.Integer(), nullable=False),
        sa.Column("prix", sa.Integer(), nullable=False),
        sa.Column("statut", sa.String(20), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("servie_a", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_reservations_eleve", "reservations", ["eleve_id"])
    # Une place ne peut être occupée qu'une fois par créneau (hors annulations).
    op.create_index(
        "uq_reservations_creneau_place_active",
        "reservations",
        ["creneau_id", "place_id"],
        unique=True,
        postgresql_where=sa.text("statut <> 'annulee'"),
    )

    op.create_table(
        "transactions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "eleve_id",
            sa.Integer(),
            sa.ForeignKey("eleves.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("montant", sa.Integer(), nullable=False),
        sa.Column("libelle", sa.String(255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_transactions_eleve", "transactions", ["eleve_id"])

    op.create_table(
        "parametres",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("ouverture_commandes", sa.Time(), nullable=False),
        sa.Column("cloture_commandes", sa.Time(), nullable=False),
        sa.Column("decouvert_max", sa.Integer(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("parametres")
    op.drop_index("ix_transactions_eleve", table_name="transactions")
    op.drop_table("transactions")
    op.drop_index("uq_reservations_creneau_place_active", table_name="reservations")
    op.drop_index("ix_reservations_eleve", table_name="reservations")
    op.drop_table("reservations")
    op.drop_table("places")
    op.drop_table("tables")
    op.drop_index("ix_creneaux_date", table_name="creneaux")
    op.drop_table("creneaux")
    op.drop_index("ix_menu_jour_date", table_name="menu_jour")
    op.drop_table("menu_jour")
    op.drop_table("plat_ingredient")
    op.drop_table("plats")
    op.drop_table("ingredient_allergene")
    op.drop_table("ingredients")
    op.drop_table("allergenes")
    op.drop_index("ix_eleves_matricule", table_name="eleves")
    op.drop_table("eleves")
    op.drop_index("ix_users_identifiant", table_name="users")
    op.drop_table("users")
