
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FotoImovelResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    imovel_id: int
    nome_arquivo: str
    caminho_arquivo: str
    tipo_mime: str
    tamanho_bytes: int
    criada_em: datetime
