import os
from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pathlib import Path
from typing import List, Optional

from . import crud, database, models, schemas

# IMPORTAÇÕES DIRETAS (Ajustadas para ficheiros dentro da pasta backend)
from . import security
from .database import engine, Base, get_db

# Aqui eu defino onde o projeto está rodando pra não me perder nos caminhos das pastas
BASE_DIR = Path(__file__).resolve().parent

# Comando sagrado: se o banco de dados não existir, ele cria as tabelas agora mesmo
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mercado Local Escrow")

# Libero o CORS pra que o meu frontend consiga conversar com essa API sem ser bloqueado
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuro onde ficam os arquivos de estilo (CSS) e as páginas HTML (Templates)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# =========================================================
# ROTAS DE PÁGINAS: O que o usuário vê no navegador
# =========================================================



@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    # Página inicial do nosso mercado
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/login", response_class=HTMLResponse)
async def pagina_login(request: Request):
    # Direciono pro login (usando o mesmo index que tem o switch de abas)
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/cadastro", response_class=HTMLResponse)
async def pagina_cadastro(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/dashboard", response_class=HTMLResponse)
async def pagina_dashboard(request: Request):
    # O painel de controle do usuário
    return templates.TemplateResponse("dashboard.html", {"request": request})

@app.get("/loja", response_class=HTMLResponse)
async def pagina_loja(request: Request):
    # Vitrine com os produtos disponíveis
    return templates.TemplateResponse("loja.html", {"request": request})

@app.get("/anunciar", response_class=HTMLResponse)
async def pagina_anunciar(request: Request):
    # Onde o vendedor cria a oferta dele
    return templates.TemplateResponse("anunciar.html", {"request": request})

@app.get("/meus-cursos", response_class=HTMLResponse)
async def pagina_meus_cursos(request: Request):
    # Área logada para ver o que o usuário já comprou
    return templates.TemplateResponse("meus_cursos.html", {"request": request})

# =========================================================
# ROTAS DE API: Onde a mágica acontece por baixo dos panos
# =========================================================

@app.post("/login/", tags=["Usuários"])
def login(dados: schemas.UsuarioLogin, db: Session = Depends(get_db)):
    # Valido se o e-mail existe e se a senha bate com o hash que guardamos
    usuario = crud.get_usuario_by_email(db, email=dados.email)
    if not usuario or not security.verificar_senha(dados.senha, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")
    
    # Se der tudo certo, gero o token JWT pro cara ficar logado
    token = security.criar_token_acesso(dados={"sub": str(usuario.id)})
    return {
        "access_token": token, 
        "token_type": "bearer",
        "usuario_id": usuario.id, 
        "nome": usuario.nome
    }

@app.post("/projetos/", response_model=schemas.Projeto, tags=["Projetos"])
def criar_anuncio(projeto: schemas.ProjetoCreate, db: Session = Depends(get_db)):
    # Rota pra postar um produto novo no marketplace
    return crud.create_projeto(db=db, projeto=projeto)

@app.get("/projetos/", response_model=List[schemas.Projeto], tags=["Projetos"])
def listar_anuncios(db: Session = Depends(get_db)):
    # Pega todos os anúncios pra mostrar na loja
    return crud.get_projetos(db)

@app.post("/projetos/{projeto_id}/pagar/", tags=["Escrow / Vendas"])
def pagar_projeto(projeto_id: int, cliente_id: Optional[int] = 1, db: Session = Depends(get_db)):
    # Inicia o Escrow. Trava o dinheiro e gera o código de 6 dígitos.
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
    # O comprador deu o código pro vendedor? Se bater, eu libero a venda aqui.
    projeto = crud.validar_entrega_e_liberar(db, projeto_id, dados.codigo)
    if not projeto:
        raise HTTPException(status_code=400, detail="Código inválido ou projeto já finalizado.")
    return {"status": "sucesso", "mensagem": "Conteúdo liberado e venda finalizada!"}

@app.get("/vendedor/{vendedor_id}/total-vendas", tags=["Painel do Vendedor"])
def ver_total_vendas(vendedor_id: int, db: Session = Depends(get_db)):
    # estatística rápida de quantas vendas o cara já fez
    total = crud.contar_vendas_vendedor(db, vendedor_id=vendedor_id)
    return {"vendedor_id": vendedor_id, "total_vendas": total}

@app.get("/usuarios/{usuario_id}/pedidos", response_model=List[schemas.Projeto], tags=["Usuários"])
def listar_meus_pedidos(usuario_id: int, db: Session = Depends(get_db)):
    # Puxo todos os itens que o usuário comprou (seja retido ou finalizado)
    pedidos = crud.get_projetos_por_cliente(db, cliente_id=usuario_id)
    return pedidos

@app.get("/health", tags=["Healthcheck"])
def healthcheck():
    # Só pra conferir se o servidor tá de pé
    return {"status": "Online", "sistema": "Mercado Local Escrow"}

@app.post("/usuarios/", response_model=schemas.Usuario, tags=["Usuários"])
def cadastrar_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    # Cria um novo usuário, mas antes checa se o e-mail já não tá sendo usado
    db_usuario = crud.get_usuario_by_email(db, email=usuario.email)
    if db_usuario:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
    return crud.create_usuario(db=db, usuario=usuario)