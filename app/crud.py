from sqlalchemy.orm import Session
from . import models, schemas

# ---------------------------------------------------------
# BLOCO 1: CRIAÇÃO
# ---------------------------------------------------------

def create_projeto(db: Session, projeto: schemas.ProjetoCreate):
    """Cria um novo projeto no banco de dados"""
    db_projeto = models.Projeto(
        titulo=projeto.titulo,
        valor=projeto.valor,
        cliente_id=projeto.cliente_id
    )
    db.add(db_projeto)
    db.commit()
    db.refresh(db_projeto)
    return db_projeto

# ---------------------------------------------------------
# BLOCO 2: LEITURA (CONSULTAS)
# ---------------------------------------------------------

def get_projetos(db: Session, skip: int = 0, limit: int = 100):
    """Retorna a lista de todos os projetos com paginação"""
    return db.query(models.Projeto).offset(skip).limit(limit).all()

def get_projeto(db: Session, projeto_id: int):
    """Busca um projeto específico pelo ID"""
    return db.query(models.Projeto).filter(models.Projeto.id == projeto_id).first()

# ---------------------------------------------------------
# BLOCO 3: ATUALIZAÇÃO E DELEÇÃO
# ---------------------------------------------------------

def update_projeto(db: Session, projeto_id: int, projeto_update: schemas.ProjetoCreate):
    """Atualiza os dados de um projeto existente"""
    db_projeto = db.query(models.Projeto).filter(models.Projeto.id == projeto_id).first()
    if db_projeto:
        # Atualiza os campos dinamicamente com base no schema
        for key, value in projeto_update.dict().items():
            setattr(db_projeto, key, value)
        db.commit()
        db.refresh(db_projeto)
        return db_projeto
    return None

def delete_projeto(db: Session, projeto_id: int):
    """Remove um projeto do banco de dados"""
    db_projeto = db.query(models.Projeto).filter(models.Projeto.id == projeto_id).first()
    if db_projeto:
        db.delete(db_projeto)
        db.commit()
        return db_projeto
    return None

# ---------------------------------------------------------
# BLOCO 4: OPERAÇÕES ESPECÍFICAS
# ---------------------------------------------------------

def depositar_pagamento(db: Session, projeto_id: int):
    """Gerencia a lógica de retenção de pagamento (Escrow)"""
    projeto = db.query(models.Projeto).filter(models.Projeto.id == projeto_id).first()
    if projeto and projeto.status == models.StatusProjeto.ABERTO:
        projeto.valor_no_escrow = projeto.valor
        projeto.status = models.StatusProjeto.PAGAMENTO_RETIDO
        db.commit()
        db.refresh(projeto)
        return projeto
    return None