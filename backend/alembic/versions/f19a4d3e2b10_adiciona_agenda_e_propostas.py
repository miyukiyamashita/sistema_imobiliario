"""adiciona reagendamento de visitas e propostas

Revision ID: f19a4d3e2b10
Revises: d5a6c7e8f901
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "f19a4d3e2b10"
down_revision = "d5a6c7e8f901"
branch_labels = None
depends_on = None


status_proposta = postgresql.ENUM(
    "EM_ANALISE",
    "ACEITA",
    "RECUSADA",
    "AGUARDANDO_RESPOSTA_CLIENTE",
    name="status_proposta",
    create_type=False,
)


def upgrade():
    bind = op.get_bind()
    status_proposta.create(bind, checkfirst=True)

    op.add_column(
        "solicitacoes_visita",
        sa.Column("reagendamento_pendente", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.add_column("solicitacoes_visita", sa.Column("nova_data_visita", sa.Date(), nullable=True))
    op.add_column("solicitacoes_visita", sa.Column("novo_horario_visita", sa.Time(), nullable=True))

    op.create_table(
        "propostas",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("imovel_id", sa.Integer(), sa.ForeignKey("imoveis.id"), nullable=False),
        sa.Column("cliente_id", sa.Integer(), sa.ForeignKey("usuarios.id"), nullable=False),
        sa.Column("status", status_proposta, nullable=False),
        sa.Column("tipo_proposta", sa.String(20), nullable=False),
        sa.Column("valor_proposto", sa.Numeric(12, 2), nullable=False),
        sa.Column("condicao_pagamento", sa.String(30), nullable=False),
        sa.Column("mensagem", sa.Text(), nullable=True),
        sa.Column("contraproposta_valor", sa.Numeric(12, 2), nullable=True),
        sa.Column("contraproposta_condicao_pagamento", sa.String(30), nullable=True),
        sa.Column("respondida_por_id", sa.Integer(), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("criada_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("atualizada_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_propostas_id", "propostas", ["id"])
    op.create_index("ix_propostas_imovel_id", "propostas", ["imovel_id"])
    op.create_index("ix_propostas_cliente_id", "propostas", ["cliente_id"])


def downgrade():
    op.drop_index("ix_propostas_cliente_id", table_name="propostas")
    op.drop_index("ix_propostas_imovel_id", table_name="propostas")
    op.drop_index("ix_propostas_id", table_name="propostas")
    op.drop_table("propostas")
    op.drop_column("solicitacoes_visita", "novo_horario_visita")
    op.drop_column("solicitacoes_visita", "nova_data_visita")
    op.drop_column("solicitacoes_visita", "reagendamento_pendente")
