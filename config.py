import os

class Settings:
    PROJECT_NAME: str = "Mercado Local"
    PROJECT_VERSION: str = "1.0.0"
    DATABASE_URL: str = "sqlite:///./mercado.db"

    # --- NOVAS CONFIGURAÇÕES DE SEGURANÇA ---
    SECRET_KEY: str = "sua_chave_secreta_muito_longa_e_aleatoria_aqui"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # Token vale por 24 horas

settings = Settings()