import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class StatusSolicitacao(str, enum.Enum):
    EM_ANALISE = "EM_ANALISE"
    APROVADO = "APROVADO"
    REJEITADO = "REJEITADO"


class SolicitacaoImovel(Base):
    __tablename__ = "solicitacoes_imoveis"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    imovel_id: Mapped[int] = mapped_column(ForeignKey("imoveis.id"), nullable=False, index=True)
    proprietario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False, index=True)
    status: Mapped[StatusSolicitacao] = mapped_column(
        Enum(StatusSolicitacao, name="status_solicitacao_imovel"),
        nullable=False,
    )
    submetida_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    revisada_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revisado_por_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    justificativa_rejeicao: Mapped[str | None] = mapped_column(Text, nullable=True)
    propriedade_verificada: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    imovel = relationship("Imovel", back_populates="solicitacoes")
    documentos = relationship("DocumentoImovel", back_populates="solicitacao")
    proprietario = relationship("Usuario", foreign_keys=[proprietario_id])
    revisor = relationship("Usuario", foreign_keys=[revisado_por_id])
