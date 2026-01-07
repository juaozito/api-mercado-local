import enum
import random
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum
from .database import Base

# 1. Definindo os Status para o Banco de Dados
class StatusProjeto(enum.Enum):
    ABERTO = "aberto"
    PAGAMENTO_RETIDO = "pagamento_retido"
    FINALIZADO = "finalizado"
    CANCELADO = "cancelado"

# 2. A Classe de Banco de Dados
class Projeto(Base):
    __tablename__ = "projetos"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, index=True)
    valor = Column(Float)
    cliente_id = Column(Integer)
    vendedor_id = Column(Integer) #Importante saber quem recebe o dinheiro
    status = Column(SQLEnum(StatusProjeto), default=StatusProjeto.ABERTO)
    data_criacao = Column(DateTime, default=datetime.now)
    
    # Este é o seu atributo privado __valor_no_escrow, agora como coluna
    valor_no_escrow = Column(Float, default=0.0)

    # NOVOS CAMPOS PARA O PRODUTO DIGITAL

    # Aqui fica o link, senha ou segredo.
    # Ele será omitido na resposta da API enquanto o status não for FINALIZADO.
    conteudo_digital = Column(String, nullable=True)

    # O código de 6 dígitos que o comprador usará para "abrir o cofre"
    codigo_verificacao = Column(String(6), nullable=True)