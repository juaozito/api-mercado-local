from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, crud, schemas
from .database import engine, Base, get_db

# Inicialização do Banco de Dados
Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- BLOCO 1: CRIAÇÃO ---

@app.post("/projetos/", response_model=schemas.Projeto)
def criar_projeto(projeto: schemas.ProjetoCreate, db: Session = Depends(get_db)):
    return crud.create_projeto(db=db, projeto=projeto)


# --- BLOCO 2: LEITURA ---

@app.get("/projetos/", response_model=list[schemas.Projeto])
def listar_projetos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_projetos(db, skip=skip, limit=limit)

@app.get("/projetos/{projeto_id}", response_model=None)
def ler_projeto(projeto_id: int, db: Session = Depends(get_db)):
    """Busca um projeto e aplica a trava de visibilidade"""
    projeto = crud.get_projeto(db, projeto_id=projeto_id)
    if projeto is None:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    
    # Se estiver FINALIZADO, usa o schema completo
    if projeto.status == models.StatusProjeto.FINALIZADO:
        return projeto 
    
    # Se não, retorna um dicionário sem o conteúdo digital (Segurança)
    return {
        "id": projeto.id,
        "titulo": projeto.titulo,
        "valor": projeto.valor,
        "status": projeto.status,
        "cliente_id": projeto.cliente_id,
        "vendedor_id": projeto.vendedor_id,
        "valor_no_escrow": projeto.valor_no_escrow,
        "mensagem": "🔒 Conteúdo digital oculto. Valide o código de 6 dígitos para liberar."
    }


# --- BLOCO 3: ATUALIZAÇÃO ---

@app.put("/projetos/{projeto_id}", response_model=schemas.Projeto)
def atualizar_projeto(projeto_id: int, projeto_data: schemas.ProjetoCreate, db: Session = Depends(get_db)):
    projeto_atualizado = crud.update_projeto(db, projeto_id=projeto_id, projeto_update=projeto_data)
    if projeto_atualizado is None:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return projeto_atualizado


# --- BLOCO 4: DELEÇÃO ---

@app.delete("/projetos/{projeto_id}")
def deletar_projeto(projeto_id: int, db: Session = Depends(get_db)):
    sucesso = crud.delete_projeto(db, projeto_id=projeto_id)
    if not sucesso:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return {"status": "sucesso", "mensagem": f"Projeto {projeto_id} removido"}


# --- BLOCO 5: OPERAÇÕES FINANCEIRAS ---

@app.post("/projetos/{projeto_id}/pagar", response_model=schemas.Projeto)
def pagar_projeto(projeto_id: int, db: Session = Depends(get_db)):
    projeto = crud.depositar_pagamento(db, projeto_id)
    if not projeto:
        raise HTTPException(status_code=400, detail="Erro ao processar pagamento")
    return projeto

@app.post("/projetos/{projeto_id}/validar-entrega", response_model=schemas.ProjetoLiberado)
def validar_codigo_entrega(projeto_id: int, dados: schemas.ValidarCodigo, db: Session = Depends(get_db)):
    """Valida o código e libera o conteúdo digital"""
    projeto = crud.validar_entrega_e_liberar(db, projeto_id=projeto_id, codigo_inserido=dados.codigo)

    if projeto is None:
        raise HTTPException(status_code=400, detail="Código incorreto ou projeto inválido.")

    return projeto