from sqlalchemy.orm import Session
import random
from backend import models, schemas, security

# USUÁRIOS
def get_usuario_by_email(db: Session, email: str):
    return db.query(models.Usuario).filter(models.Usuario.email == email).first()

def get_usuario_by_id(db: Session, usuario_id: int):
    return db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()

def create_usuario(db: Session, usuario: schemas.UsuarioCreate):
    senha_protegida = security.gerar_senha_hash(usuario.senha)
    db_usuario = models.Usuario(
        nome=usuario.nome,
        email=usuario.email,
        senha_hash=senha_protegida
    )
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

# PROJETOS / ANÚNCIOS
def create_projeto(db: Session, projeto: schemas.ProjetoCreate):
    db_projeto = models.Projeto(
        titulo=projeto.titulo,
        valor=projeto.valor,
        vendedor_id=projeto.vendedor_id,
        conteudo_digital=projeto.conteudo_digital,
        cliente_id=None,
        status=models.StatusProjeto.ABERTO
    )
    db.add(db_projeto)
    db.commit()
    db.refresh(db_projeto)
    return db_projeto

def get_projetos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Projeto).offset(skip).limit(limit).all()

# ESCROW
def depositar_pagamento(db: Session, projeto_id: int, cliente_id: int):
    projeto = db.query(models.Projeto).filter(models.Projeto.id == projeto_id).first()
    if projeto:
        projeto.status = models.StatusProjeto.PAGAMENTO_RETIDO
        projeto.cliente_id = cliente_id 
        projeto.codigo_verificacao = str(random.randint(100000, 999999))
        db.commit()
        db.refresh(projeto)
        return projeto
    return None

def validar_entrega_e_liberar(db: Session, projeto_id: int, codigo: str):
    projeto = db.query(models.Projeto).filter(models.Projeto.id == projeto_id).first()
    if projeto and projeto.codigo_verificacao == codigo:
        projeto.status = models.StatusProjeto.FINALIZADO
        db.commit()
        db.refresh(projeto)
        return projeto
    return None

# FILTROS (Nomes corrigidos para o main.py)
def get_projetos_por_cliente(db: Session, cliente_id: int):
    return db.query(models.Projeto).filter(models.Projeto.cliente_id == cliente_id).all()

def contar_vendas_vendedor(db: Session, vendedor_id: int):
    return db.query(models.Projeto).filter(
        models.Projeto.vendedor_id == vendedor_id,
        models.Projeto.status == models.StatusProjeto.FINALIZADO
    ).count()