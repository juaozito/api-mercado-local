import os
import models, crud, schemas, database, security
from database import engine, Base, get_db
from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pathlib import Path
from typing import List, Optional

# Importações internas do projeto
from .database import engine, Base, get_db

# =========================================================
# CONFIGURAÇÃO DE CAMINHOS (DINÂMICO PARA O RENDER)
# =========================================================

# Localiza a raiz do projeto (api-mercado-local)
# O main.py está em backend/app/main.py, por isso subimos 3 níveis
BASE_DIR = Path(__file__).resolve().parent.parent.parent
FRONTEND_PATH = BASE_DIR / "frontend"

# Cria as tabelas no banco de dados
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mercado Local Escrow", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# VÍNCULO COM O FRONTEND
# =========================================================

# Tentativa de montar as pastas. Se falhar, o health ainda funciona.
try:
    app.mount("/css", StaticFiles(directory=str(FRONTEND_PATH / "css")), name="css")
    app.mount("/js", StaticFiles(directory=str(FRONTEND_PATH / "js")), name="js")
    templates = Jinja2Templates(directory=str(FRONTEND_PATH / "html"))
    print("✅ Frontend montado com sucesso!")
except Exception as e:
    templates = None
    print(f"❌ Erro ao montar frontend: {e}")

# =========================================================
# ROTAS DE PÁGINAS (FRONTEND)
# =========================================================

@app.get("/", response_class=HTMLResponse, tags=["Páginas"])
async def home(request: Request):
    if templates:
        return templates.TemplateResponse("index.html", {"request": request})
    return HTMLResponse(content="<h1>Erro: Pasta frontend não encontrada no servidor.</h1>", status_code=500)

@app.get("/cadastro", response_class=HTMLResponse, tags=["Páginas"])
async def pagina_cadastro(request: Request):
    return templates.TemplateResponse("cadastro.html", {"request": request})

@app.get("/dashboard", response_class=HTMLResponse, tags=["Páginas"])
async def pagina_dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})

# =========================================================
# GESTÃO DE USUÁRIOS (API)
# =========================================================

@app.post("/usuarios/", response_model=schemas.Usuario, tags=["Usuários"])
def cadastrar_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    usuario_existente = crud.get_usuario_by_email(db, email=usuario.email)
    if usuario_existente:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
    return crud.create_usuario(db=db, usuario=usuario)

@app.post("/login/", tags=["Usuários"])
def login(dados: schemas.UsuarioLogin, db: Session = Depends(get_db)):
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
# GESTÃO DE PROJETOS (API)
# =========================================================

@app.post("/projetos/", response_model=schemas.Projeto, tags=["Projetos"])
def criar_anuncio(projeto: schemas.ProjetoCreate, db: Session = Depends(get_db)):
    return crud.create_projeto(db=db, projeto=projeto)

@app.get("/projetos/", response_model=List[schemas.Projeto], tags=["Projetos"])
def listar_anuncios(db: Session = Depends(get_db)):
    return crud.get_projetos(db)

# =========================================================
# OPERAÇÃO DE COMPRA E ESCROW (API)
# =========================================================

@app.post("/projetos/{projeto_id}/pagar/", tags=["Escrow / Vendas"])
def pagar_projeto(projeto_id: int, cliente_id: Optional[int] = 1, db: Session = Depends(get_db)):
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
    projeto = crud.validar_entrega_e_liberar(db, projeto_id, dados.codigo)
    if not projeto:
        raise HTTPException(status_code=400, detail="Código inválido ou projeto já finalizado.")
    return {"status": "sucesso", "mensagem": "Conteúdo liberado e venda finalizada!"}

# =========================================================
# PAINEL DO VENDEDOR E SAÚDE
# =========================================================

@app.get("/vendedor/{vendedor_id}/total-vendas", tags=["Painel do Vendedor"])
def ver_total_vendas(vendedor_id: int, db: Session = Depends(get_db)):
    total = crud.contar_vendas_vendedor(db, vendedor_id=vendedor_id)
    return {"vendedor_id": vendedor_id, "total_vendas": total}

@app.get("/health", tags=["Healthcheck"])
def healthcheck():
    return {"status": "Online", "sistema": "Mercado Local Escrow"}