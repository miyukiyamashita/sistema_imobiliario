"""cria solicitacoes de agendamento de visitas

Revision ID: c41e7f90b2d3
Revises: 7b4d9b2c1a10
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "c41e7f90b2d3"
down_revision = "7b4d9b2c1a10"
branch_labels = None
depends_on = None


status_enum = postgresql.ENUM(
    "PENDENTE",
    "CONFIRMADA",
    "RECUSADA",
    "CANCELADA",
    name="status_solicitacao_visita",
    create_type=False,
)


def upgrade():
    bind = op.get_bind()
    status_enum.create(bind, checkfirst=True)
    op.create_table(
        "solicitacoes_visita",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("imovel_id", sa.Integer(), sa.ForeignKey("imoveis.id"), nullable=False),
        sa.Column("cliente_id", sa.Integer(), sa.ForeignKey("usuarios.id"), nullable=False),
        sa.Column("data_visita", sa.Date(), nullable=False),
        sa.Column("horario_visita", sa.Time(), nullable=False),
        sa.Column("observacoes", sa.Text()),
        sa.Column("status", status_enum, nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_solicitacoes_visita_id", "solicitacoes_visita", ["id"])
    op.create_index("ix_solicitacoes_visita_imovel_id", "solicitacoes_visita", ["imovel_id"])
    op.create_index("ix_solicitacoes_visita_cliente_id", "solicitacoes_visita", ["cliente_id"])
    op.create_index(
        "uq_solicitacoes_visita_slot_ativo",
        "solicitacoes_visita",
        ["imovel_id", "data_visita", "horario_visita"],
        unique=True,
        postgresql_where=sa.text("status IN ('PENDENTE', 'CONFIRMADA')"),
    )


def downgrade():
    op.drop_index("uq_solicitacoes_visita_slot_ativo", table_name="solicitacoes_visita")
    op.drop_index("ix_solicitacoes_visita_cliente_id", table_name="solicitacoes_visita")
    op.drop_index("ix_solicitacoes_visita_imovel_id", table_name="solicitacoes_visita")
    op.drop_index("ix_solicitacoes_visita_id", table_name="solicitacoes_visita")
    op.drop_table("solicitacoes_visita")
    # O ENUM é preservado para não remover um tipo preexistente ou compartilhado.
