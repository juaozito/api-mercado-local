from sqlalchemy.orm import Session
from . import models, schemas
import random

# ---------------------------------------------------------
# BLOCO 1: CRIAÇÃO
# ---------------------------------------------------------

def create_projeto(db: Session, projeto: schemas.ProjetoCreate):
    """Cria um novo projeto no banco de dados"""
    db_projeto = models.Projeto(
        titulo=projeto.titulo,
        valor=projeto.valor,
        cliente_id=projeto.cliente_id,
        vendedor_id=projeto.vendedor_id, #adicionado conforme o novo models
        conteudo_digital=projeto.conteudo_digital # O "produto" travado
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
    
    if projeto:
        # Gerar código novo (estamos garantindo 6 dígitos com zfill)
        codigo_novo = str(random.randint(0, 999999)).zfill(6)

        projeto.valor_no_escrow = projeto.valor
        projeto.codigo_verificacao = codigo_novo
        projeto.status = models.StatusProjeto.PAGAMENTO_RETIDO

        db.commit()
        db.refresh(projeto)
        
        # ESSA LINHA É FUNDAMENTAL: Ela vai berrar o código no seu terminal
        print(f"\n Use este código no Thunder Client: {codigo_novo} \n")
        
        return projeto
    return Nonejeto
    return None

def validar_entrega_e_liberar(db: Session, projeto_id: int, codigo_inserido: str):
    """
    O 'Gatilho': Compara o código inserido pelo comprador.
    Se correto, libera o conteúdo digital e finaliza o Escrow.
    """
    projeto = db.query(models.Projeto).filter(models.Projeto.id == projeto_id).first()

    if not projeto or projeto.status != models.StatusProjeto.PAGAMENTO_RETIDO:
        return {"error": "Projeto não está em fase de liberação."}
    
    # CONFERÊNCIA DO CÓDIGO
    if projeto.codigo_verificacao == codigo_inserido:
        # Sucessor: Libera o dinheiro e finaliza
        projeto.status = models.StatusProjeto.FINALIZADO
        # Aqui o valor_no_escrow é liberado logicamente para o vendedor
        db.commit()
        db.refresh(projeto)
        return projeto
    
    return None # Código incorreto

def contar_vendas_vendedor(db: Session, vendedor_id: int):
    #Conta apenas os projetos com status FINALIZADO (venda concluída)
    return db.query(models.Projeto).filter(
        models.Projeto.vendedor_id == vendedor_id,
        models.Projeto.status == models.StatusProjeto.FINALIZADO
    ).count()

# Corrija de 'get_compras_cciente' para:
def get_compras_cliente(db: Session, cliente_id: int):
    return db.query(models.Projeto).filter(
        models.Projeto.cliente_id == cliente_id,
        models.Projeto.status == models.StatusProjeto.FINALIZADO
    ).all()

