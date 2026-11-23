from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from app.config.fotografias import DOCUMENTOS_DIR, TAMANHO_MAXIMO_DOCUMENTO, TIPOS_DOCUMENTO_PERMITIDOS
from app.models.documento_imovel import DocumentoImovel
from app.models.imovel import Imovel, SituacaoComercial
from app.models.notificacao import Notificacao
from app.models.solicitacao_imovel import SolicitacaoImovel, StatusSolicitacao
from app.models.usuario import PerfilUsuario, Usuario
from app.schemas.imovel import ImovelProprietarioAtualizacao, ImovelProprietarioCadastro
from app.schemas.solicitacao import RejeicaoRequest


def _erro(mensagem, codigo=404):
    raise HTTPException(status_code=codigo, detail=mensagem)


def _imovel_do_proprietario(db, imovel_id, usuario):
    imovel = db.get(Imovel, imovel_id)
    if imovel is None or imovel.proprietario_id != usuario.id:
        _erro("Imóvel não encontrado.")
    return imovel


def _ultima_solicitacao(db, imovel_id):
    return db.scalars(select(SolicitacaoImovel).where(SolicitacaoImovel.imovel_id == imovel_id).order_by(SolicitacaoImovel.id.desc())).first()


def _pode_editar(db, imovel_id, usuario):
    imovel = _imovel_do_proprietario(db, imovel_id, usuario)
    ultima = _ultima_solicitacao(db, imovel_id)
    if ultima and ultima.status == StatusSolicitacao.EM_ANALISE:
        _erro("Não é possível alterar um imóvel enquanto a solicitação está em análise.", 409)
    if ultima and ultima.status == StatusSolicitacao.APROVADO:
        _erro("Uma solicitação aprovada não pode ser alterada por este fluxo.", 409)
    if not imovel.ativo:
        _erro("O imóvel está inativo.", 400)
    return imovel


def criar_draft(db: Session, dados: ImovelProprietarioCadastro, usuario: Usuario):
    imovel = Imovel(proprietario_id=usuario.id, **dados.model_dump(exclude={"proprietario_id"}))
    imovel.finalidade = dados.finalidade.value
    imovel.situacao_comercial = SituacaoComercial.RASCUNHO
    imovel.publicado = False
    imovel.ativo = True
    db.add(imovel); db.commit(); db.refresh(imovel)
    return imovel


def atualizar_draft(db, imovel_id, dados: ImovelProprietarioAtualizacao, usuario):
    imovel = _pode_editar(db, imovel_id, usuario)
    for campo, valor in dados.model_dump(exclude_unset=True, exclude={"proprietario_id"}).items():
        setattr(imovel, campo, valor.value if hasattr(valor, "value") else valor)
    imovel.publicado = False
    imovel.situacao_comercial = SituacaoComercial.RASCUNHO
    db.commit(); db.refresh(imovel)
    return imovel


def listar_meus_imoveis(db, usuario):
    return list(db.scalars(select(Imovel).where(Imovel.proprietario_id == usuario.id).order_by(Imovel.id.desc())).all())


async def adicionar_documento(db, imovel_id, arquivo: UploadFile, usuario):
    imovel = _pode_editar(db, imovel_id, usuario)
    if arquivo.content_type not in TIPOS_DOCUMENTO_PERMITIDOS:
        _erro("Formato não permitido. Utilize PDF, JPG ou PNG.", 422)
    conteudo = await arquivo.read(TAMANHO_MAXIMO_DOCUMENTO + 1)
    if not conteudo:
        _erro("O documento está vazio.", 422)
    if len(conteudo) > TAMANHO_MAXIMO_DOCUMENTO:
        _erro("O documento deve ter no máximo 10 MB.", 413)
    extensao = TIPOS_DOCUMENTO_PERMITIDOS[arquivo.content_type]
    nome = f"{uuid4().hex}{extensao}"
    diretorio = DOCUMENTOS_DIR / str(usuario.id) / str(imovel_id)
    diretorio.mkdir(parents=True, exist_ok=True)
    caminho = diretorio / nome
    try:
        caminho.write_bytes(conteudo)
        documento = DocumentoImovel(imovel_id=imovel_id, nome_original=(arquivo.filename or "documento")[:255], nome_arquivo=nome, caminho_arquivo=str(caminho), tipo_mime=arquivo.content_type, tamanho_bytes=len(conteudo))
        db.add(documento); db.commit(); db.refresh(documento)
        return documento
    except Exception:
        db.rollback(); caminho.unlink(missing_ok=True); raise


def _carregar_solicitacao(db, solicitacao_id):
    solicitacao = db.scalar(select(SolicitacaoImovel).options(selectinload(SolicitacaoImovel.imovel), selectinload(SolicitacaoImovel.documentos)).where(SolicitacaoImovel.id == solicitacao_id))
    if solicitacao is None: _erro("Solicitação não encontrada.")
    return solicitacao


def listar_solicitacoes(db, usuario=None):
    consulta = select(SolicitacaoImovel).options(selectinload(SolicitacaoImovel.imovel), selectinload(SolicitacaoImovel.documentos)).order_by(SolicitacaoImovel.id.desc())
    if usuario: consulta = consulta.where(SolicitacaoImovel.proprietario_id == usuario.id)
    return list(db.scalars(consulta).all())


def submeter(db, imovel_id, usuario):
    imovel = _pode_editar(db, imovel_id, usuario)
    documentos = list(db.scalars(select(DocumentoImovel).where(DocumentoImovel.imovel_id == imovel_id, DocumentoImovel.solicitacao_id.is_(None))).all())
    if not documentos: _erro("Envie ao menos um comprovante de propriedade antes de submeter.", 422)
    solicitacao = SolicitacaoImovel(imovel_id=imovel_id, proprietario_id=usuario.id, status=StatusSolicitacao.EM_ANALISE)
    db.add(solicitacao); db.flush()
    for documento in documentos: documento.solicitacao_id = solicitacao.id
    admins = db.scalars(select(Usuario).where(Usuario.perfil == PerfilUsuario.CORRETOR_ADMIN, Usuario.ativo.is_(True))).all()
    for admin in admins: db.add(Notificacao(usuario_id=admin.id, solicitacao_id=solicitacao.id, tipo="NOVA_SOLICITACAO", titulo="Nova solicitação de imóvel", mensagem=f"O imóvel #{imovel_id} aguarda análise.") )
    db.commit(); return _carregar_solicitacao(db, solicitacao.id)


def revisar(db, solicitacao_id, admin, aprovar, justificativa=None):
    solicitacao = db.scalar(select(SolicitacaoImovel).options(selectinload(SolicitacaoImovel.imovel), selectinload(SolicitacaoImovel.documentos)).where(SolicitacaoImovel.id == solicitacao_id).with_for_update())
    if solicitacao is None: _erro("Solicitação não encontrada.")
    if solicitacao.status != StatusSolicitacao.EM_ANALISE: _erro("Esta solicitação já foi revisada.", 409)
    if not aprovar and not (justificativa or "").strip(): _erro("A justificativa da rejeição é obrigatória.", 422)
    solicitacao.status = StatusSolicitacao.APROVADO if aprovar else StatusSolicitacao.REJEITADO
    solicitacao.revisada_em = datetime.now(timezone.utc); solicitacao.revisado_por_id = admin.id; solicitacao.propriedade_verificada = aprovar
    if not aprovar: solicitacao.justificativa_rejeicao = justificativa.strip()
    imovel = solicitacao.imovel
    if aprovar:
        imovel.ativo = True; imovel.publicado = True; imovel.situacao_comercial = SituacaoComercial.DISPONIVEL
        mensagem = f"A solicitação do imóvel #{imovel.id} foi aprovada."
    else:
        imovel.publicado = False; imovel.situacao_comercial = SituacaoComercial.RASCUNHO
        mensagem = f"A solicitação do imóvel #{imovel.id} foi rejeitada: {solicitacao.justificativa_rejeicao}"
    db.add(Notificacao(usuario_id=solicitacao.proprietario_id, solicitacao_id=solicitacao.id, tipo="DECISAO_SOLICITACAO", titulo="Atualização da solicitação", mensagem=mensagem))
    db.commit(); return _carregar_solicitacao(db, solicitacao.id)


def verificar_documento(db, solicitacao_id, documento_id, usuario):
    solicitacao = _carregar_solicitacao(db, solicitacao_id)
    if usuario.perfil != PerfilUsuario.CORRETOR_ADMIN and solicitacao.proprietario_id != usuario.id: _erro("Documento não encontrado.")
    documento = db.scalar(select(DocumentoImovel).where(DocumentoImovel.id == documento_id, DocumentoImovel.solicitacao_id == solicitacao_id))
    if documento is None: _erro("Documento não encontrado.")
    caminho = Path(documento.caminho_arquivo).resolve(); raiz = DOCUMENTOS_DIR.resolve()
    if not caminho.is_relative_to(raiz) or not caminho.is_file(): _erro("Arquivo não encontrado.", 404)
    return documento, caminho
