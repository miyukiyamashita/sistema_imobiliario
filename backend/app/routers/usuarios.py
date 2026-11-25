
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.usuario import (
    UsuarioCadastro,
    UsuarioResposta,
    UsuarioProprietarioOpcao,
)
from app.services.usuario_service import cadastrar_usuario
from app.core.dependencias import obter_usuario_atual
from app.models.usuario import Usuario
from app.core.dependencias import exigir_perfis
from app.models.usuario import PerfilUsuario

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuários"]
)


@router.post(
    "/cadastro",
    response_model=UsuarioResposta,
    status_code=status.HTTP_201_CREATED
)
def cadastrar(
    dados: UsuarioCadastro,
    db: Session = Depends(get_db)
):
    return cadastrar_usuario(db, dados)


@router.get(
    "/me",
    response_model=UsuarioResposta
)
def consultar_meu_perfil(
    usuario_atual: Usuario = Depends(obter_usuario_atual)
):
    return usuario_atual


@router.get(
    "/proprietarios",
    response_model=list[UsuarioProprietarioOpcao],
)
def listar_proprietarios(
    busca: str | None = Query(default=None, max_length=100),
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_perfis(PerfilUsuario.CORRETOR_ADMIN)),
):
    consulta = (
        select(Usuario)
        .where(Usuario.perfil == PerfilUsuario.PROPRIETARIO, Usuario.ativo.is_(True))
        .order_by(Usuario.nome)
        .limit(50)
    )
    if busca:
        termo = f"%{busca.strip()}%"
        consulta = consulta.where((Usuario.nome.ilike(termo)) | (Usuario.email.ilike(termo)))
    return list(db.scalars(consulta).all())



