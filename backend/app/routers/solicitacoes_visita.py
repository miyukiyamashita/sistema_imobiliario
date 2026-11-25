from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencias import exigir_perfis
from app.database import get_db
from app.models.solicitacao_visita import StatusSolicitacaoVisita
from app.models.usuario import PerfilUsuario, Usuario
from app.schemas.solicitacao_visita import HorariosDisponiveisResposta, JustificativaVisita, ReagendamentoVisita, RespostaReagendamento, SolicitacaoVisitaCriacao, SolicitacaoVisitaResposta
from app.services.solicitacao_visita_service import atualizar_status, criar_solicitacao, horarios_disponiveis, listar_administrativas, listar_minhas, listar_pendentes, propor_reagendamento, responder_reagendamento


router = APIRouter(tags=["Solicitações de visitas"])
CLIENTE = exigir_perfis(PerfilUsuario.CLIENTE)
ADMIN = exigir_perfis(PerfilUsuario.CORRETOR_ADMIN)


@router.get("/imoveis/{imovel_id}/horarios-disponiveis", response_model=HorariosDisponiveisResposta)
def consultar_horarios(
    imovel_id: int,
    data: date = Query(..., description="Data no formato YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    return {"data": data, "horarios": horarios_disponiveis(db, imovel_id, data)}


@router.post("/solicitacoes-visita", response_model=SolicitacaoVisitaResposta, status_code=status.HTTP_201_CREATED)
def solicitar(
    dados: SolicitacaoVisitaCriacao,
    db: Session = Depends(get_db),
    cliente: Usuario = Depends(CLIENTE),
):
    return criar_solicitacao(db, dados, cliente)


@router.get("/solicitacoes-visita/minhas", response_model=list[SolicitacaoVisitaResposta])
def minhas(
    db: Session = Depends(get_db),
    cliente: Usuario = Depends(CLIENTE),
):
    return listar_minhas(db, cliente)


@router.get("/solicitacoes-visita/pendentes", response_model=list[SolicitacaoVisitaResposta])
def pendentes(
    db: Session = Depends(get_db),
    administrador: Usuario = Depends(ADMIN),
):
    return listar_pendentes(db)


@router.get("/solicitacoes-visita", response_model=list[SolicitacaoVisitaResposta])
def administrativas(
    status_filtro: StatusSolicitacaoVisita | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    administrador: Usuario = Depends(ADMIN),
):
    return listar_administrativas(db, status_filtro)


@router.patch("/solicitacoes-visita/{solicitacao_id}/confirmar", response_model=SolicitacaoVisitaResposta)
def confirmar(
    solicitacao_id: int,
    db: Session = Depends(get_db),
    administrador: Usuario = Depends(ADMIN),
):
    return atualizar_status(db, solicitacao_id, administrador, StatusSolicitacaoVisita.CONFIRMADA)


@router.patch("/solicitacoes-visita/{solicitacao_id}/recusar", response_model=SolicitacaoVisitaResposta)
def recusar(
    solicitacao_id: int,
    dados: JustificativaVisita,
    db: Session = Depends(get_db),
    administrador: Usuario = Depends(ADMIN),
):
    return atualizar_status(db, solicitacao_id, administrador, StatusSolicitacaoVisita.RECUSADA, dados.justificativa)


@router.patch("/solicitacoes-visita/{solicitacao_id}/cancelar", response_model=SolicitacaoVisitaResposta)
def cancelar(
    solicitacao_id: int,
    dados: JustificativaVisita,
    db: Session = Depends(get_db),
    administrador: Usuario = Depends(ADMIN),
):
    return atualizar_status(db, solicitacao_id, administrador, StatusSolicitacaoVisita.CANCELADA, dados.justificativa)


@router.patch("/solicitacoes-visita/{solicitacao_id}/reagendar", response_model=SolicitacaoVisitaResposta)
def reagendar(
    solicitacao_id: int,
    dados: ReagendamentoVisita,
    db: Session = Depends(get_db),
    administrador: Usuario = Depends(ADMIN),
):
    return propor_reagendamento(db, solicitacao_id, dados, administrador)


@router.patch("/solicitacoes-visita/{solicitacao_id}/responder-reagendamento", response_model=SolicitacaoVisitaResposta)
def responder_a_reagendamento(
    solicitacao_id: int,
    dados: RespostaReagendamento,
    db: Session = Depends(get_db),
    cliente: Usuario = Depends(CLIENTE),
):
    return responder_reagendamento(db, solicitacao_id, cliente, dados.aceitar)
