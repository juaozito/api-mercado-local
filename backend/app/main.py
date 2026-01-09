from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

# Importações internas do seu projeto
from . import models, crud, schemas, database, security
from .database import engine, Base, get_db

# --- BLOCO: INICIALIZAÇÃO ---
# Cria as tabelas no banco de dados automaticamente se elas não existirem
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Mercado Local Escrow",
    description="API para intermediação de vendas digitais com retenção de pagamento."
)

# --- BLOCO: CONFIGURAÇÃO DE SEGURANÇA (CORS) ---
# Essencial para que o seu HTML/JS consiga conversar com esta API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite qualquer origem (em produção, deve ser restrito)
    allow_credentials=True,
    allow_methods=["*"],  # Permite GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Executa ações assim que o servidor liga."""
    print("\n" + "="*40)
    print("PROJETO MERCADO LOCAL ESCROW ATIVO")
    print("="*40 + "\n")

@app.get("/")
def read_root():
    """Rota de teste para verificar se a API está online."""
    return {"status": "Online", "projeto": "Mercado Local Escrow"}


# --- BLOCO 1: GESTÃO DE PROJETOS (ANÚNCIOS) ---

@app.post("/projetos/", response_model=schemas.Projeto)
def criar_projeto(projeto: schemas.ProjetoCreate, db: Session = Depends(get_db)):
    """Rota para um vendedor anunciar um novo serviço/produto."""
    return crud.create_projeto(db=db, projeto=projeto)

@app.get("/projetos/", response_model=List[schemas.Projeto])
def listar_projetos(vendedor_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Lista todos os projetos do mercado. 
    Se 'vendedor_id' for passado, filtra apenas os anúncios daquele vendedor.
    """
    if vendedor_id:
        return crud.get_projetos_vendedor(db, vendedor_id=vendedor_id)
    return crud.get_projetos(db, skip=skip, limit=limit)

@app.get("/projetos/{projeto_id}", response_model=None)
def ler_projeto(projeto_id: int, db: Session = Depends(get_db)):
    """
    Busca detalhes de um projeto. 
    Atenção: O conteúdo digital só é revelado se o status for 'FINALIZADO'.
    """
    projeto = crud.get_projeto(db, projeto_id=projeto_id)
    if projeto is None:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    
    # Se o projeto já foi pago e liberado, retorna tudo
    if projeto.status == models.StatusProjeto.FINALIZADO:
        return projeto 
    
    # Caso contrário, esconde o conteúdo digital por segurança
    return {
        "id": projeto.id,
        "titulo": projeto.titulo,
        "valor": projeto.valor,
        "status": projeto.status,
        "cliente_id": projeto.cliente_id,
        "vendedor_id": projeto.vendedor_id,
        "valor_no_escrow": projeto.valor_no_escrow,
        "mensagem": "🔒 Conteúdo digital oculto. Valide o código para liberar."
    }


# --- BLOCO 2: OPERAÇÕES FINANCEIRAS (ESCROW) ---

@app.get("/vendedor/{vendedor_id}/total-vendas")
def ver_total_vendas(vendedor_id: int, db: Session = Depends(get_db)):
    """Retorna o contador de quantas vendas o vendedor já completou."""
    total = crud.contar_vendas_vendedor(db, vendedor_id)
    return {"vendedor_id": vendedor_id, "total_vendas_concluidas": total}

@app.get("/cliente/{cliente_id}/meus-cursos")
def listar_meus_cursos(cliente_id: int, db: Session = Depends(get_db)):
    """Lista todos os produtos que o cliente comprou e já liberou."""
    compras = crud.get_compras_cliente(db, cliente_id)
    return compras


# --- BLOCO 3: GESTÃO DE USUÁRIOS E ACESSO ---

@app.post("/usuarios/", response_model=schemas.Usuario)
def cadastrar_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    """Rota para cadastro de novos clientes ou vendedores."""
    db_usuario = crud.get_usuario_by_email(db, email=usuario.email)
    if db_usuario:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")
    return crud.create_usuario(db=db, usuario=usuario)

@app.post("/login/")
def login(dados: schemas.UsuarioLogin, db: Session = Depends(get_db)):
    """
    Rota de autenticação. 
    Verifica e-mail e compara o hash da senha de forma segura.
    """
    usuario = crud.get_usuario_by_email(db, email=dados.email)
    
    # Verifica se o usuário existe e se a senha digitada bate com o hash no banco
    if not usuario or not security.verificar_senha(dados.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos"
        )
    
    # Retorna dados básicos para o Frontend salvar no localStorage
    return {
        "status": "logado", 
        "usuario_id": usuario.id, 
        "nome": usuario.nome
    }

# --- ROTA PARA SIMULAR O DEPÓSITO NO ESCROW ---

@app.post("/projetos/{projeto_id}/pagar")
def pagar_projeto(projeto_id: int, db: Session = Depends(get_db)):
    projeto = crud.depositar_pagamento(db, projeto_id)
    if not projeto:
        raise HTTPException(status_code=400, detail="Erro ao processar pagamento")
    return {"status": "pagamento_retido", "codigo_verificacao": projeto.codigo_verificacao}

@app.post("/projetos/{projeto_id}/liberar")
def liberar_projeto(projeto_id: int, dados: schemas.ValidarCodigo, db: Session = Depends(get_db)):
    projeto = crud.validar_entrega_e_liberar(db, projeto_id, dados.codigo)
    if not projeto:
        raise HTTPException(status_code=400, detail="Código incorreto ou projeto inválido")
    return {"status": "finalizado", "mensagem": "Conteúdo liberado com sucesso!"}