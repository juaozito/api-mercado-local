import os

class Settings:
    # Nome e versão pra aparecer na documentação automática (Swagger)
    PROJECT_NAME: str = "Mercado Local"
    PROJECT_VERSION: str = "1.0.0"
    
    # Onde meu banco de dados vai morar. To usando SQLite por enquanto que é mais prático.
    DATABASE_URL: str = "sqlite:///./mercado.db"

    # --- SEGURANÇA ---
    # Essa chave aqui é o segredo do cofre. Não dá pra vacilar com ela!
    SECRET_KEY: str = "sua_chave_secreta_muito_longa_e_aleatoria_aqui"
    
    # Algoritmo padrão pra gerar os Tokens de acesso dos usuários.
    ALGORITHM: str = "HS256"
    
    # Pro cara não ter que ficar logando toda hora, deixei o token valendo por 24 horas.
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 

settings = Settings()