"""cria workflow de solicitacoes de imoveis

Revision ID: 7b4d9b2c1a10
Revises: e8eff3a95fd2
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "7b4d9b2c1a10"
down_revision = "e8eff3a95fd2"
branch_labels = None
depends_on = None


status_enum = postgresql.ENUM(
    "EM_ANALISE",
    "APROVADO",
    "REJEITADO",
    name="status_solicitacao_imovel",
    create_type=False,
)


def upgrade():
    bind = op.get_bind()
    # O tipo é criado explicitamente uma única vez. O create_type=False
    # impede que op.create_table() tente recriá-lo na coluna status.
    status_enum.create(bind, checkfirst=True)
    op.create_table(
        "solicitacoes_imoveis",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("imovel_id", sa.Integer(), sa.ForeignKey("imoveis.id"), nullable=False),
        sa.Column("proprietario_id", sa.Integer(), sa.ForeignKey("usuarios.id"), nullable=False),
        sa.Column("status", status_enum, nullable=False),
        sa.Column("submetida_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("revisada_em", sa.DateTime(timezone=True)),
        sa.Column("revisado_por_id", sa.Integer(), sa.ForeignKey("usuarios.id")),
        sa.Column("justificativa_rejeicao", sa.Text()),
        sa.Column("propriedade_verificada", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.create_index("ix_solicitacoes_imoveis_imovel_id", "solicitacoes_imoveis", ["imovel_id"])
    op.create_index("ix_solicitacoes_imoveis_proprietario_id", "solicitacoes_imoveis", ["proprietario_id"])
    op.create_table(
        "documentos_imoveis",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("imovel_id", sa.Integer(), sa.ForeignKey("imoveis.id", ondelete="CASCADE"), nullable=False),
        sa.Column("solicitacao_id", sa.Integer(), sa.ForeignKey("solicitacoes_imoveis.id", ondelete="SET NULL")),
        sa.Column("nome_original", sa.String(255), nullable=False),
        sa.Column("nome_arquivo", sa.String(255), nullable=False, unique=True),
        sa.Column("caminho_arquivo", sa.String(500), nullable=False),
        sa.Column("tipo_mime", sa.String(100), nullable=False),
        sa.Column("tamanho_bytes", sa.Integer(), nullable=False),
        sa.Column("tipo_documento", sa.String(80), nullable=False, server_default="COMPROVANTE_PROPRIEDADE"),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_documentos_imoveis_imovel_id", "documentos_imoveis", ["imovel_id"])
    op.create_index("ix_documentos_imoveis_solicitacao_id", "documentos_imoveis", ["solicitacao_id"])
    op.create_table(
        "notificacoes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("solicitacao_id", sa.Integer(), sa.ForeignKey("solicitacoes_imoveis.id", ondelete="SET NULL")),
        sa.Column("tipo", sa.String(40), nullable=False),
        sa.Column("titulo", sa.String(150), nullable=False),
        sa.Column("mensagem", sa.Text(), nullable=False),
        sa.Column("lida", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("criada_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_notificacoes_usuario_id", "notificacoes", ["usuario_id"])
    op.create_index("ix_notificacoes_solicitacao_id", "notificacoes", ["solicitacao_id"])


def downgrade():
    op.drop_table("notificacoes")
    op.drop_table("documentos_imoveis")
    op.drop_table("solicitacoes_imoveis")
    # Não removemos o tipo no downgrade: a migration não consegue distinguir
    # um tipo criado por ela de um tipo preexistente com o mesmo nome. Mantê-lo
    # evita remover um ENUM compartilhado ou criado manualmente no banco.
