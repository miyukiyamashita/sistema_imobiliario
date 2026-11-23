
import enum
from decimal import Decimal
from sqlalchemy import CheckConstraint

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FinalidadeImovel(str, enum.Enum):
    VENDA = "VENDA"
    LOCACAO = "LOCACAO"


class SituacaoComercial(str, enum.Enum):
    RASCUNHO = "RASCUNHO"
    DISPONIVEL = "DISPONIVEL"
    INDISPONIVEL = "INDISPONIVEL"


class Imovel(Base):
    __tablename__ = "imoveis"

    __table_args__ = (
        CheckConstraint(
            "area > 0",
            name="ck_imoveis_area_positiva"
        ),
        CheckConstraint(
            "valor > 0",
            name="ck_imoveis_valor_positivo"
        ),
        CheckConstraint(
            "quartos >= 0",
            name="ck_imoveis_quartos"
        ),
        CheckConstraint(
            "banheiros >= 0",
            name="ck_imoveis_banheiros"
        ),
        CheckConstraint(
            "vagas_garagem >= 0",
            name="ck_imoveis_vagas"
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    proprietario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"),
        nullable=False,
        index=True
    )

    tipo: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    finalidade: Mapped[FinalidadeImovel] = mapped_column(
        Enum(FinalidadeImovel, name="finalidade_imovel"),
        nullable=False
    )

    logradouro: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    numero: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    complemento: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    bairro: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    cidade: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    estado: Mapped[str] = mapped_column(
        String(2),
        nullable=False
    )

    cep: Mapped[str] = mapped_column(
        String(8),
        nullable=False
    )


    area: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    valor: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )


    quartos: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )

    banheiros: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )

    vagas_garagem: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )

    descricao: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    situacao_comercial: Mapped[SituacaoComercial] = mapped_column(
        Enum(
            SituacaoComercial,
            name="situacao_comercial_imovel"
        ),
        nullable=False,
        default=SituacaoComercial.RASCUNHO
    )

    publicado: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False
    )

    ativo: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
    )

    criado_em = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    atualizado_em = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    proprietario = relationship("Usuario")

    fotos = relationship(
    "FotoImovel",
    back_populates="imovel",
    passive_deletes=True
)

    solicitacoes = relationship(
        "SolicitacaoImovel",
        back_populates="imovel",
        passive_deletes=True,
        order_by="SolicitacaoImovel.id",
    )

    documentos = relationship(
        "DocumentoImovel",
        back_populates="imovel",
        passive_deletes=True,
    )
