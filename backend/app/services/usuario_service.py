
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.seguranca import gerar_hash_senha
from app.models.usuario import Usuario, PerfilUsuario
from app.schemas.usuario import UsuarioCadastro


def cadastrar_usuario(
    db: Session,
    dados: UsuarioCadastro
) -> Usuario:

    # Verifica se o e-mail ja esta cadastrado
    usuario_email = db.scalar(
        select(Usuario).where(
            Usuario.email == str(dados.email).lower()
        )
    )

    if usuario_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="E-mail já cadastrado."
        )

    # Verifica se o CPF ja esta cadastrado
    usuario_cpf = db.scalar(
        select(Usuario).where(
            Usuario.cpf == dados.cpf
        )
    )

    if usuario_cpf:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="CPF já cadastrado."
        )

    # Gera o hash da senha
    senha_hash = gerar_hash_senha(dados.senha)

    # Cria o usuario
    novo_usuario = Usuario(
        nome=dados.nome,
        email=str(dados.email).lower(),
        cpf=dados.cpf,
        senha_hash=senha_hash,
        perfil=PerfilUsuario(dados.perfil.value),
        ativo=True
    )

    db.add(novo_usuario)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="E-mail ou CPF já cadastrado."
        )

    db.refresh(novo_usuario)

    return novo_usuario
