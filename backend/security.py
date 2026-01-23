import bcrypt
from jose import jwt
from datetime import datetime, timedelta, timezone
from backend.config import settings

def gerar_senha_hash(senha: str) -> str:
    senha_bytes = senha.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(senha_bytes, salt).decode('utf-8')

def verificar_senha(senha_pura: str, senha_hash: str) -> bool:
    try:
        return bcrypt.checkpw(senha_pura.encode('utf-8'), senha_hash.encode('utf-8'))
    except Exception:
        return False

def criar_token_acesso(dados: dict) -> str:
    dados_token = dados.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    dados_token.update({"exp": expire})
    return jwt.encode(dados_token, settings.SECRET_KEY, algorithm=settings.ALGORITHM)