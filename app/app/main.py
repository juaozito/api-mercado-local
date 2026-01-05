from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, crud, schemas
from .database import engine, Base, get_db

# Cria as tabelas toda vez que o servidor inicia
Base.metadata.create_all(bind=engine)

app = FastAPI()

# ROTA DE CRIAÇÃO (Para resolver o erro 404)
@app.post("/projetos/", response_model=schemas.Projeto)
def criar_projeto(projeto: schemas.ProjetoCreate, db: Session = Depends(get_db)):
    return crud.create_projeto(db=db, projeto=projeto)

@app.get("/projetos/{projeto_id}", response_model=schemas.Projeto)
def ler_projeto(projeto_id: int, db: Session = Depends(get_db)):
    projeto = crud.get_projeto(db, projeto_id=projeto_id)
    if projeto is None:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return projeto

@app.get("/projetos/", response_model=list[schemas.Projeto])
def listar_projetos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    projetos = crud.get_projetos(db, skip=skip, limit=limit)
    return projetos

# ROTA DE PAGAMENTO (Para resolver o erro 400)
@app.post("/projetos/{projeto_id}/pagar", response_model=schemas.Projeto)
def pagar_projeto(projeto_id: int, db: Session = Depends(get_db)):
    projeto = crud.depositar_pagamento(db, projeto_id)
    if not projeto:
        # Se o projeto não existe no banco, ele cai aqui
        raise HTTPException(status_code=400, detail="Projeto não encontrado")
    return projeto