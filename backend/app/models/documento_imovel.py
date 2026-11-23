from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DocumentoImovel(Base):
    __tablename__ = "documentos_imoveis"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    imovel_id: Mapped[int] = mapped_column(ForeignKey("imoveis.id", ondelete="CASCADE"), nullable=False, index=True)
    solicitacao_id: Mapped[int | None] = mapped_column(ForeignKey("solicitacoes_imoveis.id", ondelete="SET NULL"), nullable=True, index=True)
    nome_original: Mapped[str] = mapped_column(String(255), nullable=False)
    nome_arquivo: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    caminho_arquivo: Mapped[str] = mapped_column(String(500), nullable=False)
    tipo_mime: Mapped[str] = mapped_column(String(100), nullable=False)
    tamanho_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    tipo_documento: Mapped[str] = mapped_column(String(80), nullable=False, default="COMPROVANTE_PROPRIEDADE")
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    imovel = relationship("Imovel", back_populates="documentos")
    solicitacao = relationship("SolicitacaoImovel", back_populates="documentos")
