from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# Pego a URL lá das minhas configurações.
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Crio o motor do banco. Esse 'check_same_thread' falso é pro SQLite 
# não reclamar quando tiver muita gente acessando ao mesmo tempo.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Aqui eu preparo a "fábrica" de conexões. Toda rota vai pedir uma dessas.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Essa Base é de onde todos os meus modelos (Usuario, Projeto) vão "nascer".
Base = declarative_base()

# Função básica pra abrir a conexão e fechar logo depois que usar. Limpeza é tudo!
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()