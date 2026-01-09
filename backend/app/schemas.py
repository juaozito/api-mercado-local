from pydantic import BaseModel, EmailStr
from datetime import datetime
from enum import Enum
from typing import Optional, List

# =========================================================
# BLOCO 1: ENUMERAÇÕES (OPÇÕES FIXAS)
# =========================================================
class StatusProjetoSchema(str, Enum):
    """
    Define os mesmos status do models.py, mas aqui serve para 
    o FastAPI validar o JSON que chega do site.
    """
    ABERTO = "aberto"
    PAGAMENTO_RETIDO = "pagamento_retido"
    FINALIZADO = "finalizado"
    CANCELADO = "cancelado"

# =========================================================
# BLOCO 2: ESQUEMAS DE USUÁRIO
# =========================================================
class UsuarioBase(BaseModel):
    """Campos comuns a qualquer operação de usuário."""
    nome: str
    email: str

class UsuarioCreate(UsuarioBase):
    """O que o site envia na hora de cadastrar (inclui a senha pura)."""
    senha: str

class UsuarioLogin(BaseModel):
    """O que o site envia na hora de fazer login."""
    email: str
    senha: str

class Usuario(UsuarioBase):
    """Como a API devolve o usuário (nunca devolvemos a senha por segurança)."""
    id: int
    
    class Config:
        from_attributes = True # Permite converter do banco de dados para JSON

# =========================================================
# BLOCO 3: ESQUEMAS de PROJETO (ANÚNCIO / ESCROW)
# =========================================================
class ProjetoBase(BaseModel):
    """Campos básicos que aparecem tanto no anúncio quanto na venda."""
    titulo: str
    valor: float
    vendedor_id: int 

class ProjetoCreate(ProjetoBase):
    """
    O que o 'anunciar.js' envia. 
    Note que o cliente_id é opcional pois ninguém comprou ainda.
    """
    conteudo_digital: str
    cliente_id: Optional[int] = None

class Projeto(ProjetoBase):
    """
    Formato padrão de resposta para o Dashboard e listagens.
    Oculta o 'conteudo_digital' para segurança.
    """
    id: int
    status: StatusProjetoSchema
    data_creation: Optional[datetime] = None 
    valor_no_escrow: float
    cliente_id: Optional[int] = None

    class Config:
        from_attributes = True

class ProjetoLiberado(Projeto):
    """
    Extensão do esquema de Projeto.
    Usado somente quando o código de 6 dígitos é validado,
    liberando o campo 'conteudo_digital'.
    """
    conteudo_digital: str

# =========================================================
# BLOCO 4: ESQUEMAS DE VALIDAÇÃO
# =========================================================
class ValidarCodigo(BaseModel):
    """O que o comprador digita para liberar o pagamento (6 dígitos)."""
    codigo: str