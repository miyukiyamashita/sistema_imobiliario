import enum
from datetime import date, datetime, time

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Text, Time, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class StatusSolicitacaoVisita(str, enum.Enum):
    PENDENTE = "PENDENTE"
    CONFIRMADA = "CONFIRMADA"
    RECUSADA = "RECUSADA"
    CANCELADA = "CANCELADA"


class SolicitacaoVisita(Base):
    __tablename__ = "solicitacoes_visita"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    imovel_id: Mapped[int] = mapped_column(ForeignKey("imoveis.id"), nullable=False, index=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False, index=True)
    decidido_por_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True, index=True)
    data_visita: Mapped[date] = mapped_column(Date, nullable=False)
    horario_visita: Mapped[time] = mapped_column(Time, nullable=False)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[StatusSolicitacaoVisita] = mapped_column(
        Enum(StatusSolicitacaoVisita, name="status_solicitacao_visita"),
        nullable=False,
    )
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    justificativa_decisao: Mapped[str | None] = mapped_column(Text, nullable=True)
    decidido_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    imovel = relationship("Imovel")
    cliente = relationship("Usuario", foreign_keys=[cliente_id])
    decidido_por = relationship("Usuario", foreign_keys=[decidido_por_id])
