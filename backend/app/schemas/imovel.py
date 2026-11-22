
import re
from datetime import datetime
from decimal import Decimal
from enum import Enum

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)


class FinalidadeImovelSchema(str, Enum):
    VENDA = "VENDA"
    LOCACAO = "LOCACAO"


class ImovelCadastro(BaseModel):
    proprietario_id: int = Field(gt=0)

    tipo: str = Field(min_length=2, max_length=50)
    finalidade: FinalidadeImovelSchema

    logradouro: str = Field(min_length=3, max_length=200)
    numero: str = Field(min_length=1, max_length=20)
    complemento: str | None = Field(default=None, max_length=100)
    bairro: str = Field(min_length=2, max_length=100)
    cidade: str = Field(min_length=2, max_length=100)
    estado: str = Field(min_length=2, max_length=2)
    cep: str

    area: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    valor: Decimal = Field(gt=0, max_digits=12, decimal_places=2)

    quartos: int = Field(ge=0, default=0)
    banheiros: int = Field(ge=0, default=0)
    vagas_garagem: int = Field(ge=0, default=0)

    descricao: str | None = None

    @field_validator(
        "tipo",
        "logradouro",
        "numero",
        "bairro",
        "cidade"
    )
    @classmethod
    def remover_espacos(cls, valor: str) -> str:
        valor = " ".join(valor.split())

        if not valor:
            raise ValueError("Campo não pode estar vazio.")

        return valor

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, valor: str) -> str:
        estado = valor.strip().upper()

        if not estado.isalpha() or len(estado) != 2:
            raise ValueError("Estado deve conter uma UF válida.")

        return estado

    @field_validator("cep")
    @classmethod
    def validar_cep(cls, valor: str) -> str:
        cep = re.sub(r"\D", "", valor)

        if len(cep) != 8:
            raise ValueError("CEP deve conter 8 dígitos.")

        return cep


class ImovelResposta(ImovelCadastro):
    model_config = ConfigDict(from_attributes=True)

    id: int
    situacao_comercial: str
    publicado: bool
    ativo: bool

    criado_em: datetime
    atualizado_em: datetime



class ImovelAtualizacao(ImovelCadastro):
    proprietario_id: int | None = Field(default=None, gt=0)

    tipo: str | None = Field(default=None, min_length=2, max_length=50)
    finalidade: FinalidadeImovelSchema | None = None

    logradouro: str | None = Field(default=None, min_length=3, max_length=200)
    numero: str | None = Field(default=None, min_length=1, max_length=20)
    complemento: str | None = Field(default=None, max_length=100)
    bairro: str | None = Field(default=None, min_length=2, max_length=100)
    cidade: str | None = Field(default=None, min_length=2, max_length=100)
    estado: str | None = Field(default=None, min_length=2, max_length=2)
    cep: str | None = None

    area: Decimal | None = Field(
        default=None, gt=0, max_digits=10, decimal_places=2
    )
    valor: Decimal | None = Field(
        default=None, gt=0, max_digits=12, decimal_places=2
    )

    quartos: int | None = Field(default=None, ge=0)
    banheiros: int | None = Field(default=None, ge=0)
    vagas_garagem: int | None = Field(default=None, ge=0)

    descricao: str | None = None


class FotoPublicaResposta(BaseModel):
    id: int
    url: str


class ImovelPublicoResposta(ImovelResposta):
    fotos: list[FotoPublicaResposta] = Field(
        default_factory=list
    )
