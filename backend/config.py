import os

class Settings:
    PROJECT_NAME: str = "Mercado Local"
    PROJECT_VERSION: str = "1.0.0"
    
    # Conexão alterada para base de dados local (SQLite)
    DATABASE_URL: str = "sqlite:///./ryzer.db"

    SECRET_KEY: str = "sua_chave_secreta_muito_longa_e_aleatoria_aqui"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 

settings = Settings()
