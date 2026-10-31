import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import get_db
from backend import crud

# Esquema de autenticação para as rotas e Swagger
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

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

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        usuario_id: str = payload.get("sub")
        if usuario_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    usuario = crud.get_usuario_by_id(db, usuario_id=int(usuario_id))
    if usuario is None:
        raise credentials_exception
    return usuario
