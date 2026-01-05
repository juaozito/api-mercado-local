from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class StatusProjetoSchema(str, Enum):
    ABERTO = "aberto"
    PAGAMENTO_RETIDO = "pagamento_retido"
    FINALIZADO = "finalizado"
    CANCELADO = "cancelado"

class ProjetoBase(BaseModel):
    titulo: str
    valor: float
    cliente_id: int

class ProjetoCreate(ProjetoBase): # <--- Verifique se aqui não está 'ProdutoCreate'
    pass

class ProjetoCreate(ProjetoBase):
    class Config:
        json_schema_extra = {
            "example": {
                "titulo": "Desenvolvimento de Website",
                "valor": 2500.0,
                "cliente_id": 1
            }
        }

class Projeto(ProjetoBase):
    id: int
    status: StatusProjetoSchema
    data_creation: datetime = None # opcional
    valor_no_escrow: float

    class Config:
        from_attributes = True