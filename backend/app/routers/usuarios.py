
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.usuario import (
    UsuarioCadastro,
    UsuarioResposta
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



