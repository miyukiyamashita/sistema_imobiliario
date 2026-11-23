

from decimal import Decimal
from fastapi import APIRouter, Depends, Query, Request, status
from fastapi import File, UploadFile
from fastapi import HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencias import exigir_perfis
from app.models.usuario import PerfilUsuario, Usuario
from app.services.imovel_service import listar_imoveis, buscar_imovel, cadastrar_imovel
from app.services.imovel_service import atualizar_imovel, publicar_imovel, inativar_imovel, excluir_imovel, listar_imoveis_publicos, buscar_imovel_publico
from app.models.imovel import FinalidadeImovel

from app.config.fotografias import UPLOAD_DIR
from app.models.imovel import Imovel, SituacaoComercial
from app.models.foto_imovel import FotoImovel

from app.schemas.foto_imovel import FotoImovelResposta
from app.services.foto_imovel_service import (
    adicionar_foto_imovel,
    listar_fotos_imovel,
    excluir_foto_imovel,
)

from app.schemas.imovel import (
    ImovelCadastro,
    ImovelResposta,
    ImovelAtualizacao,
    ImovelPublicoResposta,
    FotoPublicaResposta,
)

router = APIRouter(
    prefix="/imoveis",
    tags=["Imóveis"]
)


@router.post(
    "",
    response_model=ImovelResposta,
    status_code=status.HTTP_201_CREATED
)

def criar_imovel(
    dados: ImovelCadastro,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(
        exigir_perfis(PerfilUsuario.CORRETOR_ADMIN)
    )
):
    return cadastrar_imovel(db, dados)


@router.get(
    "",
    response_model=list[ImovelResposta]
)
def consultar_imoveis(
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(
        exigir_perfis(PerfilUsuario.CORRETOR_ADMIN)
    )
):
    return listar_imoveis(db)



@router.get(
    "/publicos",
    response_model=list[ImovelPublicoResposta],
    status_code=200,
    summary="Consultar catálogo público",
)
def consultar_catalogo_publico(
    request: Request,
    db: Session = Depends(get_db),
    busca: str | None = Query(default=None, max_length=100),
    cidade: str | None = Query(default=None, max_length=100),
    bairro: str | None = Query(default=None, max_length=100),
    tipo: str | None = Query(default=None, max_length=50),
    valor_min: Decimal | None = Query(default=None, ge=0),
    valor_max: Decimal | None = Query(default=None, ge=0),
    finalidade: FinalidadeImovel | None = Query(default=None),
    quartos: int | None = Query(default=None, ge=0),
):
    if valor_min is not None and valor_max is not None and valor_min > valor_max:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="O valor mínimo não pode ser maior que o valor máximo."
        )

    imoveis = listar_imoveis_publicos(
        db,
        busca=busca,
        cidade=cidade,
        bairro=bairro,
        tipo=tipo,
        valor_min=valor_min,
        valor_max=valor_max,
        finalidade=finalidade,
        quartos=quartos,
    )

    resultado = []

    for imovel in imoveis:

        # Validar os dados básicos do imóvel
        dados = ImovelResposta.model_validate(imovel)

        # Construir URLs completas das fotografias
        fotos = [
            FotoPublicaResposta(
                id=foto.id,
                url=str(
                    request.url_for(
                        "visualizar_foto_publica",
                        imovel_id=imovel.id,
                        foto_id=foto.id,
                    )
                ),
            )
            for foto in sorted(
                imovel.fotos,
                key=lambda foto: foto.id
            )
        ]

        imovel_publico = ImovelPublicoResposta(
            **dados.model_dump(),
            fotos=fotos,
        )

        resultado.append(imovel_publico)

    return resultado


@router.get(
    "/publicos/{imovel_id}",
    response_model=ImovelPublicoResposta,
    status_code=200,
    summary="Consultar imóvel no catálogo público",
)
def consultar_imovel_publico(
    imovel_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    imovel = buscar_imovel_publico(db, imovel_id)
    dados = ImovelResposta.model_validate(imovel)
    fotos = [
        FotoPublicaResposta(
            id=foto.id,
            url=str(request.url_for(
                "visualizar_foto_publica",
                imovel_id=imovel.id,
                foto_id=foto.id,
            )),
        )
        for foto in sorted(imovel.fotos, key=lambda foto: foto.id)
    ]
    return ImovelPublicoResposta(**dados.model_dump(), fotos=fotos)


@router.get(
    "/{imovel_id}",
    response_model=ImovelResposta
)

def consultar_imovel_por_id(
    imovel_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(
        exigir_perfis(PerfilUsuario.CORRETOR_ADMIN)
    )
):
    return buscar_imovel(db, imovel_id)


@router.patch(
    "/{imovel_id}",
    response_model=ImovelResposta
)

def editar_imovel(
    imovel_id: int,
    dados: ImovelAtualizacao,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(
        exigir_perfis(PerfilUsuario.CORRETOR_ADMIN)
    )
):
    return atualizar_imovel(db, imovel_id, dados)


@router.patch(
    "/{imovel_id}/publicar",
    response_model=ImovelResposta
)

def publicar_imovel_endpoint(
    imovel_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(
        exigir_perfis(PerfilUsuario.CORRETOR_ADMIN)
    )
):
    return publicar_imovel(db, imovel_id)


@router.patch(
    "/{imovel_id}/inativar",
    response_model=ImovelResposta
)

def inativar_imovel_endpoint(
    imovel_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(
        exigir_perfis(PerfilUsuario.CORRETOR_ADMIN)
    )
):
    return inativar_imovel(db, imovel_id)


@router.delete(
    "/{imovel_id}",
    status_code=status.HTTP_204_NO_CONTENT
)

def excluir_imovel_endpoint(
    imovel_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(
        exigir_perfis(PerfilUsuario.CORRETOR_ADMIN)
    )
):
    excluir_imovel(db, imovel_id)


@router.post(
    "/{imovel_id}/fotos",
    response_model=FotoImovelResposta,
    status_code=201,
    summary="Adicionar fotografia ao imóvel",
)
async def enviar_foto_imovel(
    imovel_id: int,
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(
        exigir_perfis(PerfilUsuario.CORRETOR_ADMIN)
    ),
):
    return await adicionar_foto_imovel(
        db=db,
        imovel_id=imovel_id,
        arquivo=arquivo,
    )


@router.get(
    "/{imovel_id}/fotos",
    response_model=list[FotoImovelResposta],
    status_code=200,
    summary="Listar fotografias do imóvel",
)
def consultar_fotos_imovel(
    imovel_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(
        exigir_perfis(PerfilUsuario.CORRETOR_ADMIN)
    ),
):
    return listar_fotos_imovel(
        db=db,
        imovel_id=imovel_id,
    )

@router.delete(
    "/{imovel_id}/fotos/{foto_id}",
    status_code=204,
    summary="Excluir fotografia do imóvel",
)

def remover_foto_imovel(
    imovel_id: int,
    foto_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(
        exigir_perfis(PerfilUsuario.CORRETOR_ADMIN)
    ),
):
    excluir_foto_imovel(
        db=db,
        imovel_id=imovel_id,
        foto_id=foto_id,
    )


@router.get(
    "/publicos/{imovel_id}/fotos/{foto_id}",
    summary="Visualizar fotografia pública do imóvel",
)
def visualizar_foto_publica(
    imovel_id: int,
    foto_id: int,
    db: Session = Depends(get_db),
):
    # 1. Verificar se o imóvel existe
    imovel = db.get(Imovel, imovel_id)

    if imovel is None:
        raise HTTPException(
            status_code=404,
            detail="Fotografia não encontrada."
        )

    # 2. Verificar se o imóvel está disponível publicamente
    if (
        not imovel.ativo
        or not imovel.publicado
        or imovel.situacao_comercial
        != SituacaoComercial.DISPONIVEL
    ):
        raise HTTPException(
            status_code=404,
            detail="Fotografia não encontrada."
        )

    # 3. Verificar se a fotografia pertence ao imóvel
    foto = db.get(FotoImovel, foto_id)

    if foto is None or foto.imovel_id != imovel_id:
        raise HTTPException(
            status_code=404,
            detail="Fotografia não encontrada."
        )

    # 4. Construir o caminho do arquivo
    diretorio = (UPLOAD_DIR / str(imovel_id)).resolve()
    caminho = (diretorio / foto.nome_arquivo).resolve()

    # Impedir acesso a arquivos fora do diretório
    if not caminho.is_relative_to(diretorio):
        raise HTTPException(
            status_code=404,
            detail="Fotografia não encontrada."
        )

    if not caminho.is_file():
        raise HTTPException(
            status_code=404,
            detail="Arquivo da fotografia não encontrado."
        )

    # 5. Retornar o conteúdo da imagem
    return FileResponse(
        path=caminho,
        media_type=foto.tipo_mime,
        filename=foto.nome_arquivo,
        content_disposition_type="inline",
        headers={"Cache-Control": "no-store"},
    )



