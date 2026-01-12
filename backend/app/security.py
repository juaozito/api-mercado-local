import bcrypt
from jose import jwt
from datetime import datetime, timedelta
from .config import settings

# =========================================================
# BLOCO 1: SEGURANÇA DE SENHAS (BCRYPT)
# =========================================================

def gerar_senha_hash(senha: str) -> str:
    """
    Transforma uma senha de texto puro em um hash seguro.
    O hash inclui um 'salt' aleatório para evitar ataques de força bruta.
    """
    senha_bytes = senha.encode('utf-8')
    salt = bcrypt.gensalt()
    hash_bytes = bcrypt.hashpw(senha_bytes, salt)
    return hash_bytes.decode('utf-8')

def verificar_senha(senha_pura: str, senha_hash: str) -> bool:
    """
    Compara a senha digitada pelo usuário com o hash salvo no banco.
    Retorna True se for compatível, False caso contrário.
    """
    try:
        return bcrypt.checkpw(
            senha_pura.encode('utf-8'), 
            senha_hash.encode('utf-8')
        )
    except Exception:
        # Se o hash estiver malformado ou houver erro, nega o acesso
        return False

# =========================================================
# BLOCO 2: AUTENTICAÇÃO VIA JWT (JSON WEB TOKEN)
# =========================================================

def criar_token_acesso(dados: dict) -> str:
    """
    Gera um token JWT para manter o usuário logado.
    O token contém o ID do usuário e uma data de expiração.
    """
    dados_token = dados.copy()
    
    # Define por quanto tempo o token será válido (configurado no config.py)
    tempo_expiracao = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Adiciona a claim 'exp' (expiration) ao corpo do token
    dados_token.update({"exp": tempo_expiracao})
    
    # Assina o token com a sua SECRET_KEY
    token_jwt = jwt.encode(
        dados_token, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    
    return token_jwt