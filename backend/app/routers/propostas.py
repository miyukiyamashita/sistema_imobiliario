from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencias import exigir_perfis
from app.database import get_db
from app.models.usuario import PerfilUsuario, Usuario
from app.schemas.proposta import (
    PropostaCriacao,
    PropostaResposta,
    RespostaClienteProposta,
    RespostaProposta,
)
from app.services.proposta_service import (
    criar,
    listar_do_cliente,
    listar_recebidas,
    responder,
    responder_cliente,
)


router = APIRouter(prefix="/propostas", tags=["Propostas"])
CLIENTE = exigir_perfis(PerfilUsuario.CLIENTE)
PROPRIETARIO_OU_ADMIN = exigir_perfis(
    PerfilUsuario.PROPRIETARIO,
    PerfilUsuario.CORRETOR_ADMIN,
)


@router.post("", response_model=PropostaResposta, status_code=status.HTTP_201_CREATED)
def enviar(
    dados: PropostaCriacao,
    db: Session = Depends(get_db),
    cliente: Usuario = Depends(CLIENTE),
):
    return criar(db, dados, cliente)


@router.get("/minhas", response_model=list[PropostaResposta])
def minhas(
    db: Session = Depends(get_db),
    cliente: Usuario = Depends(CLIENTE),
):
    return listar_do_cliente(db, cliente)


@router.get("/recebidas", response_model=list[PropostaResposta])
def recebidas(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(PROPRIETARIO_OU_ADMIN),
):
    return listar_recebidas(db, usuario)


@router.patch("/{proposta_id}/responder", response_model=PropostaResposta)
def responder_a_proposta(
    proposta_id: int,
    dados: RespostaProposta,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(PROPRIETARIO_OU_ADMIN),
):
    return responder(db, proposta_id, dados, usuario)


@router.patch("/{proposta_id}/responder-cliente", response_model=PropostaResposta)
def responder_a_contraproposta(
    proposta_id: int,
    dados: RespostaClienteProposta,
    db: Session = Depends(get_db),
    cliente: Usuario = Depends(CLIENTE),
):
    return responder_cliente(db, proposta_id, dados, cliente)
