
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.seguranca import verificar_senha
from app.core.jwt import criar_token_acesso
from app.models.usuario import Usuario


def autenticar_usuario(
    db: Session,
    email: str,
    senha: str
) -> str:

    usuario = db.scalar(
        select(Usuario).where(
            Usuario.email == email.strip().lower()
        )
    )

    # Mensagem genérica para não revelar
    # se o e-mail está cadastrado.
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not verificar_senha(senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not usuario.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo."
        )

    return criar_token_acesso(usuario.id)
