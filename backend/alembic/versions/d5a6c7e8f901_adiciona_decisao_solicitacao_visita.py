"""adiciona dados de decisão às solicitações de visita

Revision ID: d5a6c7e8f901
Revises: c41e7f90b2d3
"""
from alembic import op
import sqlalchemy as sa


revision = "d5a6c7e8f901"
down_revision = "c41e7f90b2d3"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "solicitacoes_visita",
        sa.Column("justificativa_decisao", sa.Text(), nullable=True),
    )
    op.add_column(
        "solicitacoes_visita",
        sa.Column("decidido_por_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "solicitacoes_visita",
        sa.Column("decidido_em", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_solicitacoes_visita_decidido_por_id_usuarios",
        "solicitacoes_visita",
        "usuarios",
        ["decidido_por_id"],
        ["id"],
    )
    op.create_index(
        "ix_solicitacoes_visita_decidido_por_id",
        "solicitacoes_visita",
        ["decidido_por_id"],
    )


def downgrade():
    op.drop_index("ix_solicitacoes_visita_decidido_por_id", table_name="solicitacoes_visita")
    op.drop_constraint(
        "fk_solicitacoes_visita_decidido_por_id_usuarios",
        "solicitacoes_visita",
        type_="foreignkey",
    )
    op.drop_column("solicitacoes_visita", "decidido_em")
    op.drop_column("solicitacoes_visita", "decidido_por_id")
    op.drop_column("solicitacoes_visita", "justificativa_decisao")
