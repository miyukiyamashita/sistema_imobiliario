from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.imovel import FinalidadeImovel, Imovel, SituacaoComercial
from app.models.notificacao import Notificacao
from app.models.proposta import Proposta, StatusProposta
from app.models.usuario import PerfilUsuario, Usuario
from app.schemas.proposta import (
    AcaoProposta,
    PropostaCriacao,
    RespostaClienteProposta,
    RespostaProposta,
)


def _carregar(db: Session, proposta_id: int) -> Proposta:
    proposta = db.scalar(
        select(Proposta)
        .options(selectinload(Proposta.imovel), selectinload(Proposta.cliente))
        .where(Proposta.id == proposta_id)
    )
    if proposta is None:
        raise HTTPException(status_code=404, detail="Proposta não encontrada.")
    return proposta


def criar(db: Session, dados: PropostaCriacao, cliente: Usuario) -> Proposta:
    imovel = db.scalar(
        select(Imovel)
        .where(Imovel.id == dados.imovel_id)
        .with_for_update()
    )
    if imovel is None or not imovel.ativo or not imovel.publicado or imovel.situacao_comercial != SituacaoComercial.DISPONIVEL:
        raise HTTPException(status_code=404, detail="Imóvel não disponível para propostas.")
    if imovel.proprietario_id == cliente.id:
        raise HTTPException(status_code=403, detail="Não é possível enviar proposta para seu próprio imóvel.")
    tipo_esperado = "COMPRA" if imovel.finalidade == FinalidadeImovel.VENDA else "ALUGUEL"
    if dados.tipo_proposta.value != tipo_esperado:
        raise HTTPException(status_code=422, detail="O tipo da proposta deve corresponder à finalidade do imóvel.")

    proposta = Proposta(
        imovel_id=imovel.id,
        cliente_id=cliente.id,
        status=StatusProposta.EM_ANALISE,
        tipo_proposta=dados.tipo_proposta.value,
        valor_proposto=dados.valor_proposto,
        condicao_pagamento=dados.condicao_pagamento.value,
        mensagem=dados.mensagem.strip() if dados.mensagem else None,
    )
    db.add(proposta)
    db.flush()
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
                tipo="NOVA_PROPOSTA",
                titulo="Nova proposta recebida",
                mensagem=f"{cliente.nome} enviou uma proposta para o imóvel #{imovel.id}.",
            )
        )
    db.commit()
    return _carregar(db, proposta.id)


def listar_do_cliente(db: Session, cliente: Usuario) -> list[Proposta]:
    return list(
        db.scalars(
            select(Proposta)
            .options(selectinload(Proposta.imovel), selectinload(Proposta.cliente))
            .where(Proposta.cliente_id == cliente.id)
            .order_by(Proposta.criada_em.desc(), Proposta.id.desc())
        ).all()
    )


def listar_recebidas(db: Session, usuario: Usuario) -> list[Proposta]:
    consulta = (
        select(Proposta)
        .join(Imovel, Proposta.imovel_id == Imovel.id)
        .options(selectinload(Proposta.imovel), selectinload(Proposta.cliente))
        .order_by(Proposta.criada_em.desc(), Proposta.id.desc())
    )
    if usuario.perfil != PerfilUsuario.CORRETOR_ADMIN:
        consulta = consulta.where(Imovel.proprietario_id == usuario.id)
    return list(db.scalars(consulta).all())


def _validar_responsavel(proposta: Proposta, usuario: Usuario) -> None:
    if (
        usuario.perfil != PerfilUsuario.CORRETOR_ADMIN
        and proposta.imovel.proprietario_id != usuario.id
    ):
        raise HTTPException(status_code=404, detail="Proposta não encontrada.")


def responder(
    db: Session,
    proposta_id: int,
    dados: RespostaProposta,
    usuario: Usuario,
) -> Proposta:
    proposta = db.scalar(
        select(Proposta)
        .options(selectinload(Proposta.imovel), selectinload(Proposta.cliente))
        .where(Proposta.id == proposta_id)
        .with_for_update()
    )
    if proposta is None:
        raise HTTPException(status_code=404, detail="Proposta não encontrada.")
    _validar_responsavel(proposta, usuario)
    if proposta.status != StatusProposta.EM_ANALISE:
        raise HTTPException(status_code=409, detail="Esta proposta não está aguardando análise.")

    if dados.acao == AcaoProposta.ACEITAR:
        proposta.status = StatusProposta.ACEITA
    elif dados.acao == AcaoProposta.RECUSAR:
        proposta.status = StatusProposta.RECUSADA
    else:
        proposta.status = StatusProposta.AGUARDANDO_RESPOSTA_CLIENTE
        proposta.contraproposta_valor = dados.valor_contraproposta
        proposta.contraproposta_condicao_pagamento = dados.condicao_pagamento.value

    proposta.respondida_por_id = usuario.id
    db.add(
        Notificacao(
            usuario_id=proposta.cliente_id,
            tipo="RESPOSTA_PROPOSTA",
            titulo="Atualização da sua proposta",
            mensagem=(
                "Foi enviada uma contraproposta para você analisar."
                if dados.acao == AcaoProposta.CONTRAPROPOSTA
                else f"Sua proposta foi {'aceita' if dados.acao == AcaoProposta.ACEITAR else 'recusada'}."
            ),
        )
    )
    db.commit()
    return _carregar(db, proposta.id)


def responder_cliente(
    db: Session,
    proposta_id: int,
    dados: RespostaClienteProposta,
    cliente: Usuario,
) -> Proposta:
    proposta = db.scalar(
        select(Proposta)
        .options(selectinload(Proposta.imovel), selectinload(Proposta.cliente))
        .where(Proposta.id == proposta_id, Proposta.cliente_id == cliente.id)
        .with_for_update()
    )
    if proposta is None:
        raise HTTPException(status_code=404, detail="Proposta não encontrada.")
    if proposta.status != StatusProposta.AGUARDANDO_RESPOSTA_CLIENTE:
        raise HTTPException(status_code=409, detail="Esta proposta não está aguardando sua resposta.")

    if dados.acao == AcaoProposta.ACEITAR:
        if proposta.contraproposta_valor is None or proposta.contraproposta_condicao_pagamento is None:
            raise HTTPException(status_code=409, detail="A contraproposta está incompleta.")
        proposta.valor_proposto = proposta.contraproposta_valor
        proposta.condicao_pagamento = proposta.contraproposta_condicao_pagamento
        proposta.contraproposta_valor = None
        proposta.contraproposta_condicao_pagamento = None
        proposta.status = StatusProposta.ACEITA
    elif dados.acao == AcaoProposta.RECUSAR:
        proposta.status = StatusProposta.RECUSADA
    else:
        proposta.status = StatusProposta.EM_ANALISE
        proposta.valor_proposto = dados.valor_contraproposta
        proposta.condicao_pagamento = dados.condicao_pagamento.value
        proposta.contraproposta_valor = None
        proposta.contraproposta_condicao_pagamento = None

    proposta.respondida_por_id = cliente.id
    destinatarios = {proposta.imovel.proprietario_id}
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
                tipo="RESPOSTA_PROPOSTA",
                titulo="Resposta à proposta",
                mensagem=(
                    f"{cliente.nome} enviou uma contraproposta para o imóvel "
                    f"#{proposta.imovel_id}."
                    if dados.acao == AcaoProposta.CONTRAPROPOSTA
                    else f"{cliente.nome} {'aceitou' if dados.acao == AcaoProposta.ACEITAR else 'recusou'} a contraproposta do imóvel #{proposta.imovel_id}."
                ),
            )
        )
    db.commit()
    return _carregar(db, proposta.id)
