from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, crud, schemas
from .database import engine, Base, get_db

# Inicialização do Banco de Dados: Cria as tabelas se não existirem
Base.metadata.create_all(bind=engine)

app = FastAPI()

# ---------------------------------------------------------
# BLOCO 1: CRIAÇÃO (POST)
# ---------------------------------------------------------

@app.post("/projetos/", response_model=schemas.Projeto)
def criar_projeto(projeto: schemas.ProjetoCreate, db: Session = Depends(get_db)):
    """Cria um novo projeto no sistema"""
    return crud.create_projeto(db=db, projeto=projeto)


# ---------------------------------------------------------
# BLOCO 2: LEITURA (GET)
# ---------------------------------------------------------

@app.get("/projetos/", response_model=list[schemas.Projeto])
def listar_projetos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Retorna uma lista de todos os projetos cadastrados"""
    projetos = crud.get_projetos(db, skip=skip, limit=limit)
    return projetos

@app.get("/projetos/{projeto_id}", response_model=schemas.Projeto)
def ler_projeto(projeto_id: int, db: Session = Depends(get_db)):
    """Busca um projeto específico pelo seu ID único"""
    projeto = crud.get_projeto(db, projeto_id=projeto_id)
    if projeto is None:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return projeto


# ---------------------------------------------------------
# BLOCO 3: ATUALIZAÇÃO (PUT)
# ---------------------------------------------------------

@app.put("/projetos/{projeto_id}", response_model=schemas.Projeto)
def atualizar_projeto(projeto_id: int, projeto_data: schemas.ProjetoCreate, db: Session = Depends(get_db)):
    """Atualiza as informações de um projeto existente"""
    projeto_atualizado = crud.update_projeto(db, projeto_id=projeto_id, projeto_update=projeto_data)
    if projeto_atualizado is None:
        raise HTTPException(status_code=404, detail="Projeto não encontrado para atualizar")
    return projeto_atualizado


# ---------------------------------------------------------
# BLOCO 4: DELEÇÃO (DELETE)
# ---------------------------------------------------------

@app.delete("/projetos/{projeto_id}")
def deletar_projeto(projeto_id: int, db: Session = Depends(get_db)):
    """Remove definitivamente um projeto do banco de dados"""
    sucesso = crud.delete_projeto(db, projeto_id=projeto_id)
    if not sucesso:
        raise HTTPException(status_code=404, detail="Projeto não encontrado para deletar")
    return {"status": "sucesso", "mensagem": f"Projeto {projeto_id} removido"}


# ---------------------------------------------------------
# BLOCO 5: OPERAÇÕES FINANCEIRAS (AÇÕES ESPECÍFICAS)
# ---------------------------------------------------------

@app.post("/projetos/{projeto_id}/pagar", response_model=schemas.Projeto)
def pagar_projeto(projeto_id: int, db: Session = Depends(get_db)):
    """Registra o pagamento/depósito em um projeto específico"""
    projeto = crud.depositar_pagamento(db, projeto_id)
    if not projeto:
        raise HTTPException(status_code=400, detail="Projeto não encontrado")
    return projeto