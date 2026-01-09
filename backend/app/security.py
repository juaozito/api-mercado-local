import bcrypt

# =========================================================
# BLOCO 1: PROTEÇÃO DE DADOS (HASHING)
# =========================================================

def gerar_senha_hash(senha: str) -> str:
    """
    Transforma uma senha comum (ex: '123456') em um hash 
    irreversível para armazenamento seguro no banco de dados.
    """
    
    # 1. Converte a string da senha para bytes (necessário para o bcrypt)
    senha_bytes = senha.encode('utf-8')
    
    # 2. Gera um 'Salt' (um tempero aleatório)
    # Isso impede que duas senhas iguais tenham o mesmo hash final.
    salt = bcrypt.gensalt()
    
    # 3. Gera o hash final misturando a senha com o salt
    hash_bytes = bcrypt.hashpw(senha_bytes, salt)
    
    # 4. Retorna o hash como string (formato compatível com o SQLite)
    return hash_bytes.decode('utf-8')


# =========================================================
# BLOCO 2: CONFERÊNCIA DE ACESSO (VERIFICAÇÃO)
# =========================================================

def verificar_senha(senha_pura: str, senha_hash: str) -> bool:
    """
    Compara a senha que o usuário digitou no login com o hash 
    que está guardado no banco de dados.
    """
    try:
        # O bcrypt.checkpw faz o trabalho pesado:
        # Ele extrai o salt do hash antigo e aplica na senha nova para comparar.
        return bcrypt.checkpw(
            senha_pura.encode('utf-8'), 
            senha_hash.encode('utf-8')
        )
    except Exception as e:
        # Se houver erro de formato ou dados corrompidos, nega o acesso.
        print(f"Erro na verificação de segurança: {e}")
        return False