from sqlalchemy.orm import Session
from . import models, schemas, security
import random

# =========================================================
# PARTE DE USUÁRIOS
# =========================================================

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

# =========================================================
# PARTE DE ANÚNCIOS
# =========================================================

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

def get_projeto(db: Session, projeto_id: int):
    return db.query(models.Projeto).filter(models.Projeto.id == projeto_id).first()

# =========================================================
# O MOTOR DE ESCROW (DEPÓSITO E LIBERAÇÃO)
# =========================================================

def depositar_pagamento(db: Session, projeto_id: int, cliente_id: int):
    projeto = db.query(models.Projeto).filter(models.Projeto.id == projeto_id).first()
    if projeto:
        projeto.status = models.StatusProjeto.PAGAMENTO_RETIDO
        projeto.cliente_id = cliente_id 
        # Gera o código que aparecerá apenas para o CLIENTE
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

# =========================================================
# FILTROS DE VISUALIZAÇÃO (O QUE RESOLVE SEU PROBLEMA)
# =========================================================

def get_compras_do_usuario(db: Session, usuario_id: int):
    """Retorna tudo que o usuário COMPROU (onde ele é cliente)"""
    return db.query(models.Projeto).filter(models.Projeto.cliente_id == usuario_id).all()

def get_vendas_do_usuario(db: Session, usuario_id: int):
    """Retorna tudo que o usuário ANUNCIOU (onde ele é vendedor)"""
    return db.query(models.Projeto).filter(models.Projeto.vendedor_id == usuario_id).all()

def contar_vendas_vendedor(db: Session, vendedor_id: int):
    return db.query(models.Projeto).filter(
        models.Projeto.vendedor_id == vendedor_id,
        models.Projeto.status == models.StatusProjeto.FINALIZADO
    ).count()