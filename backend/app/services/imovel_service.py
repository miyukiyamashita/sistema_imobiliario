
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload

from app.models.imovel import (
    Imovel,
    FinalidadeImovel,
    SituacaoComercial,
)
from app.models.usuario import Usuario, PerfilUsuario
from app.models.proposta import Proposta
from app.schemas.imovel import ImovelCadastro
from app.schemas.imovel import ImovelAtualizacao

import logging
import shutil
from decimal import Decimal
from uuid import uuid4

from app.config.fotografias import UPLOAD_DIR


def cadastrar_imovel(
    db: Session,
    dados: ImovelCadastro
) -> Imovel:

    proprietario = db.get(
        Usuario,
        dados.proprietario_id
    )

    if proprietario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proprietário não encontrado."
        )

    if proprietario.perfil != PerfilUsuario.PROPRIETARIO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O usuário informado não possui perfil de proprietário."
        )

    if not proprietario.ativo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O proprietário informado está inativo."
        )

    novo_imovel = Imovel(
        proprietario_id=dados.proprietario_id,
        tipo=dados.tipo,
        finalidade=FinalidadeImovel(dados.finalidade.value),
        logradouro=dados.logradouro,
        numero=dados.numero,
        complemento=dados.complemento,
        bairro=dados.bairro,
        cidade=dados.cidade,
        estado=dados.estado,
        cep=dados.cep,
        area=dados.area,
        valor=dados.valor,
        quartos=dados.quartos,
        banheiros=dados.banheiros,
        vagas_garagem=dados.vagas_garagem,
        descricao=dados.descricao,
        situacao_comercial=SituacaoComercial.RASCUNHO,
        publicado=False,
        ativo=True,
    )

    db.add(novo_imovel)
    db.commit()
    db.refresh(novo_imovel)

    return novo_imovel


def listar_imoveis(db: Session) -> list[Imovel]:
    consulta = select(Imovel).order_by(Imovel.id)

    return list(db.scalars(consulta).all())


def buscar_imovel(
    db: Session,
    imovel_id: int
) -> Imovel:

    imovel = db.get(Imovel, imovel_id)

    if imovel is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Imóvel não encontrado."
        )

    return imovel


def atualizar_imovel(
    db: Session,
    imovel_id: int,
    dados: ImovelAtualizacao
) -> Imovel:

    imovel = buscar_imovel(db, imovel_id)

    if not imovel.ativo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é permitido editar um imóvel inativo."
        )

    atualizacoes = dados.model_dump(exclude_unset=True)

    campos_obrigatorios = {
        "proprietario_id", "tipo", "finalidade",
        "logradouro", "numero", "bairro",
        "cidade", "estado", "cep",
        "area", "valor", "quartos",
        "banheiros", "vagas_garagem"
    }

    for campo in campos_obrigatorios:
        if campo in atualizacoes and atualizacoes[campo] is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"O campo '{campo}' não pode ser nulo."
            )

    if "proprietario_id" in atualizacoes:
        proprietario = db.get(
            Usuario,
            atualizacoes["proprietario_id"]
        )

        if proprietario is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proprietário não encontrado."
            )

        if proprietario.perfil != PerfilUsuario.PROPRIETARIO:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O usuário informado não possui perfil de proprietário."
            )

        if not proprietario.ativo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O proprietário informado está inativo."
            )

    if "finalidade" in atualizacoes:
        atualizacoes["finalidade"] = FinalidadeImovel(
            atualizacoes["finalidade"].value
        )

    for campo, valor in atualizacoes.items():
        setattr(imovel, campo, valor)

    db.commit()
    db.refresh(imovel)

    return imovel


def publicar_imovel(
    db: Session,
    imovel_id: int
) -> Imovel:

    imovel = buscar_imovel(db, imovel_id)

    if not imovel.ativo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é permitido publicar um imóvel inativo."
        )

    if imovel.publicado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O imóvel já está publicado."
        )

    proprietario = db.get(
        Usuario,
        imovel.proprietario_id
    )

    if (
        proprietario is None
        or proprietario.perfil != PerfilUsuario.PROPRIETARIO
        or not proprietario.ativo
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O imóvel não possui um proprietário válido e ativo."
        )

    imovel.situacao_comercial = SituacaoComercial.DISPONIVEL
    imovel.publicado = True

    db.commit()
    db.refresh(imovel)

    return imovel


def inativar_imovel(
    db: Session,
    imovel_id: int
) -> Imovel:

    
    imovel = buscar_imovel(db, imovel_id)

    if not imovel.ativo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O imóvel já está inativo."
        )

    imovel.ativo = False
    imovel.publicado = False
    imovel.situacao_comercial = (
        SituacaoComercial.INDISPONIVEL
    )

    db.commit()
    db.refresh(imovel)

    return imovel



def excluir_imovel(
    db: Session,
    imovel_id: int
) -> None:

    imovel = buscar_imovel(db, imovel_id)

    # 1. Validar regras de exclusão
    if imovel.ativo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inative o imóvel antes de excluí-lo."
        )

    if imovel.publicado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é permitido excluir um imóvel publicado."
        )

    possui_propostas = db.scalar(
        select(Proposta.id)
        .where(Proposta.imovel_id == imovel_id)
        .limit(1)
    )
    if possui_propostas is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Não é possível excluir um imóvel com propostas registradas.",
        )

    # 2. Localizar o diretório das fotografias
    diretorio = UPLOAD_DIR / str(imovel_id)

    # Pasta temporária fora do diretório do imóvel,
    # mas no mesmo sistema de arquivos.
    lixeira = UPLOAD_DIR / ".exclusoes_pendentes"
    temporario = lixeira / f"{imovel_id}_{uuid4().hex}"

    movido = False

    try:
        # 3. Isolar os arquivos antes da exclusão
        if diretorio.exists():
            lixeira.mkdir(parents=True, exist_ok=True)
            diretorio.rename(temporario)
            movido = True

        # 4. Excluir o imóvel do PostgreSQL
        db.delete(imovel)
        db.commit()

    except Exception:
        db.rollback()

        # 5. Restaurar os arquivos caso o banco falhe
        if movido:
            try:
                temporario.rename(diretorio)
            except OSError:
                logging.getLogger(__name__).exception(
                    "Falha ao restaurar fotografias "
                    "do imóvel %s",
                    imovel_id,
                )

        raise

    # 6. Remover definitivamente os arquivos
    # somente após confirmar o commit
    if movido:
        try:
            shutil.rmtree(temporario)
        except OSError:
            logging.getLogger(__name__).exception(
                "Falha ao limpar arquivos do "
                "imóvel excluído %s. Pasta: %s",
                imovel_id,
                temporario,
            )




def listar_imoveis_publicos(
    db: Session,
    *,
    busca: str | None = None,
    cidade: str | None = None,
    bairro: str | None = None,
    tipo: str | None = None,
    valor_min: Decimal | None = None,
    valor_max: Decimal | None = None,
    finalidade: FinalidadeImovel | None = None,
    quartos: int | None = None,
) -> list[Imovel]:
    consulta = (
        select(Imovel)
        .options(selectinload(Imovel.fotos))
        .where(
            Imovel.ativo.is_(True),
            Imovel.publicado.is_(True),
            Imovel.situacao_comercial
            == SituacaoComercial.DISPONIVEL,
        )
    )

    if busca:
        termo = f"%{busca.strip()}%"
        consulta = consulta.where(or_(
            Imovel.tipo.ilike(termo),
            Imovel.logradouro.ilike(termo),
            Imovel.bairro.ilike(termo),
            Imovel.cidade.ilike(termo),
            Imovel.estado.ilike(termo),
            Imovel.descricao.ilike(termo),
        ))
    if cidade:
        consulta = consulta.where(Imovel.cidade.ilike(cidade.strip()))
    if bairro:
        consulta = consulta.where(Imovel.bairro.ilike(bairro.strip()))
    if tipo:
        consulta = consulta.where(Imovel.tipo.ilike(tipo.strip()))
    if valor_min is not None:
        consulta = consulta.where(Imovel.valor >= valor_min)
    if valor_max is not None:
        consulta = consulta.where(Imovel.valor <= valor_max)
    if finalidade is not None:
        consulta = consulta.where(Imovel.finalidade == finalidade)
    if quartos is not None:
        consulta = consulta.where(Imovel.quartos >= quartos)

    return list(db.scalars(consulta.order_by(Imovel.id.desc())).all())


def buscar_imovel_publico(
    db: Session,
    imovel_id: int,
) -> Imovel:
    consulta = (
        select(Imovel)
        .options(selectinload(Imovel.fotos))
        .where(
            Imovel.id == imovel_id,
            Imovel.ativo.is_(True),
            Imovel.publicado.is_(True),
            Imovel.situacao_comercial == SituacaoComercial.DISPONIVEL,
        )
    )
    imovel = db.scalars(consulta).first()

    if imovel is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Imóvel não encontrado no catálogo público."
        )

    return imovel

