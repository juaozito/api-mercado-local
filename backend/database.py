from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings
# No topo do database.py
from backend.config import settings

# Pego a URL lá das minhas configurações.
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL


# Se a URL começar com postgresql, não usamos o check_same_thread (que é só do SQLite)
if "sqlite" in settings.DATABASE_URL:
    engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(settings.DATABASE_URL)


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