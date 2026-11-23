from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
from app.models.solicitacao_imovel import StatusSolicitacao


class DocumentoResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nome_original: str
    tipo_mime: str
    tamanho_bytes: int
    tipo_documento: str
    criado_em: datetime


class FotoSolicitacaoResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nome_arquivo: str
    tipo_mime: str


class ImovelSolicitacaoResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tipo: str
    finalidade: str
    cidade: str
    bairro: str
    valor: Decimal
    descricao: str | None = None
    publicado: bool
    ativo: bool
    fotos: list[FotoSolicitacaoResposta] = Field(default_factory=list)


class SolicitacaoResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    imovel_id: int
    proprietario_id: int
    status: StatusSolicitacao
    submetida_em: datetime
    revisada_em: datetime | None = None
    revisado_por_id: int | None = None
    justificativa_rejeicao: str | None = None
    propriedade_verificada: bool
    imovel: ImovelSolicitacaoResposta
    documentos: list[DocumentoResposta] = Field(default_factory=list)


class RejeicaoRequest(BaseModel):
    justificativa: str = Field(min_length=1, max_length=2000)


class NotificacaoResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    solicitacao_id: int | None = None
    tipo: str
    titulo: str
    mensagem: str
    lida: bool
    criada_em: datetime
