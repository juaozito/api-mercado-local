import os
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pathlib import Path

# --- LÓGICA DE LOCALIZAÇÃO AUTOMÁTICA ---
# 1. Pega o caminho de onde o main.py está (backend/app)
current_file_path = Path(__file__).resolve()

# 2. Sobe até a raiz do projeto (api-mercado-local)
# .parent é 'app', .parent.parent é 'backend', .parent.parent.parent é a raiz
BASE_DIR = current_file_path.parent.parent.parent

# 3. Define o caminho exato da pasta frontend
FRONTEND_PATH = BASE_DIR / "frontend"

app = FastAPI()

# --- VÍNCULO COM O FRONTEND ---
# Monta as pastas de arquivos estáticos usando o caminho absoluto descoberto
app.mount("/css", StaticFiles(directory=str(FRONTEND_PATH / "css")), name="css")
app.mount("/js", StaticFiles(directory=str(FRONTEND_PATH / "js")), name="js")

# Configura o motor de templates para a pasta html
templates = Jinja2Templates(directory=str(FRONTEND_PATH / "html"))

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    # O FastAPI agora sabe exatamente onde procurar o index.html
    return templates.TemplateResponse("index.html", {"request": request})

# Re-adicione suas rotas de @app.post("/usuarios/"), etc.

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

@app.post("/projetos/", response_model=schemas.Projeto, tags=["Projetos"])
def criar_anuncio(projeto: schemas.ProjetoCreate, db: Session = Depends(get_db)):
    return crud.create_projeto(db=db, projeto=projeto)

@app.get("/projetos/", response_model=List[schemas.Projeto], tags=["Projetos"])
def listar_anuncios(db: Session = Depends(get_db)):
    return crud.get_projetos(db)

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

@app.get("/vendedor/{vendedor_id}/total-vendas", tags=["Painel do Vendedor"])
def ver_total_vendas(vendedor_id: int, db: Session = Depends(get_db)):
    total = crud.contar_vendas_vendedor(db, vendedor_id=vendedor_id)
    return {"vendedor_id": vendedor_id, "total_vendas": total}

@app.get("/health", tags=["Healthcheck"])
def healthcheck():
    return {"status": "Online"}