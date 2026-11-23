from datetime import datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.proposta import StatusProposta


class CondicaoPagamento(str, Enum):
    A_VISTA = "A_VISTA"
    FINANCIAMENTO = "FINANCIAMENTO"
    FIADOR = "FIADOR"


class TipoProposta(str, Enum):
    COMPRA = "COMPRA"
    ALUGUEL = "ALUGUEL"


class AcaoProposta(str, Enum):
    ACEITAR = "ACEITAR"
    RECUSAR = "RECUSAR"
    CONTRAPROPOSTA = "CONTRAPROPOSTA"


class PropostaCriacao(BaseModel):
    imovel_id: int = Field(gt=0)
    tipo_proposta: TipoProposta
    valor_proposto: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    condicao_pagamento: CondicaoPagamento
    mensagem: str | None = Field(default=None, max_length=2000)


class RespostaProposta(BaseModel):
    acao: AcaoProposta
    valor_contraproposta: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    condicao_pagamento: CondicaoPagamento | None = None

    @model_validator(mode="after")
    def validar_contraproposta(self):
        if self.acao == AcaoProposta.CONTRAPROPOSTA:
            if self.valor_contraproposta is None or self.condicao_pagamento is None:
                raise ValueError("Informe o valor e a condição de pagamento da contraproposta.")
        elif self.valor_contraproposta is not None or self.condicao_pagamento is not None:
            raise ValueError("Valor e condição de pagamento só devem ser informados em uma contraproposta.")
        return self


class RespostaClienteProposta(BaseModel):
    acao: AcaoProposta
    valor_contraproposta: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    condicao_pagamento: CondicaoPagamento | None = None

    @model_validator(mode="after")
    def validar_resposta(self):
        if self.acao == AcaoProposta.CONTRAPROPOSTA:
            if self.valor_contraproposta is None or self.condicao_pagamento is None:
                raise ValueError("Informe o valor e a condição de pagamento da contraproposta.")
        elif self.valor_contraproposta is not None or self.condicao_pagamento is not None:
            raise ValueError("Valor e condição de pagamento só devem ser informados em uma contraproposta.")
        return self


class ImovelPropostaResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tipo: str
    finalidade: str
    valor: Decimal
    bairro: str
    cidade: str


class UsuarioPropostaResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    email: str


class PropostaResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    imovel_id: int
    cliente_id: int
    status: StatusProposta
    tipo_proposta: TipoProposta
    valor_proposto: Decimal
    condicao_pagamento: CondicaoPagamento
    mensagem: str | None = None
    contraproposta_valor: Decimal | None = None
    contraproposta_condicao_pagamento: CondicaoPagamento | None = None
    respondida_por_id: int | None = None
    criada_em: datetime
    atualizada_em: datetime
    imovel: ImovelPropostaResposta
    cliente: UsuarioPropostaResposta
