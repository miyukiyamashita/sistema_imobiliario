from fastapi import APIRouter, Depends, File, UploadFile, status, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.dependencias import exigir_perfis
from app.database import get_db
from app.models.usuario import PerfilUsuario, Usuario
from app.schemas.foto_imovel import FotoImovelResposta
from app.schemas.imovel import ImovelProprietarioAtualizacao, ImovelProprietarioCadastro, ImovelResposta
from app.schemas.solicitacao import DocumentoResposta, RejeicaoRequest, SolicitacaoResposta
from app.services import solicitacao_service as service
from app.services.foto_imovel_service import adicionar_foto_imovel, listar_fotos_imovel, excluir_foto_imovel
from app.models.foto_imovel import FotoImovel
from app.config.fotografias import UPLOAD_DIR
from pathlib import Path

router = APIRouter(tags=["Solicitações de imóveis"])
OWNER = exigir_perfis(PerfilUsuario.PROPRIETARIO)
ADMIN = exigir_perfis(PerfilUsuario.CORRETOR_ADMIN)


@router.post("/imoveis/meus", response_model=ImovelResposta, status_code=status.HTTP_201_CREATED)
def criar(dados: ImovelProprietarioCadastro, db: Session = Depends(get_db), usuario: Usuario = Depends(OWNER)):
    return service.criar_draft(db, dados, usuario)


@router.get("/imoveis/meus", response_model=list[ImovelResposta])
def meus_imoveis(db: Session = Depends(get_db), usuario: Usuario = Depends(OWNER)):
    return service.listar_meus_imoveis(db, usuario)


@router.patch("/imoveis/meus/{imovel_id}", response_model=ImovelResposta)
def editar(imovel_id: int, dados: ImovelProprietarioAtualizacao, db: Session = Depends(get_db), usuario: Usuario = Depends(OWNER)):
    return service.atualizar_draft(db, imovel_id, dados, usuario)


@router.post("/imoveis/meus/{imovel_id}/fotos", response_model=FotoImovelResposta, status_code=201)
async def foto(imovel_id: int, arquivo: UploadFile = File(...), db: Session = Depends(get_db), usuario: Usuario = Depends(OWNER)):
    service._pode_editar(db, imovel_id, usuario)
    return await adicionar_foto_imovel(db, imovel_id, arquivo)


@router.get("/imoveis/meus/{imovel_id}/fotos", response_model=list[FotoImovelResposta])
def fotos(imovel_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(OWNER)):
    service._imovel_do_proprietario(db, imovel_id, usuario)
    return listar_fotos_imovel(db, imovel_id)


@router.delete("/imoveis/meus/{imovel_id}/fotos/{foto_id}", status_code=204)
def excluir_foto(imovel_id: int, foto_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(OWNER)):
    service._pode_editar(db, imovel_id, usuario)
    excluir_foto_imovel(db, imovel_id, foto_id)


@router.get("/imoveis/meus/{imovel_id}/fotos/{foto_id}")
def visualizar_foto(imovel_id: int, foto_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(OWNER)):
    service._imovel_do_proprietario(db, imovel_id, usuario)
    foto = db.scalar(select(FotoImovel).where(FotoImovel.id == foto_id, FotoImovel.imovel_id == imovel_id))
    if foto is None: raise HTTPException(404, "Fotografia não encontrada.")
    caminho = (UPLOAD_DIR / str(imovel_id) / foto.nome_arquivo).resolve()
    if not caminho.is_relative_to(UPLOAD_DIR.resolve()) or not caminho.is_file(): raise HTTPException(404, "Arquivo não encontrado.")
    return FileResponse(caminho, media_type=foto.tipo_mime, filename=foto.nome_arquivo)


@router.post("/imoveis/meus/{imovel_id}/documentos", response_model=DocumentoResposta, status_code=201)
async def documento(imovel_id: int, arquivo: UploadFile = File(...), db: Session = Depends(get_db), usuario: Usuario = Depends(OWNER)):
    return await service.adicionar_documento(db, imovel_id, arquivo, usuario)


@router.get("/imoveis/meus/{imovel_id}/documentos", response_model=list[DocumentoResposta])
def documentos(imovel_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(OWNER)):
    service._imovel_do_proprietario(db, imovel_id, usuario)
    from app.models.documento_imovel import DocumentoImovel
    return list(db.scalars(select(DocumentoImovel).where(DocumentoImovel.imovel_id == imovel_id)).all())


@router.post("/imoveis/meus/{imovel_id}/solicitacoes", response_model=SolicitacaoResposta, status_code=201)
def submeter(imovel_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(OWNER)):
    return service.submeter(db, imovel_id, usuario)


@router.get("/minhas-solicitacoes", response_model=list[SolicitacaoResposta])
def minhas_solicitacoes(db: Session = Depends(get_db), usuario: Usuario = Depends(OWNER)):
    return service.listar_solicitacoes(db, usuario)


@router.get("/minhas-solicitacoes/{solicitacao_id}", response_model=SolicitacaoResposta)
def minha_solicitacao(solicitacao_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(OWNER)):
    item = service._carregar_solicitacao(db, solicitacao_id)
    if item.proprietario_id != usuario.id: raise HTTPException(404, "Solicitação não encontrada.")
    return item


@router.get("/solicitacoes-imoveis", response_model=list[SolicitacaoResposta])
def pendentes(db: Session = Depends(get_db), usuario: Usuario = Depends(ADMIN)):
    return [item for item in service.listar_solicitacoes(db) if item.status.value == "EM_ANALISE"]


@router.get("/solicitacoes-imoveis/{solicitacao_id}", response_model=SolicitacaoResposta)
def detalhe(solicitacao_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(ADMIN)):
    return service._carregar_solicitacao(db, solicitacao_id)


@router.get("/solicitacoes-imoveis/{solicitacao_id}/documentos/{documento_id}")
def baixar_documento(solicitacao_id: int, documento_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(ADMIN)):
    documento, caminho = service.verificar_documento(db, solicitacao_id, documento_id, usuario)
    return FileResponse(caminho, media_type=documento.tipo_mime, filename=documento.nome_original)


@router.get("/solicitacoes-imoveis/{solicitacao_id}/fotos/{foto_id}")
def baixar_foto(solicitacao_id: int, foto_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(ADMIN)):
    solicitacao = service._carregar_solicitacao(db, solicitacao_id)
    foto = db.scalar(select(FotoImovel).where(FotoImovel.id == foto_id, FotoImovel.imovel_id == solicitacao.imovel_id))
    if foto is None: raise HTTPException(404, "Fotografia não encontrada.")
    caminho = (UPLOAD_DIR / str(foto.imovel_id) / foto.nome_arquivo).resolve()
    if not caminho.is_relative_to(UPLOAD_DIR.resolve()) or not caminho.is_file(): raise HTTPException(404, "Arquivo não encontrado.")
    return FileResponse(caminho, media_type=foto.tipo_mime, filename=foto.nome_arquivo)


@router.patch("/solicitacoes-imoveis/{solicitacao_id}/aprovar", response_model=SolicitacaoResposta)
def aprovar(solicitacao_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(ADMIN)):
    return service.revisar(db, solicitacao_id, usuario, True)


@router.patch("/solicitacoes-imoveis/{solicitacao_id}/rejeitar", response_model=SolicitacaoResposta)
def rejeitar(solicitacao_id: int, dados: RejeicaoRequest, db: Session = Depends(get_db), usuario: Usuario = Depends(ADMIN)):
    return service.revisar(db, solicitacao_id, usuario, False, dados.justificativa)
