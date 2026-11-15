
import os

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from collections.abc import Callable

from app.models.usuario import PerfilUsuario

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"

if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY não configurada.")

security = HTTPBearer()


def obter_usuario_atual(
    credenciais: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Usuario:

    erro_credenciais = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado.",
        headers={"WWW-Authenticate": "Bearer"}
    )

    try:
        payload = jwt.decode(
            credenciais.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"require": ["sub", "exp", "iat"]}
        )

        usuario_id = int(payload["sub"])

    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise erro_credenciais

    usuario = db.get(Usuario, usuario_id)

    if usuario is None:
        raise erro_credenciais

    if not usuario.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo."
        )

    return usuario


def exigir_perfis(
    *perfis_permitidos: PerfilUsuario
) -> Callable:

    def verificar_perfil(
        usuario_atual: Usuario = Depends(obter_usuario_atual)
    ) -> Usuario:

        if usuario_atual.perfil not in perfis_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para acessar este recurso."
            )

        return usuario_atual

    return verificar_perfil
