
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.routers.usuarios import router as usuarios_router
from app.routers.auth import router as auth_router
from app.database import testar_conexao

app = FastAPI(
    title="API Futura Imóveis",
    description="Sistema de Gestão e Controle Imobiliário",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


app.include_router(usuarios_router)
app.include_router(auth_router)

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
