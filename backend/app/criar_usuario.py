import sys
import os

# --- BLOCO 1: CONFIGURAÇÃO DE CAMINHO ---
# Esse bloco garante que, mesmo rodando o script de pastas diferentes,
# o Python consiga encontrar os arquivos 'database.py', 'models.py', etc.
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# --- BLOCO 2: IMPORTAÇÕES ---
from database import SessionLocal  # Importa a fábrica de conexões com o banco
from models import Usuario         # Importa a estrutura da tabela de usuários
from security import gerar_senha_hash # Importa a ferramenta de criptografia

# --- BLOCO 3: EXECUÇÃO DO SCRIPT ---

def criar_usuario_inicial():
    # Abrimos uma sessão (conexão ativa) com o banco de dados mercado.db
    db = SessionLocal()
    
    try:
        # Definimos os dados do usuário administrativo de teste
        email_teste = "admin@teste.com"
        senha_teste = "123"

        # Verificamos se esse e-mail já existe para não travar o banco (Unique Constraint)
        user_existente = db.query(Usuario).filter(Usuario.email == email_teste).first()

        if not user_existente:
            print(f"-> Criando usuário: {email_teste}...")
            
            # IMPORTANTE: Criptografamos a senha antes de salvar.
            # No banco de dados, a senha '123' parecerá algo como '$2b$12$Kj...'
            senha_protegida = gerar_senha_hash(senha_teste)

            novo_user = Usuario(
                nome="Administrador",
                email=email_teste,
                senha_hash=senha_protegida  # Salvamos o hash, não a senha pura
            )

            # Adicionamos o novo objeto à fila do banco e confirmamos (commit)
            db.add(novo_user)
            db.commit()
            
            print("✅ Usuário criado com sucesso!")
            print(f"🔑 E-mail: {email_teste} | Senha: {senha_teste}")
        else:
            print("⚠️ Aviso: O usuário 'admin@teste.com' já existe no banco de dados.")

    except Exception as e:
        # Caso ocorra qualquer erro (ex: banco travado), desfazemos as alterações
        print(f"❌ Erro ao acessar o banco: {e}")
        db.rollback()
    
    finally:
        # Sempre fechamos a conexão para não deixar o arquivo .db "preso"
        db.close()

# Dispara a função se o script for executado diretamente
if __name__ == "__main__":
    criar_usuario_inicial()