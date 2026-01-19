import bcrypt
from jose import jwt
from datetime import datetime, timedelta
from .config import settings

# =========================================================
# BLOCO 1: PROTEÇÃO DE SENHAS (BCRYPT)
# =========================================================

def gerar_senha_hash(senha: str) -> str:
    # Eu nunca gravo a senha real do usuário no banco. 
    # Transformo ela nesse "hash" com um 'salt' (um tempero aleatório)
    # pra que, mesmo se alguém roubar o banco, não consiga ler a senha original.
    senha_bytes = senha.encode('utf-8')
    salt = bcrypt.gensalt()
    hash_bytes = bcrypt.hashpw(senha_bytes, salt)
    return hash_bytes.decode('utf-8')

def verificar_senha(senha_pura: str, senha_hash: str) -> bool:
    # Quando o cara tenta logar, eu pego a senha que ele digitou e comparo
    # com o hash que guardamos. Se bater, o acesso tá liberado!
    try:
        return bcrypt.checkpw(
            senha_pura.encode('utf-8'), 
            senha_hash.encode('utf-8')
        )
    except Exception:
        # Se der qualquer erro no hash, eu barro o acesso por segurança
        return False

# =========================================================
# BLOCO 2: O CRACHÁ DIGITAL (JWT)
# =========================================================



def criar_token_acesso(dados: dict) -> str:
    # O cara logou? Eu dou um "crachá" (Token) pra ele.
    # Esse crachá diz quem ele é e até que horas vale o acesso.
    dados_token = dados.copy()
    
    # Puxo lá do meu 'config.py' quanto tempo o cara pode ficar logado (24h)
    tempo_expiracao = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Coloco a validade dentro do crachá (claim 'exp')
    dados_token.update({"exp": tempo_expiracao})
    
    # Eu assino esse crachá com a nossa SECRET_KEY. 
    # Assim, só o nosso servidor consegue validar se esse crachá é verdadeiro.
    token_jwt = jwt.encode(
        dados_token, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    
    return token_jwt