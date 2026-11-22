
from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FotoImovel(Base):
    __tablename__ = "fotos_imoveis"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    imovel_id: Mapped[int] = mapped_column(
        ForeignKey("imoveis.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    nome_arquivo: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True
    )

    caminho_arquivo: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )

    tipo_mime: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    tamanho_bytes: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    criada_em = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    imovel = relationship("Imovel", back_populates="fotos")
