from sqlalchemy.orm import Session
from . import models, schemas, security
import random

# =========================================================
# PARTE DE USUÁRIOS: Controle de Acesso e Cadastro
# =========================================================

def get_usuario_by_email(db: Session, email: str):
    # Uso essa função pra saber se o e-mail já tá no banco (na hora de logar ou criar conta)
    return db.query(models.Usuario).filter(models.Usuario.email == email).first()

def get_usuario_by_id(db: Session, usuario_id: int):
    # Pra buscar o perfil do cara pelo ID único dele
    return db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()

def create_usuario(db: Session, usuario: schemas.UsuarioCreate):
    # Aqui eu transformo a senha em hash por segurança e gravo o novo usuário no sistema
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
# PARTE DE ANÚNCIOS: A Vitrine do Ryzer
# =========================================================

def create_projeto(db: Session, projeto: schemas.ProjetoCreate):
    # Crio o anúncio novo, taco o status 'ABERTO' e deixo o produto digital pronto pra entrega
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
    # Listagem geral da vitrine, com limite pra não pesar o banco
    return db.query(models.Projeto).offset(skip).limit(limit).all()

def get_projeto(db: Session, projeto_id: int):
    # Busca um anúncio específico pelo ID dele
    return db.query(models.Projeto).filter(models.Projeto.id == projeto_id).first()

def get_projetos_vendedor(db: Session, vendedor_id: int):
    # Lista tudo que um vendedor específico colocou à venda
    return db.query(models.Projeto).filter(models.Projeto.vendedor_id == vendedor_id).all()

def delete_projeto(db: Session, projeto_id: int):
    # Se precisar apagar um anúncio, essa função resolve o problema
    db_projeto = get_projeto(db, projeto_id)
    if db_projeto:
        db.delete(db_projeto)
        db.commit()
        return True
    return False


# =========================================================
# O MOTOR DE ESCROW: Onde a grana fica segura
# =========================================================



def depositar_pagamento(db: Session, projeto_id: int, cliente_id: int):
    # O cliente pagou? Travo o status como 'PAGAMENTO_RETIDO' e gero o código 
    # de 6 dígitos que o vendedor vai precisar pra receber o dinheiro depois
    projeto = db.query(models.Projeto).filter(models.Projeto.id == projeto_id).first()
    if projeto:
        projeto.status = models.StatusProjeto.PAGAMENTO_RETIDO
        projeto.cliente_id = cliente_id 
        
        # Esse código aqui é a garantia de que o serviço foi entregue
        projeto.codigo_verificacao = str(random.randint(100000, 999999))
        
        db.commit()
        db.refresh(projeto)
        return projeto
    return None

def validar_entrega_e_liberar(db: Session, projeto_id: int, codigo: str):
    # Se o código que o vendedor digitou bater com o que eu guardei,
    # finalizo a venda e o status vira 'FINALIZADO'
    projeto = db.query(models.Projeto).filter(models.Projeto.id == projeto_id).first()
    
    if projeto and projeto.codigo_verificacao == codigo:
        projeto.status = models.StatusProjeto.FINALIZADO
        db.commit()
        db.refresh(projeto)
        return projeto
    return None


# =========================================================
# PAINÉIS E RELATÓRIOS: "Meus Itens"
# =========================================================

def get_compras_cliente(db: Session, cliente_id: int):
    # Mostra pro cliente só o que ele já pagou e foi liberado pelo código
    return db.query(models.Projeto).filter(
        models.Projeto.cliente_id == cliente_id,
        models.Projeto.status == models.StatusProjeto.FINALIZADO
    ).all()

def get_projetos_por_cliente(db: Session, cliente_id: int):
    # Aqui eu pego todos os itens vinculados ao cliente, até os que estão aguardando código
    return db.query(models.Projeto).filter(models.Projeto.cliente_id == cliente_id).all()

def contar_vendas_vendedor(db: Session, vendedor_id: int):
    # Contador rápido de quantas vendas o vendedor já fechou com sucesso
    return db.query(models.Projeto).filter(
        models.Projeto.vendedor_id == vendedor_id,
        models.Projeto.status == models.StatusProjeto.FINALIZADO
    ).count()