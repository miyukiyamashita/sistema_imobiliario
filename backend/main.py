
from fastapi import FastAPI, HTTPException

from database import testar_conexao

app = FastAPI(
    title="API Futura Imóveis",
    description="Sistema de Gestão e Controle Imobiliário",
    version="1.0.0"
)


@app.get("/")
def inicio():
    return {
        "mensagem": "API Futura Imóveis funcionando!"
    }


@app.get("/health/database")
def verificar_banco():
    try:
        banco = testar_conexao()

        return {
            "status": "conectado",
            "banco": banco
        }

    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Não foi possível conectar ao banco de dados."
        )
