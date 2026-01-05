from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
# IMPORTANTE: Importamos as configurações que você criou
from .config import settings

# 1. DEFINIÇÃO DO BANCO (SQLITE)
# Em vez de escrever o texto aqui, usamos o que está no settings.
# Isso evita que você tenha que mudar o nome do arquivo em dois lugares diferentes.
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# 2. O MOTOR (ENGINE)
# O Engine é o "tradutor". Ele recebe os comandos do SQLAlchemy e escreve no SQLite.
# connect_args={"check_same_thread": False} é essencial para o SQLite não travar
# quando receber várias requisições simultâneas no seu app de mercado.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 3. FÁBRICA DE SESSÕES (SESSIONLOCAL)
# Cada vez que um cliente acessar seu mercado, uma nova "sessão" (conversa) 
# é aberta com o banco de dados através desta fábrica.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. A BASE (MAPEAMENTO)
# Todas as classes do seu 'models.py' (Produto, Usuario, etc) devem herdar desta Base.
# É ela quem faz a "ponte" entre a classe Python e a tabela do SQLite.
Base = declarative_base()

# 5. FUNÇÃO DE APOIO (GERENCIADOR DE CONEXÃO)
# Esta é uma "Dependência". Ela garante um ciclo de vida seguro:
# Abre a conexão -> Entrega para a rota (main.py) -> Fecha a conexão ao terminar.
def get_db():
    db = SessionLocal() # Abre a conversa com o banco
    try:
        yield db # Entrega a conversa para quem pediu
    finally:
        db.close() # Fecha a porta para economizar memória e evitar erros no .db