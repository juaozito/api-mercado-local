import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

# =========================================================
# BLOCO 1: DEFINIÇÃO DE STATUS (ENUM)
# =========================================================
class StatusProjeto(enum.Enum):
    """
    Define os estados possíveis de um anúncio no sistema.
    Usar Enum evita que textos errados sejam gravados no banco.
    """
    ABERTO = "aberto"              # Anúncio criado, aguardando comprador
    PAGAMENTO_RETIDO = "pagamento_retido"  # Dinheiro no Escrow, aguardando código
    FINALIZADO = "finalizado"      # Venda concluída, conteúdo liberado
    CANCELADO = "cancelado"        # Venda interrompida

# =========================================================
# BLOCO 2: MODELO DE USUÁRIO
# =========================================================
class Usuario(Base):
    """
    Tabela que armazena todos os usuários (Vendedores e Clientes).
    """
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha_hash = Column(String, nullable=False) # Senha já criptografada pelo security.py

    # --- RELACIONAMENTOS (O "Pulo do Gato") ---
    # Permite acessar todos os projetos ligados a este usuário de forma fácil:
    # usuario.projetos_como_cliente -> Lista o que ele comprou
    # usuario.projetos_como_vendedor -> Lista o que ele anunciou
    projetos_como_cliente = relationship(
        "Projeto", 
        foreign_keys="[Projeto.cliente_id]", 
        back_populates="cliente"
    )
    projetos_como_vendedor = relationship(
        "Projeto", 
        foreign_keys="[Projeto.vendedor_id]", 
        back_populates="vendedor"
    )

# =========================================================
# BLOCO 3: MODELO DE PROJETO (ANÚNCIOS / ESCROW)
# =========================================================
class Projeto(Base):
    """
    Tabela principal onde ocorre a intermediação (Escrow).
    Armazena o valor, o status do pagamento e o conteúdo travado.
    """
    __tablename__ = "projetos"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, index=True, nullable=False)
    valor = Column(Float, nullable=False)
    
    # --- CHAVES ESTRANGEIRAS ---
    # cliente_id é opcional (nullable=True) porque no anúncio ainda não há comprador.
    cliente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    vendedor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    
    # --- CAMPOS DE CONTROLE ---
    status = Column(SQLEnum(StatusProjeto), default=StatusProjeto.ABERTO)
    data_criacao = Column(DateTime, default=datetime.now)
    
    # Escrow: Valor que está 'congelado' no sistema
    valor_no_escrow = Column(Float, default=0.0)
    
    # Conteúdo Digital: O link ou texto que o comprador quer (Ex: link de curso)
    conteudo_digital = Column(String, nullable=True)
    
    # Código de Verificação: O segredo de 6 dígitos para liberar a venda
    codigo_verificacao = Column(String(6), nullable=True)

    # --- CONEXÕES REVERSAS ---
    # Permite que, ao carregar um projeto, você acesse projeto.vendedor.nome
    cliente = relationship("Usuario", foreign_keys=[cliente_id], back_populates="projetos_como_cliente")
    vendedor = relationship("Usuario", foreign_keys=[vendedor_id], back_populates="projetos_como_vendedor")