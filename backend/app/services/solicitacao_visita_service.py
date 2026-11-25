from datetime import date, datetime, time
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.models.imovel import Imovel, SituacaoComercial
from app.models.solicitacao_imovel import SolicitacaoImovel, StatusSolicitacao
from app.models.solicitacao_visita import SolicitacaoVisita, StatusSolicitacaoVisita
from app.models.notificacao import Notificacao
from app.models.usuario import PerfilUsuario, Usuario
from app.schemas.solicitacao_visita import ReagendamentoVisita, SolicitacaoVisitaCriacao


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
    visitas = db.scalars(
        select(SolicitacaoVisita).where(
            SolicitacaoVisita.imovel_id == imovel_id,
            or_(
                (SolicitacaoVisita.data_visita == data_visita)
                & (SolicitacaoVisita.status.in_(STATUS_BLOQUEIAM)),
                (SolicitacaoVisita.reagendamento_pendente.is_(True))
                & (SolicitacaoVisita.nova_data_visita == data_visita),
            ),
        )
    ).all()
    ocupados = set()
    for visita in visitas:
        if visita.status in STATUS_BLOQUEIAM and visita.data_visita == data_visita:
            ocupados.add(visita.horario_visita)
        if visita.reagendamento_pendente and visita.nova_data_visita == data_visita:
            ocupados.add(visita.novo_horario_visita)
    agora = agora_sao_paulo()
    return [
        {"horario": horario, "disponivel": horario not in ocupados and datetime.combine(data_visita, horario, tzinfo=FUSO_HORARIO) > agora}
        for horario in HORARIOS_DISPONIVEIS
    ]


def criar_solicitacao(db: Session, dados: SolicitacaoVisitaCriacao, cliente: Usuario) -> SolicitacaoVisita:
    buscar_imovel_agendavel(db, dados.imovel_id)
    db.scalar(
        select(Imovel)
        .where(Imovel.id == dados.imovel_id)
        .with_for_update()
    )
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
    imovel = db.get(Imovel, dados.imovel_id)
    if imovel is not None:
        destinatarios = {imovel.proprietario_id}
        destinatarios.update(
            db.scalars(
                select(Usuario.id).where(
                    Usuario.perfil == PerfilUsuario.CORRETOR_ADMIN,
                    Usuario.ativo.is_(True),
                )
            ).all()
        )
        for usuario_id in destinatarios:
            db.add(
                Notificacao(
                    usuario_id=usuario_id,
                    tipo="NOVA_SOLICITACAO_VISITA",
                    titulo="Nova solicitação de visita",
                    mensagem=f"{cliente.nome} solicitou uma visita ao imóvel #{imovel.id}.",
                )
            )
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
    if solicitacao.reagendamento_pendente and novo_status == StatusSolicitacaoVisita.CONFIRMADA:
        raise HTTPException(status_code=409, detail="Aguarde a resposta do cliente ao reagendamento.")

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
    solicitacao.reagendamento_pendente = False
    solicitacao.nova_data_visita = None
    solicitacao.novo_horario_visita = None
    db.add(
        Notificacao(
            usuario_id=solicitacao.cliente_id,
            tipo="ATUALIZACAO_VISITA",
            titulo="Atualização da visita",
            mensagem=(
                f"A solicitação de visita #{solicitacao.id} foi "
                f"{'confirmada' if novo_status == StatusSolicitacaoVisita.CONFIRMADA else 'recusada' if novo_status == StatusSolicitacaoVisita.RECUSADA else 'cancelada'}."
                + (f" Motivo: {justificativa_limpa}" if justificativa_limpa else "")
            ),
        )
    )
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Não foi possível concluir a alteração da solicitação.")
    return buscar_solicitacao(db, solicitacao_id)


def propor_reagendamento(
    db: Session,
    solicitacao_id: int,
    dados: ReagendamentoVisita,
    administrador: Usuario,
) -> SolicitacaoVisita:
    solicitacao = db.get(SolicitacaoVisita, solicitacao_id)
    if solicitacao is None:
        raise HTTPException(status_code=404, detail="Solicitação de visita não encontrada.")
    if solicitacao.status not in STATUS_BLOQUEIAM or solicitacao.reagendamento_pendente:
        raise HTTPException(status_code=409, detail="Esta visita não pode ser reagendada agora.")

    db.scalar(
        select(Imovel)
        .where(Imovel.id == solicitacao.imovel_id)
        .with_for_update()
    )
    solicitacao = db.scalar(
        select(SolicitacaoVisita)
        .where(SolicitacaoVisita.id == solicitacao_id)
        .with_for_update()
    )
    if solicitacao is None or solicitacao.status not in STATUS_BLOQUEIAM:
        raise HTTPException(status_code=409, detail="Esta visita não pode ser reagendada agora.")
    if solicitacao.reagendamento_pendente:
        raise HTTPException(status_code=409, detail="Já existe um reagendamento aguardando resposta.")

    validar_data(dados.data_visita)
    validar_horario(dados.data_visita, dados.horario_visita)
    visitas = db.scalars(
        select(SolicitacaoVisita).where(
            SolicitacaoVisita.imovel_id == solicitacao.imovel_id,
            SolicitacaoVisita.id != solicitacao.id,
            or_(
                (SolicitacaoVisita.status.in_(STATUS_BLOQUEIAM))
                & (SolicitacaoVisita.data_visita == dados.data_visita)
                & (SolicitacaoVisita.horario_visita == dados.horario_visita),
                (SolicitacaoVisita.reagendamento_pendente.is_(True))
                & (SolicitacaoVisita.nova_data_visita == dados.data_visita)
                & (SolicitacaoVisita.novo_horario_visita == dados.horario_visita),
            ),
        )
    ).first()
    if visitas is not None:
        raise HTTPException(status_code=409, detail="Este horário já está ocupado para o imóvel.")

    justificativa = dados.justificativa.strip()
    if not justificativa:
        raise HTTPException(status_code=422, detail="A justificativa do reagendamento é obrigatória.")
    solicitacao.reagendamento_pendente = True
    solicitacao.nova_data_visita = dados.data_visita
    solicitacao.novo_horario_visita = dados.horario_visita
    solicitacao.justificativa_decisao = justificativa
    solicitacao.decidido_por_id = administrador.id
    solicitacao.decidido_em = agora_sao_paulo()
    db.add(
        Notificacao(
            usuario_id=solicitacao.cliente_id,
            tipo="REAGENDAMENTO_VISITA",
            titulo="Novo horário sugerido para sua visita",
            mensagem=(
                f"Foi sugerido {dados.data_visita:%d/%m/%Y} às "
                f"{dados.horario_visita:%H:%M} para a visita ao imóvel "
                f"#{solicitacao.imovel_id}. Motivo: {justificativa} "
                "Confirme ou recuse no painel."
            ),
        )
    )
    db.commit()
    return buscar_solicitacao(db, solicitacao.id)


def responder_reagendamento(
    db: Session,
    solicitacao_id: int,
    cliente: Usuario,
    aceitar: bool,
) -> SolicitacaoVisita:
    solicitacao = db.get(SolicitacaoVisita, solicitacao_id)
    if solicitacao is None or solicitacao.cliente_id != cliente.id:
        raise HTTPException(status_code=404, detail="Solicitação de visita não encontrada.")
    db.scalar(
        select(Imovel)
        .where(Imovel.id == solicitacao.imovel_id)
        .with_for_update()
    )
    solicitacao = db.scalar(
        select(SolicitacaoVisita)
        .where(
            SolicitacaoVisita.id == solicitacao_id,
            SolicitacaoVisita.cliente_id == cliente.id,
        )
        .with_for_update()
    )
    if solicitacao is None:
        raise HTTPException(status_code=404, detail="Solicitação de visita não encontrada.")
    if not solicitacao.reagendamento_pendente:
        raise HTTPException(status_code=409, detail="Esta visita não tem reagendamento pendente.")

    status_anterior = solicitacao.status
    if aceitar:
        nova_data = solicitacao.nova_data_visita
        novo_horario = solicitacao.novo_horario_visita
        if nova_data is None or novo_horario is None:
            raise HTTPException(status_code=409, detail="O reagendamento está incompleto.")
        validar_data(nova_data)
        validar_horario(nova_data, novo_horario)
        ocupada = db.scalar(
            select(SolicitacaoVisita.id).where(
                SolicitacaoVisita.imovel_id == solicitacao.imovel_id,
                SolicitacaoVisita.id != solicitacao.id,
                or_(
                    (SolicitacaoVisita.status.in_(STATUS_BLOQUEIAM))
                    & (SolicitacaoVisita.data_visita == nova_data)
                    & (SolicitacaoVisita.horario_visita == novo_horario),
                    (SolicitacaoVisita.reagendamento_pendente.is_(True))
                    & (SolicitacaoVisita.nova_data_visita == nova_data)
                    & (SolicitacaoVisita.novo_horario_visita == novo_horario),
                ),
            )
        )
        if ocupada is not None:
            raise HTTPException(status_code=409, detail="Este horário acabou de ser ocupado.")
        solicitacao.data_visita = nova_data
        solicitacao.horario_visita = novo_horario
        solicitacao.status = StatusSolicitacaoVisita.CONFIRMADA
    else:
        # A recusa do novo horário não é cancelamento administrativo. O cliente
        # apenas rejeita a sugestão e a visita mantém o status original.
        solicitacao.status = status_anterior
        solicitacao.justificativa_decisao = "O cliente recusou o horário sugerido."

    solicitacao.reagendamento_pendente = False
    solicitacao.nova_data_visita = None
    solicitacao.novo_horario_visita = None
    solicitacao.decidido_em = None
    db.add(
        Notificacao(
            usuario_id=solicitacao.decidido_por_id,
            tipo="RESPOSTA_REAGENDAMENTO",
            titulo="Resposta ao reagendamento",
            mensagem=(
                f"{cliente.nome} {'confirmou' if aceitar else 'recusou'} "
                f"o novo horário da visita #{solicitacao.id}."
            ),
        )
    )
    db.commit()
    return buscar_solicitacao(db, solicitacao.id, cliente_id=cliente.id)
