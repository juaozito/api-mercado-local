from pydantic import BaseModel, EmailStr
from datetime import datetime
from enum import Enum
from typing import Optional, List

# =========================================================
# BLOCO 1: OPÇÕES PADRONIZADAS (ENUM)
# =========================================================

class StatusProjetoSchema(str, Enum):
    """
    Aqui eu travo as opções de status. Assim o sistema só aceita 
    esses 4 estados e a gente não corre o risco de ter erros de digitação.
    """
    ABERTO = "aberto"
    PAGAMENTO_RETIDO = "pagamento_retido"
    FINALIZADO = "finalizado"
    CANCELADO = "cancelado"

# =========================================================
# BLOCO 2: CONTRATOS DE USUÁRIO
# =========================================================

class UsuarioBase(BaseModel):
    # O básico que todo usuário tem que ter
    nome: str
    email: str

class UsuarioCreate(UsuarioBase):
    # Na hora de criar, eu exijo a senha em texto puro (depois o CRUD faz o hash)
    senha: str

class UsuarioLogin(BaseModel):
    # O que o cara digita na tela de login
    email: str
    senha: str

class Usuario(UsuarioBase):
    # O que o sistema devolve: aqui eu já mando o ID do banco
    id: int
    
    class Config:
        # Isso aqui permite que o Pydantic leia os dados direto do SQLAlchemy (models)
        from_attributes = True 

# =========================================================
# BLOCO 3: CONTRATOS DE PROJETOS E ESCROW
# =========================================================

class ProjetoBase(BaseModel):
    # Campos que aparecem tanto no anúncio quanto na venda
    titulo: str
    valor: float
    vendedor_id: int 

class ProjetoCreate(ProjetoBase):
    # Quando o vendedor cria o anúncio, ele já define o que vai ser entregue (link/curso)
    conteudo_digital: str
    cliente_id: Optional[int] = None

class Projeto(ProjetoBase):
    # Esse é o objeto completo que circula no sistema
    id: int
    status: StatusProjetoSchema
    # Ajustei o nome pra 'data_criacao' pra bater com o nosso banco de dados
    data_criacao: Optional[datetime] = None 
    valor_no_escrow: float
    cliente_id: Optional[int] = None

    class Config:
        from_attributes = True

class ProjetoLiberado(Projeto):
    # Só uso esse esquema quando o pagamento foi confirmado. 
    # Aí eu libero o campo 'conteudo_digital' pro comprador ver.
    conteudo_digital: str

# =========================================================
# BLOCO 4: VALIDAÇÃO DE SEGURANÇA
# =========================================================

class ValidarCodigo(BaseModel):
    """
    Esse é o contrato para a liberação: o vendedor precisa 
    enviar exatamente um campo chamado 'codigo' com os 6 dígitos.
    """
    codigo: str