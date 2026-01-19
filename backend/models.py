import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

# =========================================================
# BLOCO 1: STATUS DO PROJETO (REGRAS DO ESCROW)
# =========================================================

class StatusProjeto(enum.Enum):
    """
    Aqui eu defino os estados do anúncio. É fundamental para garantir 
    que o banco não aceite qualquer texto e que o fluxo de segurança seja seguido.
    """
    ABERTO = "aberto"              # O anúncio está na vitrine, esperando interessado.
    PAGAMENTO_RETIDO = "pagamento_retido"  # O comprador pagou, mas o dinheiro está travado comigo (Ryzer).
    FINALIZADO = "finalizado"      # O código bateu, o vendedor recebeu e o conteúdo foi entregue.
    CANCELADO = "cancelado"        # Deu algum problema e a transação foi desfeita.

# =========================================================
# BLOCO 2: TABELA DE USUÁRIOS
# =========================================================

class Usuario(Base):
    """
    Aqui eu guardo todo mundo: quem compra e quem vende.
    Um mesmo usuário pode ser vendedor em um projeto e cliente em outro.
    """
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    
    # IMPORTANTE: Nunca guardo senha pura, apenas o hash gerado no security.py
    senha_hash = Column(String, nullable=False) 

    # Crio conexões para facilitar a busca: 
    # Posso perguntar ao usuário: "Quais projetos você está comprando?" ou "O que você está vendendo?"
    projetos_como_cliente = relationship("Projeto", foreign_keys="[Projeto.cliente_id]", back_populates="cliente")
    projetos_como_vendedor = relationship("Projeto", foreign_keys="[Projeto.vendedor_id]", back_populates="vendedor")

# =========================================================
# BLOCO 3: TABELA DE PROJETOS (O CORAÇÃO DO RYZER)
# =========================================================



class Projeto(Base):
    """
    Essa é a tabela principal. Ela controla desde o anúncio até a entrega final.
    É aqui que o sistema de Escrow (dinheiro retido) acontece.
    """
    __tablename__ = "projetos"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, index=True, nullable=False)
    valor = Column(Float, nullable=False)
    
    # CHAVES ESTRANGEIRAS: Ligam o projeto aos donos dele
    # cliente_id começa vazio (null) porque no início só temos o vendedor.
    cliente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    vendedor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    
    # CONTROLE DE ESTADO
    status = Column(SQLEnum(StatusProjeto), default=StatusProjeto.ABERTO)
    data_criacao = Column(DateTime, default=datetime.now)
    
    # SEGURANÇA E ENTREGA
    # valor_no_escrow: Guarda o valor que está "congelado" durante a negociação.
    valor_no_escrow = Column(Float, default=0.0)
    
    # conteudo_digital: É o prêmio! O link ou texto que só será liberado no status FINALIZADO.
    conteudo_digital = Column(String, nullable=True) 
    
    # codigo_verificacao: O segredo de 6 dígitos que gera a confiança entre as partes.
    codigo_verificacao = Column(String(6), nullable=True) 

    # RELACIONAMENTOS INVERSOS: 
    # Permitem que, ao carregar um Projeto, eu já tenha os dados do Vendedor e do Cliente na mão.
    cliente = relationship("Usuario", foreign_keys=[cliente_id], back_populates="projetos_como_cliente")
    vendedor = relationship("Usuario", foreign_keys=[vendedor_id], back_populates="projetos_como_vendedor")