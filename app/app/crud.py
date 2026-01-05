from sqlalchemy.orm import Session
from . import models, schemas

def create_projeto(db: Session, projeto: schemas.ProjetoCreate): # <--- Aqui deve ser ProjetoCreate
    db_projeto = models.Projeto(
        titulo=projeto.titulo,
        valor=projeto.valor,
        cliente_id=projeto.cliente_id
    )
    db.add(db_projeto)
    db.commit()
    db.refresh(db_projeto)
    return db_projeto

def get_projetos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Projeto).offset(skip).limit(limit).all()

def depositar_pagamento(db: Session, projeto_id: int):
    projeto = db.query(models.Projeto).filter(models.Projeto.id == projeto_id).first()
    if projeto and projeto.status == models.StatusProjeto.ABERTO:
        projeto.valor_no_escrow = projeto.valor
        projeto.status = models.StatusProjeto.PAGAMENTO_RETIDO
        db.commit()
        db.refresh(projeto)
        return projeto
    return None