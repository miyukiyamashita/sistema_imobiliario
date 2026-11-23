from datetime import date, datetime, time
from pydantic import BaseModel, ConfigDict, Field

from app.models.solicitacao_visita import StatusSolicitacaoVisita


class SolicitacaoVisitaCriacao(BaseModel):
    imovel_id: int = Field(gt=0)
    data_visita: date
    horario_visita: time
    observacoes: str | None = Field(default=None, max_length=2000)


class JustificativaVisita(BaseModel):
    justificativa: str = Field(min_length=1, max_length=2000)


class ReagendamentoVisita(BaseModel):
    data_visita: date
    horario_visita: time
    justificativa: str = Field(min_length=1, max_length=2000)


class RespostaReagendamento(BaseModel):
    aceitar: bool


class HorarioDisponivelResposta(BaseModel):
    horario: time
    disponivel: bool


class HorariosDisponiveisResposta(BaseModel):
    data: date
    horarios: list[HorarioDisponivelResposta]


class ImovelVisitaResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tipo: str
    bairro: str
    cidade: str
    estado: str


class ClienteVisitaResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    email: str


class SolicitacaoVisitaResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    imovel_id: int
    cliente_id: int
    decidido_por_id: int | None = None
    data_visita: date
    horario_visita: time
    observacoes: str | None = None
    status: StatusSolicitacaoVisita
    criado_em: datetime
    atualizado_em: datetime
    justificativa_decisao: str | None = None
    decidido_em: datetime | None = None
    reagendamento_pendente: bool
    nova_data_visita: date | None = None
    novo_horario_visita: time | None = None
    imovel: ImovelVisitaResposta
    cliente: ClienteVisitaResposta | None = None
