import os

class Settings:
    # 1. NOME DO PROJETO
    # Define o título que aparecerá na documentação automática da API.
    PROJECT_NAME: str = "Mercado Local"
    
    # 2. VERSÃO DO SISTEMA
    # Útil para você controlar as atualizações do seu código.
    PROJECT_VERSION: str = "1.0.0"

    # 3. CONFIGURAÇÃO DO BANCO DE DADOS (SQLite)
    # Centralizamos a URL do banco aqui. Se um dia você quiser mudar o nome
    # do arquivo .db, você só precisa alterar esta linha.
    # O padrão 'sqlite:///./nome_do_arquivo.db' cria o arquivo na raiz da pasta app.
    DATABASE_URL: str = "sqlite:///./mercado.db"

# Criamos uma instância da classe Settings para ser usada em outros arquivos.
# Assim, basta importar 'settings' e usar 'settings.PROJECT_NAME'.
settings = Settings()