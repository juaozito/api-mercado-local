from sqlalchemy.orm import Session
from . import models, schemas, security
import random

# =========================================================
# BLOCO 1: GESTÃO DE USUÁRIOS
# =========================================================

def get_usuario_by_email(db: Session, email: str):
    """Busca um usuário pelo e-mail para verificar login ou duplicidade."""
    return db.query(models.Usuario).filter(models.Usuario.email == email).first()

def create_usuario(db: Session, usuario: schemas.UsuarioCreate):
    """Cria um novo usuário com senha criptografada."""
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
# BLOCO 2: CRIAÇÃO E CONSULTA DE PROJETOS (ANÚNCIOS)
# =========================================================

def create_projeto(db: Session, projeto: schemas.ProjetoCreate):
    """Transforma os dados do formulário de anúncio em um registro no banco."""
    db_projeto = models.Projeto(
        titulo=projeto.titulo,
        valor=projeto.valor,
        vendedor_id=projeto.vendedor_id,
        conteudo_digital=projeto.conteudo_digital,
        cliente_id=None,  # Começa sem comprador
        status=models.StatusProjeto.ABERTO  # Status inicial: Aberto
    )
    db.add(db_projeto)
    db.commit()
    db.refresh(db_projeto)
    return db_projeto

def get_projetos(db: Session, skip: int = 0, limit: int = 100):
    """Lista todos os projetos disponíveis no mercado."""
    return db.query(models.Projeto).offset(skip).limit(limit).all()

def get_projeto(db: Session, projeto_id: int):
    """Busca um projeto específico pelo seu ID único."""
    return db.query(models.Projeto).filter(models.Projeto.id == projeto_id).first()

def get_projetos_vendedor(db: Session, vendedor_id: int):
    """Busca todos os anúncios criados por um vendedor específico."""
    return db.query(models.Projeto).filter(models.Projeto.vendedor_id == vendedor_id).all()

def get_compras_cliente(db: Session, cliente_id: int):
    """Busca todos os projetos que um cliente comprou e já foram finalizados."""
    return db.query(models.Projeto).filter(
        models.Projeto.cliente_id == cliente_id,
        models.Projeto.status == models.StatusProjeto.FINALIZADO
    ).all()


# =========================================================
# BLOCO 3: LÓGICA DE ESCROW (PAGAMENTO E SEGURANÇA)
# =========================================================

def depositar_pagamento(db: Session, projeto_id: int):
    """
    Simula o pagamento do cliente. 
    O dinheiro fica 'preso' no sistema e um código de 6 dígitos é gerado.
    """
    projeto = get_projeto(db, projeto_id)
    if projeto and projeto.status == models.StatusProjeto.ABERTO:
        # Gera um código aleatório de 6 dígitos (ex: 123456)
        codigo_novo = str(random.randint(100000, 999999))
        
        projeto.status = models.StatusProjeto.PAGAMENTO_RETIDO
        projeto.valor_no_escrow = projeto.valor
        projeto.codigo_verificacao = codigo_novo
        
        db.commit()
        db.refresh(projeto)
        
        # Log para o desenvolvedor ver o código no terminal
        print(f"--- ESCROW ATIVO: Projeto {projeto.id} | Código: {codigo_novo} ---")
        return projeto
    return None

def validar_entrega_e_liberar(db: Session, projeto_id: int, codigo_inserido: str):
    """
    Compara o código digitado pelo comprador.
    Se estiver correto, o status muda para FINALIZADO e o conteúdo é liberado.
    """
    projeto = get_projeto(db, projeto_id)
    
    if projeto and projeto.codigo_verificacao == codigo_inserido:
        projeto.status = models.StatusProjeto.FINALIZADO
        db.commit()
        db.refresh(projeto)
        return projeto  # Retorna o projeto agora com conteúdo visível
    return None


# =========================================================
# BLOCO 4: ESTATÍSTICAS E DELEÇÃO
# =========================================================

def contar_vendas_vendedor(db: Session, vendedor_id: int):
    """Conta quantas vendas o vendedor completou com sucesso."""
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