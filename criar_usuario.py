import sys
import os

# --- BLOCO 1: CONFIGURAÇÃO DE CAMINHO ---
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# --- BLOCO 2: IMPORTAÇÕES ---
# Adicionamos 'engine' e 'Base' para garantir que podemos criar as tabelas
from database import SessionLocal, engine
from models import Usuario, Base
from security import gerar_senha_hash

# --- BLOCO 3: EXECUÇÃO DO SCRIPT ---
def criar_usuario_inicial():
    # CORREÇÃO CRUCIAL: Cria as tabelas se elas não existirem
    print("🔄 Verificando integridade do banco de dados...")
    Base.metadata.create_all(bind=engine)

    # Abrimos uma sessão
    db = SessionLocal()
    
    try:
        email_teste = "admin@teste.com"
        senha_teste = "123"

        # Verifica se usuário já existe
        user_existente = db.query(Usuario).filter(Usuario.email == email_teste).first()

        if not user_existente:
            print(f"-> Criando usuário admin: {email_teste}...")
            
            # Gera o hash da senha
            senha_protegida = gerar_senha_hash(senha_teste)

            novo_user = Usuario(
                nome="Administrador",
                email=email_teste,
                senha=senha_protegida  # Atenção: verifique se no seu models.py o campo é 'senha' ou 'senha_hash'
            )

            db.add(novo_user)
            db.commit()
            
            print("✅ Usuário criado com sucesso!")
            print(f"🔑 Login: {email_teste} | Senha: {senha_teste}")
        else:
            print("⚠️ O usuário já existe. Nenhuma ação necessária.")

    except Exception as e:
        print(f"❌ Erro ao processar: {e}")
        db.rollback()
    
    finally:
        db.close()

if __name__ == "__main__":
    criar_usuario_inicial()
