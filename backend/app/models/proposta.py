import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class StatusProposta(str, enum.Enum):
    EM_ANALISE = "EM_ANALISE"
    ACEITA = "ACEITA"
    RECUSADA = "RECUSADA"
    AGUARDANDO_RESPOSTA_CLIENTE = "AGUARDANDO_RESPOSTA_CLIENTE"


class Proposta(Base):
    __tablename__ = "propostas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    imovel_id: Mapped[int] = mapped_column(ForeignKey("imoveis.id"), nullable=False, index=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False, index=True)
    status: Mapped[StatusProposta] = mapped_column(
        Enum(StatusProposta, name="status_proposta"),
        nullable=False,
    )
    tipo_proposta: Mapped[str] = mapped_column(String(20), nullable=False)
    valor_proposto: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    condicao_pagamento: Mapped[str] = mapped_column(String(30), nullable=False)
    mensagem: Mapped[str | None] = mapped_column(Text, nullable=True)
    contraproposta_valor: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    contraproposta_condicao_pagamento: Mapped[str | None] = mapped_column(String(30), nullable=True)
    respondida_por_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    criada_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizada_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    imovel = relationship("Imovel")
    cliente = relationship("Usuario", foreign_keys=[cliente_id])
    respondida_por = relationship("Usuario", foreign_keys=[respondida_por_id])
