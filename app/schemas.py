from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from typing import Optional

class StatusProjetoSchema(str, Enum):
    ABERTO = "aberto"
    PAGAMENTO_RETIDO = "pagamento_retido"
    FINALIZADO = "finalizado"
    CANCELADO = "cancelado"

class ProjetoBase(BaseModel):
    titulo: str
    valor: float
    cliente_id: int
    vendedor_id: int 

# --- CORREÇÃO AQUI: Apenas UMA definição de ProjetoCreate ---
class ProjetoCreate(ProjetoBase):
    conteudo_digital: str  # Agora o campo existe oficialmente aqui

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "titulo": "Desenvolvimento de Website",
                "valor": 2500.0,
                "cliente_id": 1,
                "vendedor_id": 2,
                "conteudo_digital": "https://link-secreto.com/download-do-curso"
            }
        }

class Projeto(ProjetoBase):
    id: int
    status: StatusProjetoSchema
    data_creation: Optional[datetime] = None 
    valor_no_escrow: float

    class Config:
        from_attributes = True

class ProjetoLiberado(Projeto):
    conteudo_digital: str

class ValidarCodigo(BaseModel):
    codigo: str