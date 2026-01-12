from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

# Importações internas do projeto
from . import models, crud, schemas, database, security
from .database import engine, Base, get_db

# =========================================================
# CONFIGURAÇÃO INICIAL E BANCO DE DATOS
# =========================================================

# Cria as tabelas no banco de dados caso não existam
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Mercado Local Escrow API",
    description="API para intermediação de vendas digitais com sistema de garantia (Escrow).",
    version="1.0.0"
)

# Configuração de CORS - Permite que o Frontend acesse a API sem bloqueios
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Healthcheck"])
def home():
    """Verifica se o servidor está online."""
    return {"status": "Online", "sistema": "Mercado Local Escrow"}

# =========================================================
# GESTÃO DE USUÁRIOS (AUTENTICAÇÃO)
# =========================================================

@app.post("/usuarios/", response_model=schemas.Usuario, tags=["Usuários"])
def cadastrar_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    """Cadastra um novo usuário no sistema."""
    usuario_existente = crud.get_usuario_by_email(db, email=usuario.email)
    if usuario_existente:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
    return crud.create_usuario(db=db, usuario=usuario)

@app.post("/login/", tags=["Usuários"])
def login(dados: schemas.UsuarioLogin, db: Session = Depends(get_db)):
    """Autentica o usuário e gera o token de acesso."""
    usuario = crud.get_usuario_by_email(db, email=dados.email)
    if not usuario or not security.verificar_senha(dados.senha, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")
    
    token = security.criar_token_acesso(dados={"sub": str(usuario.id)})
    return {
        "access_token": token, 
        "token_type": "bearer",
        "usuario_id": usuario.id, 
        "nome": usuario.nome
    }

# =========================================================
# GESTÃO DE PROJETOS (ANÚNCIOS)
# =========================================================

@app.post("/projetos/", response_model=schemas.Projeto, tags=["Projetos"])
def criar_anuncio(projeto: schemas.ProjetoCreate, db: Session = Depends(get_db)):
    """Cria um novo anúncio de produto digital."""
    return crud.create_projeto(db=db, projeto=projeto)

@app.get("/projetos/", response_model=List[schemas.Projeto], tags=["Projetos"])
def listar_anuncios(db: Session = Depends(get_db)):
    """Lista todos os anúncios disponíveis no mercado."""
    return crud.get_projetos(db)

# =========================================================
# OPERAÇÃO DE COMPRA E ESCROW (GARANTIA)
# =========================================================

@app.post("/projetos/{projeto_id}/pagar/", tags=["Escrow / Vendas"])
def pagar_projeto(projeto_id: int, cliente_id: Optional[int] = 1, db: Session = Depends(get_db)):
    """
    Simula o pagamento. O dinheiro fica retido no sistema (Escrow) 
    e um código de 6 dígitos é gerado para o comprador.
    """
    projeto = crud.depositar_pagamento(db, projeto_id=projeto_id, cliente_id=cliente_id)
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado.")
    
    return {
        "status": "pagamento_retido", 
        "codigo_verificacao": projeto.codigo_verificacao,
        "mensagem": f"PAGAMENTO RETIDO: Use o código {projeto.codigo_verificacao} para liberar."
    }

@app.post("/projetos/{projeto_id}/liberar/", tags=["Escrow / Vendas"])
def liberar_conteudo(projeto_id: int, dados: schemas.ValidarCodigo, db: Session = Depends(get_db)):
    """
    Com o código de 6 dígitos, o comprador finaliza a venda,
    o vendedor recebe o saldo e o conteúdo é liberado.
    """
    projeto = crud.validar_entrega_e_liberar(db, projeto_id, dados.codigo)
    if not projeto:
        raise HTTPException(status_code=400, detail="Código inválido ou projeto já finalizado.")
    return {"status": "sucesso", "mensagem": "Conteúdo liberado e venda finalizada!"}

# =========================================================
# PAINEL DO CLIENTE E VENDEDOR (ESTATÍSTICAS)
# =========================================================

@app.get("/cliente/{cliente_id}/meus-cursos", tags=["Painel do Cliente"])
def minha_biblioteca(cliente_id: int, db: Session = Depends(get_db)):
    """Busca todos os cursos adquiridos e finalizados pelo cliente."""
    cursos = crud.get_compras_cliente(db, cliente_id=cliente_id)
    return cursos if cursos else []

@app.get("/vendedor/{vendedor_id}/total-vendas", tags=["Painel do Vendedor"])
def ver_total_vendas(vendedor_id: int, db: Session = Depends(get_db)):
    """Conta quantas vendas o vendedor já completou com sucesso."""
    total = crud.contar_vendas_vendedor(db, vendedor_id=vendedor_id)
    return {"vendedor_id": vendedor_id, "total_vendas": total}

@app.get("/vendedor/{vendedor_id}/total-ganho", tags=["Painel do Vendedor"])
def ver_total_ganho(vendedor_id: int, db: Session = Depends(get_db)):
    """Calcula o lucro total (soma dos valores) de vendas finalizadas."""
    projetos = crud.get_projetos_vendedor(db, vendedor_id=vendedor_id)
    ganho_total = sum(p.valor for p in projetos if p.status == models.StatusProjeto.FINALIZADO)
    return {"vendedor_id": vendedor_id, "total_ganho": ganho_total}