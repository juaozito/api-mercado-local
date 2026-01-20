import sys
import os

# --- BLOCO 1: AJUSTE DE CAMINHOS ---
# Faço isso pra garantir que o Python encontre os outros arquivos do projeto
# mesmo se eu rodar esse script de dentro de uma pasta diferente.
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# --- BLOCO 2: IMPORTAÇÕES DO NOSSO SISTEMA ---
# Puxo a conexão do banco, as tabelas e a nossa lógica de criptografia.
# No topo do criar_usuario.py
from backend.database import SessionLocal, engine
from backend.models import Usuario, Base
from backend.security import gerar_senha_hash

# --- BLOCO 3: A MÁGICA DA CRIAÇÃO ---
def criar_usuario_inicial():
    # Antes de tudo, verifico se as tabelas já existem. 
    # Se não existirem, o SQLAlchemy cria o arquivo 'mercado.db' agora.
    print("🔄 Verificando integridade do banco de dados...")
    Base.metadata.create_all(bind=engine)

    # Abro a conversa com o banco de dados.
    db = SessionLocal()
    
    try:
        # Defino as credenciais padrão do admin.
        email_teste = "admin@teste.com"
        senha_teste = "123"

        # Procuro se esse e-mail já tá cadastrado pra não criar duplicado e dar erro.
        user_existente = db.query(Usuario).filter(Usuario.email == email_teste).first()

        if not user_existente:
            print(f"-> Criando usuário admin: {email_teste}...")
            
            # Não guardo a senha '123' pura; transformo em hash pra ficar seguro.
            senha_protegida = gerar_senha_hash(senha_teste)

            # Crio o objeto do usuário. 
            # DICA: mudei para 'senha_hash' para bater com o que definimos no models.py
            novo_user = Usuario(
                nome="Administrador",
                email=email_teste,
                senha_hash=senha_protegida 
            )

            # Salvo no banco de fato.
            db.add(novo_user)
            db.commit()
            
            print("✅ Usuário criado com sucesso!")
            print(f"🔑 Login: {email_teste} | Senha: {senha_teste}")
        else:
            print("⚠️ O usuário já existe. Nenhuma ação necessária.")

    except Exception as e:
        # Se der qualquer zebra, eu cancelo o que estava fazendo (rollback) pra não corromper o banco.
        print(f"❌ Erro ao processar: {e}")
        db.rollback()
    
    finally:
        # Independente de dar certo ou errado, eu fecho a conexão pra não gastar memória.
        db.close()

# Se eu rodar esse arquivo diretamente no terminal, ele executa a função acima.
if __name__ == "__main__":
    criar_usuario_inicial()