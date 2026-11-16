
import getpass
import re

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.database import SessionLocal
from app.models.usuario import Usuario, PerfilUsuario
from app.core.seguranca import gerar_hash_senha
from app.schemas.usuario import UsuarioCadastro


def criar_admin():
    print("\n=== Cadastro de Corretor/Administrador ===")

    nome = input("Nome completo: ").strip()
    email = input("E-mail: ").strip().lower()
    cpf = input("CPF: ").strip()
    senha = getpass.getpass("Senha: ")

    try:
        # Reutiliza as validações do cadastro público,
        # sem permitir escolher o perfil interno.
        dados = UsuarioCadastro(
            nome=nome,
            email=email,
            cpf=cpf,
            senha=senha,
            perfil="CLIENTE"
        )
    except Exception as erro:
        print(f"Dados inválidos: {erro}")
        return

    with SessionLocal() as db:
        existente = db.scalar(
            select(Usuario).where(
                (Usuario.email == str(dados.email).lower())
                | (Usuario.cpf == dados.cpf)
            )
        )

        if existente:
            print("Erro: e-mail ou CPF já cadastrado.")
            return

        usuario = Usuario(
            nome=dados.nome,
            email=str(dados.email).lower(),
            cpf=dados.cpf,
            senha_hash=gerar_hash_senha(senha),
            perfil=PerfilUsuario.CORRETOR_ADMIN,
            ativo=True
        )

        db.add(usuario)

        try:
            db.commit()
            db.refresh(usuario)
        except IntegrityError:
            db.rollback()
            print("Erro: e-mail ou CPF já cadastrado.")
            return

        print("\nUsuário interno criado com sucesso!")
        print(f"ID: {usuario.id}")
        print(f"Nome: {usuario.nome}")
        print(f"Perfil: {usuario.perfil.value}")


if __name__ == "__main__":
    criar_admin()
