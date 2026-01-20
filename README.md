# 🚀 RYZER — MARKETPLACE SOLUTIONS

O **Ryzer** é uma plataforma de marketplace local moderna, desenvolvida para conectar compradores e vendedores de forma segura. A API gerencia desde o catálogo de produtos até o fluxo de pagamento protegido (Escrow), garantindo confiança total nas transações da comunidade.

---

## 🎯 PROPOSÍTIO DO PROJETO

Este projeto foi desenvolvido como uma demonstração de arquitetura backend profissional, com foco em três pilares fundamentais: segurança avançada para proteção rigorosa de dados sensíveis; escalabilidade através de banco de dados relacional de alta performance e processamento assíncrono; e uma excelente experiência do usuário (UX) com interface limpa e documentação técnica de fácil consumo.

---

## 🛠️ STACK TECNOLÓGICA

Para o desenvolvimento, utilizamos o framework **FastAPI** pela sua alta performance e tipagem rápida. O armazenamento de dados é feito via **PostgreSQL** em ambiente de produção (Render) utilizando o **SQLAlchemy** como ORM. A camada de segurança conta com autenticação **JWT** (JSON Web Tokens) e criptografia de senhas com **Passlib**. O frontend é renderizado via **Jinja2 Templates** com HTML5 e CSS3, e todo o deploy é gerenciado pela plataforma **Render**.

---

## ✨ FUNCIONALIDADES CHAVE

A plataforma oferece autenticação segura com sistema de Login/Logout, gestão completa de anúncios para criação e edição de produtos por categorias, e um mecanismo de **Escrow** para retenção de pagamentos. Além disso, incluímos uma ferramenta administrativa para provisionamento de usuários root e documentação interativa via **Swagger UI** disponível na rota `/docs`.

---

## 💻 GUIA DE INSTALAÇÃO E EXECUÇÃO

Para rodar o projeto, é necessário ter o Python 3.10+ e o Git instalados. O primeiro passo é clonar o repositório com o comando `git clone https://github.com/seu-usuario/api-mercado-local.git` e acessar a pasta. Em seguida, crie e ative o ambiente virtual com `python -m venv venv` e o comando de ativação correspondente ao seu sistema, sendo `.\venv\Scripts\activate` no Windows ou `source venv/bin/activate` no Linux/Mac.

Após ativar o ambiente, instale as dependências com `pip install -r requirements.txt`. Lembre-se de configurar a variável `DATABASE_URL` no arquivo `backend/config.py` com sua string de conexão correta. Para finalizar, execute o script de criação do banco com `python -m backend.criar_usuario` e inicie o servidor com `uvicorn backend.main:app --reload`. A plataforma estará disponível em `http://127.0.0.1:8000`.

---

## 👥 DESENVOLVEDORES

Este projeto foi idealizado e desenvolvido por:

**João Lucas Rebouças**

**João Araújo Neto**

---

*Ryzer API — Conectando negócios, garantindo segurança.*
