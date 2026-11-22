
from io import BytesIO
from pathlib import Path
from uuid import uuid4
from sqlalchemy import select
from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from sqlalchemy.orm import Session
from app.config.fotografias import UPLOAD_DIR


from app.config.fotografias import (
    UPLOAD_DIR,
    TAMANHO_MAXIMO,
    TIPOS_PERMITIDOS,
)
from app.models.imovel import Imovel
from app.models.foto_imovel import FotoImovel


FORMATOS_IMAGEM = {
    "JPEG": "image/jpeg",
    "PNG": "image/png",
    "WEBP": "image/webp",
}


async def adicionar_foto_imovel(
    db: Session,
    imovel_id: int,
    arquivo: UploadFile,
) -> FotoImovel:

    # 1. Verificar se o imóvel existe
    imovel = db.get(Imovel, imovel_id)

    if imovel is None:
        raise HTTPException(
            status_code=404,
            detail="Imóvel não encontrado."
        )

    # 2. Verificar se o imóvel está ativo
    if not imovel.ativo:
        raise HTTPException(
            status_code=400,
            detail="Não é possível adicionar fotos a um imóvel inativo."
        )

    # 3. Validar o tipo MIME informado
    if arquivo.content_type not in TIPOS_PERMITIDOS:
        raise HTTPException(
            status_code=400,
            detail="Formato não permitido. Utilize JPG, PNG ou WEBP."
        )

    # 4. Ler o arquivo com limite de tamanho
    conteudo = await arquivo.read(TAMANHO_MAXIMO + 1)

    if not conteudo:
        raise HTTPException(
            status_code=400,
            detail="O arquivo está vazio."
        )

    if len(conteudo) > TAMANHO_MAXIMO:
        raise HTTPException(
            status_code=413,
            detail="A fotografia deve ter no máximo 5 MB."
        )

    # 5. Validar o conteúdo real da imagem
    try:
        with Image.open(BytesIO(conteudo)) as imagem:
            formato = imagem.format
            imagem.verify()
    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
        Image.DecompressionBombError,
    ):
        raise HTTPException(
            status_code=400,
            detail="O arquivo não contém uma imagem válida."
        )

    tipo_real = FORMATOS_IMAGEM.get(formato)

    if tipo_real is None or tipo_real != arquivo.content_type:
        raise HTTPException(
            status_code=400,
            detail="O formato real da imagem não corresponde ao informado."
        )

    # 6. Gerar um nome único
    extensao = TIPOS_PERMITIDOS[tipo_real]
    nome_arquivo = f"{uuid4().hex}{extensao}"

    # 7. Criar diretório específico do imóvel
    diretorio_imovel = UPLOAD_DIR / str(imovel_id)
    diretorio_imovel.mkdir(parents=True, exist_ok=True)

    caminho = diretorio_imovel / nome_arquivo

    # 8. Salvar a fotografia no disco
    try:
        caminho.write_bytes(conteudo)
    except OSError:
        raise HTTPException(
            status_code=500,
            detail="Erro ao salvar a fotografia."
        )

    # 9. Registrar os metadados no PostgreSQL
    foto = FotoImovel(
        imovel_id=imovel_id,
        nome_arquivo=nome_arquivo,
        caminho_arquivo=str(
            Path("uploads") / "imoveis" /
            str(imovel_id) / nome_arquivo
        ),
        tipo_mime=tipo_real,
        tamanho_bytes=len(conteudo),
    )

    try:
        db.add(foto)
        db.commit()
        db.refresh(foto)
    except Exception:
        db.rollback()
        caminho.unlink(missing_ok=True)
        raise

    return foto


def listar_fotos_imovel(
    db: Session,
    imovel_id: int,
) -> list[FotoImovel]:

    # 1. Verificar se o imóvel existe
    imovel = db.get(Imovel, imovel_id)

    if imovel is None:
        raise HTTPException(
            status_code=404,
            detail="Imóvel não encontrado."
        )

    # 2. Consultar as fotografias associadas
    consulta = (
        select(FotoImovel)
        .where(FotoImovel.imovel_id == imovel_id)
        .order_by(FotoImovel.id.asc())
    )

    # 3. Retornar os registros encontrados
    return list(db.scalars(consulta).all())


def excluir_foto_imovel(
    db: Session,
    imovel_id: int,
    foto_id: int,
) -> None:

    # 1. Verificar se o imóvel existe
    imovel = db.get(Imovel, imovel_id)

    if imovel is None:
        raise HTTPException(
            status_code=404,
            detail="Imóvel não encontrado."
        )

    # 2. Localizar a fotografia
    foto = db.get(FotoImovel, foto_id)

    if foto is None or foto.imovel_id != imovel_id:
        raise HTTPException(
            status_code=404,
            detail="Fotografia não encontrada para este imóvel."
        )

    # 3. Construir o caminho a partir dos dados confiáveis
    # do banco, sem aceitar caminhos fornecidos pelo cliente
    caminho = (
        UPLOAD_DIR
        / str(imovel_id)
        / foto.nome_arquivo
    )

    # 4. Garantir que o arquivo esteja dentro do diretório
    # de armazenamento configurado
    diretorio = (UPLOAD_DIR / str(imovel_id)).resolve()
    caminho = caminho.resolve()

    if not caminho.is_relative_to(diretorio):
        raise HTTPException(
            status_code=500,
            detail="Caminho da fotografia inválido."
        )

    # 5. Remover o registro do PostgreSQL
    try:
        db.delete(foto)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Erro ao excluir o registro da fotografia."
        )

    # 6. Remover o arquivo físico
    try:
        caminho.unlink(missing_ok=True)
    except OSError:
        # O registro já foi excluído do banco.
        # Registrar o problema para limpeza posterior.
        import logging

        logging.getLogger(__name__).exception(
            "Falha ao remover arquivo da fotografia %s: %s",
            foto_id,
            caminho,
        )

