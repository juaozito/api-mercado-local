import os

class Settings:
    # Nome e versão pra aparecer na documentação automática (Swagger)
    PROJECT_NAME: str = "Mercado Local"
    PROJECT_VERSION: str = "1.0.0"
    
    # CORREÇÃO: Adicionado ?sslmode=require para conexão segura com o Render
    DATABASE_URL: str = "postgresql://ryzer_user:uJgQqFVdgzqKRP3ByC3exdTOOOqyh7jj@dpg-d5no6rchg0os73djm7fg-a.oregon-postgres.render.com/ryzer?sslmode=require"

    # --- SEGURANÇA ---
    SECRET_KEY: str = "sua_chave_secreta_muito_longa_e_aleatoria_aqui"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 

settings = Settings()