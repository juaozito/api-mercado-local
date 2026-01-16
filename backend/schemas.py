from pydantic import BaseModel, EmailStr
from datetime import datetime
from enum import Enum
from typing import Optional, List

# =========================================================
# BLOCO 1: ENUMERAÇÕES (OPÇÕES FIXAS)
# =========================================================
class StatusProjetoSchema(str, Enum):
    ABERTO = "aberto"
    PAGAMENTO_RETIDO = "pagamento_retido"
    FINALIZADO = "finalizado"
    CANCELADO = "cancelado"

# =========================================================
# BLOCO 2: ESQUEMAS DE USUÁRIO
# =========================================================
class UsuarioBase(BaseModel):
    nome: str
    email: str

class UsuarioCreate(UsuarioBase):
    senha: str

class UsuarioLogin(BaseModel):
    email: str
    senha: str

class Usuario(UsuarioBase):
    id: int
    
    class Config:
        from_attributes = True 

# =========================================================
# BLOCO 3: ESQUEMAS de PROJETO (ANÚNCIO / ESCROW)
# =========================================================
class ProjetoBase(BaseModel):
    titulo: str
    valor: float
    vendedor_id: int 

class ProjetoCreate(ProjetoBase):
    conteudo_digital: str
    cliente_id: Optional[int] = None

class Projeto(ProjetoBase):
    id: int
    status: StatusProjetoSchema
    # --- CORREÇÃO AQUI: Mudado de data_creation para data_criacao ---
    data_criacao: Optional[datetime] = None 
    valor_no_escrow: float
    cliente_id: Optional[int] = None

    class Config:
        from_attributes = True

class ProjetoLiberado(Projeto):
    conteudo_digital: str

# =========================================================
# BLOCO 4: ESQUEMAS DE VALIDAÇÃO
# =========================================================
class ValidarCodigo(BaseModel):
    """O que o comprador digita para liberar o pagamento (6 dígitos)."""
    codigo: str