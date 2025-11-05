from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Numeric, Boolean, Enum, event
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
import bcrypt
from datetime import datetime, timezone
from decimal import Decimal
import re
import unicodedata
from .database import Base

# Enums
class UserType(str, enum.Enum):
    online = "online"
    fisica = "fisica"
    admin = "admin"

# Models
class User(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    nome = Column(String(100))
    password = Column(String(100))
    tipo = Column(String(20), default=UserType.online)
    ativo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    pedidos = relationship("Pedido", back_populates="usuario")
    avaliacoes = relationship("Avaliacao", back_populates="usuario")
    favoritos = relationship("Favorito", back_populates="usuario")

    def set_password(self, password: str):
        salt = bcrypt.gensalt()
        self.password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, password: str) -> bool:
        return bcrypt.checkpw(password.encode('utf-8'), self.password.encode('utf-8'))

class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), unique=True)
    descricao = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    produtos = relationship("Produto", back_populates="categoria")

class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100))
    cnpj = Column(String(18), unique=True)
    email = Column(String(100))
    telefone = Column(String(20))
    endereco = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # slug para URLs amigáveis
    slug = Column(String(200), unique=True, nullable=True)

    produtos = relationship("Produto", back_populates="empresa")


def gerar_slug(text: str) -> str:
    """Gera um slug simples a partir de um texto (normaliza acentos, espaços e caracteres inválidos)."""
    if not text:
        return ''
    # normalizar acentos
    t = unicodedata.normalize('NFKD', text)
    t = t.encode('ascii', 'ignore').decode('ascii')
    t = t.strip()

    # Se o nome for somente números (ex: '1' ou '01'), produz 'Mesa-01'
    digits = re.sub(r'\D', '', t)
    if digits and digits == t.replace(' ', ''):
        # manter dois dígitos
        return f"Mesa-{str(digits).zfill(2)}"

    # Caso geral: gera palavras com inicial maiúscula e separadas por dash
    # Remove caracteres inválidos, preserva números
    t = re.sub(r'[^A-Za-z0-9\s\-]', '', t)
    parts = re.split(r'[\s_\-]+', t)
    parts = [p.capitalize() for p in parts if p]
    slug = '-'.join(parts)
    return slug

class Produto(Base):
    __tablename__ = "produtos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), unique=True, index=True)
    nome = Column(String(100))
    descricao = Column(Text, nullable=True)
    preco_compra = Column(Numeric(10, 2))
    preco_venda = Column(Numeric(10, 2))
    categoria_id = Column(Integer, ForeignKey("categorias.id"))
    # associação com empresa
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=True)
    estoque = Column(Integer, default=0)
    disponivel = Column(Boolean, default=True)
    imagem = Column(String(255), nullable=True)
    slug = Column(String(200), unique=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    categoria = relationship("Categoria", back_populates="produtos")
    avaliacoes = relationship("Avaliacao", back_populates="produto")
    favoritos = relationship("Favorito", back_populates="produto")
    movimentacoes = relationship("MovimentacaoEstoque", back_populates="produto")
    pedido_itens = relationship("PedidoItem", back_populates="produto")
    empresa = relationship("Empresa", back_populates="produtos")

class Mesa(Base):
    __tablename__ = "mesas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(50), unique=True)
    status = Column(String(20), default="livre")
    capacidade = Column(Integer, default=4)
    observacoes = Column(Text, nullable=True)
    usuario_responsavel_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    slug = Column(String(200), unique=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    pedidos = relationship("Pedido", back_populates="mesa")
    usuario_responsavel = relationship("User")

# Evento para gerar slug automaticamente nas mesas
@event.listens_for(Mesa, 'before_insert')
def mesa_before_insert(mapper, connection, target):
    if target.nome and not target.slug:
        target.slug = gerar_slug(target.nome)

class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    numero = Column(String(20), unique=True)
    tipo = Column(String(20))  # "online" ou "fisica"
    status = Column(String(20))
    total = Column(Numeric(10, 2), default=0)
    observacoes = Column(Text, nullable=True)
    mesa_id = Column(Integer, ForeignKey("mesas.id"), nullable=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    itens = relationship("PedidoItem", back_populates="pedido", cascade="all, delete-orphan")
    mesa = relationship("Mesa", back_populates="pedidos")
    usuario = relationship("User", back_populates="pedidos")
    pagamentos = relationship("Pagamento", back_populates="pedido")

class PedidoItem(Base):
    __tablename__ = "pedido_itens"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"))
    produto_id = Column(Integer, ForeignKey("produtos.id"))
    quantidade = Column(Integer)
    preco_unitario = Column(Numeric(10, 2))
    subtotal = Column(Numeric(10, 2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    pedido = relationship("Pedido", back_populates="itens")
    produto = relationship("Produto", back_populates="pedido_itens")

    @staticmethod
    def before_insert(mapper, connection, target):
        target.subtotal = target.quantidade * target.preco_unitario

    @staticmethod
    def before_update(mapper, connection, target):
        target.subtotal = target.quantidade * target.preco_unitario

event.listen(PedidoItem, 'before_insert', PedidoItem.before_insert)
event.listen(PedidoItem, 'before_update', PedidoItem.before_update)

class Avaliacao(Base):
    __tablename__ = "avaliacoes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    produto_id = Column(Integer, ForeignKey("produtos.id"))
    rating = Column(Integer)
    comentario = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    usuario = relationship("User", back_populates="avaliacoes")
    produto = relationship("Produto", back_populates="avaliacoes")

class Favorito(Base):
    __tablename__ = "favoritos"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    produto_id = Column(Integer, ForeignKey("produtos.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    usuario = relationship("User", back_populates="favoritos")
    produto = relationship("Produto", back_populates="favoritos")


class Carrinho(Base):
    __tablename__ = "carrinhos"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    usuario = relationship("User")
    itens = relationship("CarrinhoItem", back_populates="carrinho", cascade="all, delete-orphan")


class CarrinhoItem(Base):
    __tablename__ = "carrinho_items"

    id = Column(Integer, primary_key=True, index=True)
    carrinho_id = Column(Integer, ForeignKey("carrinhos.id"))
    produto_id = Column(Integer, ForeignKey("produtos.id"))
    quantidade = Column(Integer, default=1)
    preco_unitario = Column(Numeric(10,2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    carrinho = relationship("Carrinho", back_populates="itens")
    produto = relationship("Produto")

class MovimentacaoEstoque(Base):
    __tablename__ = "movimentacoes_estoque"

    id = Column(Integer, primary_key=True, index=True)
    produto_id = Column(Integer, ForeignKey("produtos.id"))
    quantidade = Column(Integer)
    quantidade_anterior = Column(Integer, nullable=True)
    quantidade_nova = Column(Integer, nullable=True)
    tipo = Column(String(20))  # entrada, saida
    origem = Column(String(50))  # venda_fisica, venda_online, compra, ajuste_manual
    observacoes = Column(Text, nullable=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    produto = relationship("Produto", back_populates="movimentacoes")

class Pagamento(Base):
    __tablename__ = "pagamentos"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"))
    valor = Column(Numeric(10, 2))
    forma_pagamento = Column(String(50))
    status = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    pedido = relationship("Pedido", back_populates="pagamentos")