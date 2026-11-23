from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.dependencias import obter_usuario_atual
from app.database import get_db
from app.models.notificacao import Notificacao
from app.models.usuario import Usuario
from app.schemas.solicitacao import NotificacaoResposta

router = APIRouter(prefix="/notificacoes", tags=["Notificações"])

@router.get("", response_model=list[NotificacaoResposta])
def listar(db: Session = Depends(get_db), usuario: Usuario = Depends(obter_usuario_atual)):
    return list(db.scalars(select(Notificacao).where(Notificacao.usuario_id == usuario.id).order_by(Notificacao.id.desc())).all())

@router.patch("/{notificacao_id}/ler", response_model=NotificacaoResposta)
def ler(notificacao_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(obter_usuario_atual)):
    item = db.scalar(select(Notificacao).where(Notificacao.id == notificacao_id, Notificacao.usuario_id == usuario.id))
    if item is None: raise HTTPException(404, "Notificação não encontrada.")
    item.lida = True; db.commit(); db.refresh(item); return item
