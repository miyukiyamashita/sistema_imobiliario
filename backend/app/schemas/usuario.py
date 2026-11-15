
import re
from enum import Enum

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)


class PerfilCadastro(str, Enum):
    CLIENTE = "CLIENTE"
    PROPRIETARIO = "PROPRIETARIO"


class UsuarioCadastro(BaseModel):
    nome: str = Field(min_length=3, max_length=150)
    email: EmailStr
    cpf: str
    senha: str = Field(min_length=8, max_length=128)
    perfil: PerfilCadastro

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, valor: str) -> str:
        valor = " ".join(valor.split())

        if len(valor) < 3:
            raise ValueError("Nome deve ter pelo menos 3 caracteres.")

        return valor

    @field_validator("cpf")
    @classmethod
    def validar_cpf(cls, valor: str) -> str:
        cpf = re.sub(r"\D", "", valor)

        if len(cpf) != 11:
            raise ValueError("CPF deve conter 11 dígitos.")

        if len(set(cpf)) == 1:
            raise ValueError("CPF inválido.")

        for tamanho in (9, 10):
            soma = sum(
                int(cpf[i]) * (tamanho + 1 - i)
                for i in range(tamanho)
            )

            digito = (soma * 10) % 11

            if digito == 10:
                digito = 0

            if digito != int(cpf[tamanho]):
                raise ValueError("CPF inválido.")

        return cpf


class UsuarioResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    email: EmailStr
    cpf: str
    perfil: str
    ativo: bool
