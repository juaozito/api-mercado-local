from sqlalchemy.orm import Session
from . import models, schemas, security
import random

# =========================================================
# BLOCO 1: GESTÃO DE USUÁRIOS
# =========================================================

def get_usuario_by_email(db: Session, email: str):
    """Busca um usuário pelo e-mail (usado no login e validação)."""
    return db.query(models.Usuario).filter(models.Usuario.email == email).first()

def get_usuario_by_id(db: Session, usuario_id: int):
    """Busca um usuário pelo ID único."""
    return db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()

def create_usuario(db: Session, usuario: schemas.UsuarioCreate):
    """Cria um novo usuário criptografando a senha antes de salvar."""
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
# BLOCO 2: GESTÃO DE ANÚNCIOS (PROJETOS)
# =========================================================

def create_projeto(db: Session, projeto: schemas.ProjetoCreate):
    """Cria um novo anúncio de conteúdo digital."""
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
    """Lista todos os anúncios ativos no marketplace."""
    return db.query(models.Projeto).offset(skip).limit(limit).all()

def get_projeto(db: Session, projeto_id: int):
    """Busca os detalhes de um projeto específico."""
    return db.query(models.Projeto).filter(models.Projeto.id == projeto_id).first()

def get_projetos_vendedor(db: Session, vendedor_id: int):
    """Lista todos os anúncios criados por um vendedor específico."""
    return db.query(models.Projeto).filter(models.Projeto.vendedor_id == vendedor_id).all()


# =========================================================
# BLOCO 3: SISTEMA DE ESCROW (FLUXO DE VENDA)
# =========================================================

def depositar_pagamento(db: Session, projeto_id: int, cliente_id: int):
    """
    Inicia o processo de Escrow:
    1. Vincula o comprador ao projeto.
    2. Altera status para 'pagamento_retido'.
    3. Gera o código de 6 dígitos que o vendedor deve fornecer ao comprador.
    """
    projeto = db.query(models.Projeto).filter(models.Projeto.id == projeto_id).first()
    if projeto:
        projeto.status = models.StatusProjeto.PAGAMENTO_RETIDO
        projeto.cliente_id = cliente_id 
        
        # Gera o código de segurança para a liberação futura
        projeto.codigo_verificacao = str(random.randint(100000, 999999))
        
        db.commit()
        db.refresh(projeto)
        return projeto
    return None

def validar_entrega_e_liberar(db: Session, projeto_id: int, codigo: str):
    """
    Finaliza a transação:
    Conferindo o código, o status vira 'finalizado' e o conteúdo é liberado.
    """
    projeto = db.query(models.Projeto).filter(models.Projeto.id == projeto_id).first()
    
    if projeto and projeto.codigo_verificacao == codigo:
        projeto.status = models.StatusProjeto.FINALIZADO
        db.commit()
        db.refresh(projeto)
        return projeto
    return None


# =========================================================
# BLOCO 4: PAINEL DO CLIENTE E ESTATÍSTICAS
# =========================================================

def get_compras_cliente(db: Session, cliente_id: int):
    """Busca apenas os cursos que o cliente já pagou e liberou (FINALIZADOS)."""
    return db.query(models.Projeto).filter(
        models.Projeto.cliente_id == cliente_id,
        models.Projeto.status == models.StatusProjeto.FINALIZADO
    ).all()

def contar_vendas_vendedor(db: Session, vendedor_id: int):
    """Retorna o total de vendas concluídas para o painel do vendedor."""
    return db.query(models.Projeto).filter(
        models.Projeto.vendedor_id == vendedor_id,
        models.Projeto.status == models.StatusProjeto.FINALIZADO
    ).count()

def delete_projeto(db: Session, projeto_id: int):
    """Remove um anúncio do sistema."""
    db_projeto = get_projeto(db, projeto_id)
    if db_projeto:
        db.delete(db_projeto)
        db.commit()
        return True
    return False