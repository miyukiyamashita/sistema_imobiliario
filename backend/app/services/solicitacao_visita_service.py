from datetime import date, datetime, time
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.models.imovel import Imovel, SituacaoComercial
from app.models.solicitacao_imovel import SolicitacaoImovel, StatusSolicitacao
from app.models.solicitacao_visita import SolicitacaoVisita, StatusSolicitacaoVisita
from app.models.usuario import Usuario
from app.schemas.solicitacao_visita import SolicitacaoVisitaCriacao


FUSO_HORARIO = ZoneInfo("America/Sao_Paulo")
HORARIOS_DISPONIVEIS = tuple(time(hora, 0) for hora in range(9, 18))
STATUS_BLOQUEIAM = (StatusSolicitacaoVisita.PENDENTE, StatusSolicitacaoVisita.CONFIRMADA)


def agora_sao_paulo() -> datetime:
    return datetime.now(FUSO_HORARIO)


def validar_data(data_visita: date) -> None:
    if data_visita.weekday() >= 5:
        raise HTTPException(status_code=422, detail="Visitas podem ser agendadas somente de segunda a sexta-feira.")
    if data_visita < agora_sao_paulo().date():
        raise HTTPException(status_code=422, detail="A data da visita deve ser futura.")


def validar_horario(data_visita: date, horario_visita: time) -> None:
    if horario_visita not in HORARIOS_DISPONIVEIS:
        raise HTTPException(status_code=422, detail="Horário inválido. Escolha um horário entre 09:00 e 17:00.")
    instante = datetime.combine(data_visita, horario_visita, tzinfo=FUSO_HORARIO)
    if instante <= agora_sao_paulo():
        raise HTTPException(status_code=422, detail="O horário da visita deve ser futuro.")


def buscar_imovel_agendavel(db: Session, imovel_id: int) -> Imovel:
    imovel = db.get(Imovel, imovel_id)
    if imovel is None:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado.")
    if not (imovel.ativo and imovel.publicado and imovel.situacao_comercial == SituacaoComercial.DISPONIVEL):
        raise HTTPException(status_code=409, detail="Este imóvel não está disponível para agendamento.")

    ultima_solicitacao = db.scalar(
        select(SolicitacaoImovel)
        .where(SolicitacaoImovel.imovel_id == imovel_id)
        .order_by(SolicitacaoImovel.id.desc())
    )
    if ultima_solicitacao is not None and ultima_solicitacao.status != StatusSolicitacao.APROVADO:
        raise HTTPException(status_code=409, detail="Este imóvel ainda não está aprovado para visitas.")
    return imovel


def horarios_disponiveis(db: Session, imovel_id: int, data_visita: date):
    buscar_imovel_agendavel(db, imovel_id)
    validar_data(data_visita)
    ocupados = set(db.scalars(
        select(SolicitacaoVisita.horario_visita).where(
            SolicitacaoVisita.imovel_id == imovel_id,
            SolicitacaoVisita.data_visita == data_visita,
            SolicitacaoVisita.status.in_(STATUS_BLOQUEIAM),
        )
    ).all())
    agora = agora_sao_paulo()
    return [
        {"horario": horario, "disponivel": horario not in ocupados and datetime.combine(data_visita, horario, tzinfo=FUSO_HORARIO) > agora}
        for horario in HORARIOS_DISPONIVEIS
    ]


def criar_solicitacao(db: Session, dados: SolicitacaoVisitaCriacao, cliente: Usuario) -> SolicitacaoVisita:
    buscar_imovel_agendavel(db, dados.imovel_id)
    validar_data(dados.data_visita)
    validar_horario(dados.data_visita, dados.horario_visita)

    existe = db.scalar(
        select(SolicitacaoVisita.id).where(
            SolicitacaoVisita.imovel_id == dados.imovel_id,
            SolicitacaoVisita.data_visita == dados.data_visita,
            SolicitacaoVisita.horario_visita == dados.horario_visita,
            SolicitacaoVisita.status.in_(STATUS_BLOQUEIAM),
        ).limit(1)
    )
    if existe is not None:
        raise HTTPException(status_code=409, detail="Este horário já foi solicitado para o imóvel.")

    solicitacao = SolicitacaoVisita(
        imovel_id=dados.imovel_id,
        cliente_id=cliente.id,
        data_visita=dados.data_visita,
        horario_visita=dados.horario_visita,
        observacoes=dados.observacoes.strip() if dados.observacoes else None,
        status=StatusSolicitacaoVisita.PENDENTE,
    )
    db.add(solicitacao)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Este horário acabou de ser ocupado por outra solicitação.")
    return buscar_solicitacao(db, solicitacao.id, cliente_id=cliente.id)


def buscar_solicitacao(db: Session, solicitacao_id: int, cliente_id: int | None = None) -> SolicitacaoVisita:
    consulta = select(SolicitacaoVisita).options(selectinload(SolicitacaoVisita.imovel), selectinload(SolicitacaoVisita.cliente)).where(SolicitacaoVisita.id == solicitacao_id)
    if cliente_id is not None:
        consulta = consulta.where(SolicitacaoVisita.cliente_id == cliente_id)
    solicitacao = db.scalar(consulta)
    if solicitacao is None:
        raise HTTPException(status_code=404, detail="Solicitação de visita não encontrada.")
    return solicitacao


def listar_minhas(db: Session, cliente: Usuario) -> list[SolicitacaoVisita]:
    consulta = (
        select(SolicitacaoVisita)
        .options(selectinload(SolicitacaoVisita.imovel))
        .where(SolicitacaoVisita.cliente_id == cliente.id)
        .order_by(SolicitacaoVisita.data_visita.desc(), SolicitacaoVisita.horario_visita.desc())
    )
    return list(db.scalars(consulta).all())


def listar_administrativas(db: Session, status_filtro: StatusSolicitacaoVisita | None = None) -> list[SolicitacaoVisita]:
    consulta = (
        select(SolicitacaoVisita)
        .options(selectinload(SolicitacaoVisita.imovel), selectinload(SolicitacaoVisita.cliente))
        .order_by(SolicitacaoVisita.data_visita, SolicitacaoVisita.horario_visita)
    )
    if status_filtro is not None:
        consulta = consulta.where(SolicitacaoVisita.status == status_filtro)
    return list(db.scalars(consulta).all())


def listar_pendentes(db: Session) -> list[SolicitacaoVisita]:
    return listar_administrativas(db, StatusSolicitacaoVisita.PENDENTE)


def atualizar_status(
    db: Session,
    solicitacao_id: int,
    administrador: Usuario,
    novo_status: StatusSolicitacaoVisita,
    justificativa: str | None = None,
) -> SolicitacaoVisita:
    solicitacao = db.scalar(
        select(SolicitacaoVisita)
        .where(SolicitacaoVisita.id == solicitacao_id)
        .with_for_update()
    )
    if solicitacao is None:
        raise HTTPException(status_code=404, detail="Solicitação de visita não encontrada.")

    transicoes_permitidas = {
        StatusSolicitacaoVisita.PENDENTE: {
            StatusSolicitacaoVisita.CONFIRMADA,
            StatusSolicitacaoVisita.RECUSADA,
            StatusSolicitacaoVisita.CANCELADA,
        },
        StatusSolicitacaoVisita.CONFIRMADA: {StatusSolicitacaoVisita.CANCELADA},
    }
    if novo_status not in transicoes_permitidas.get(solicitacao.status, set()):
        raise HTTPException(status_code=409, detail="A solicitação não permite essa alteração de status.")

    justificativa_limpa = (justificativa or "").strip()
    if novo_status in (StatusSolicitacaoVisita.RECUSADA, StatusSolicitacaoVisita.CANCELADA) and not justificativa_limpa:
        raise HTTPException(status_code=422, detail="A justificativa é obrigatória para essa ação.")

    solicitacao.status = novo_status
    solicitacao.decidido_por_id = administrador.id
    solicitacao.decidido_em = agora_sao_paulo()
    solicitacao.justificativa_decisao = justificativa_limpa or None
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Não foi possível concluir a alteração da solicitação.")
    return buscar_solicitacao(db, solicitacao_id)
