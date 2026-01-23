import sys
import os

# Adiciona o diretório atual ao path para achar o pacote backend
sys.path.append(os.getcwd())

from backend.database import SessionLocal, engine
from backend.models import Usuario, Base
from backend.security import gerar_senha_hash

def criar_usuario_inicial():
    print("🔄 Verificando integridade do banco de dados...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        email_teste = "admin@teste.com"
        senha_teste = "123"
        user_existente = db.query(Usuario).filter(Usuario.email == email_teste).first()

        if not user_existente:
            print(f"-> Criando usuário admin: {email_teste}...")
            senha_protegida = gerar_senha_hash(senha_teste)
            novo_user = Usuario(
                nome="Administrador",
                email=email_teste,
                senha_hash=senha_protegida 
            )
            db.add(novo_user)
            db.commit()
            print("✅ Usuário criado com sucesso!")
        else:
            print("⚠️ O usuário já existe.")
    except Exception as e:
        print(f"❌ Erro: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    criar_usuario_inicial()