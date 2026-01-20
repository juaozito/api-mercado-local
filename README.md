# 🚀 Ryzer - API de Mercado Local

O **Ryzer** é uma plataforma de marketplace local moderna, desenvolvida para conectar compradores e vendedores de forma segura. A API gerencia desde o catálogo de produtos até o fluxo de pagamento protegido (Escrow), garantindo confiança nas transações da comunidade.

---

## 🎯 Objetivo do Projeto

Este projeto foi criado para demonstrar a implementação de uma arquitetura de backend profissional, focando em:

* **Segurança**: Autenticação robusta e proteção de dados.
  
* **Escalabilidade**: Uso de banco de dados relacional robusto e código assíncrono.

* **Experiência do Usuário**: Interface limpa e documentação de API fácil de usar.

---

## 🛠️ Stack Tecnológica

* **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Alta performance e tipagem rápida).
  
* **Banco de Dados:** PostgreSQL (Produção via Render) e SQLAlchemy (ORM).
  
* **Segurança:** Autenticação JWT (JSON Web Tokens) e Criptografia de senhas com Passlib.
  
* **Frontend:** Jinja2 Templates, HTML5 e CSS3.
  
* **Deploy:** [Render](https://render.com/).

---

## ✨ Funcionalidades Principais

- [x] **Autenticação Segura**: Sistema de Login/Logout com tokens de acesso de longa duração.
    
- [x] **Gestão de Anúncios**: Criação, edição e visualização de produtos com categorias.

- [x] **Sistema de Escrow**: Retenção de pagamento para segurança do comprador e vendedor.

- [x] **Painel Administrativo**: Script especializado para criação de usuários root.

- [x] **Documentação Automática**: Swagger UI disponível em `/docs`.

---

## 💻 Como Rodar este Projeto

### 1. Pré-requisitos

* Python 3.10 ou superior instalado.
  
* Git instalado.

### 2. Clonagem e Ambiente


# Clonar o repositório

git clone [https://github.com/seu-usuario/api-mercado-local.git](https://github.com/seu-usuario/api-mercado-local.git)

cd api-mercado-local

# Criar e ativar o ambiente virtual

python -m venv venv

# Windows:

.\venv\Scripts\activate

# Linux/Mac:

source venv/bin/activate

### 3. Instalação e Configuração

# Instalar dependências

pip install -r requirements.txt

# Configurar Variáveis (backend/config.py)

# DATABASE_URL = "postgresql://user:pass@host/dbname?sslmode=require"

### 4. Inicialização do Banco e Servidor

# Criar tabelas e usuário administrador inicial

python -m backend.criar_usuario

# Iniciar a aplicação

uvicorn backend.main:app --reload


