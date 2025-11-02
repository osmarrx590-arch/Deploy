from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Numeric, Boolean, event
from sqlalchemy.orm import relationship
from backend.core_models import Base, Produto
from backend.logging_config import logger
from backend.user_models import User
import re
import unicodedata


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

class Mesa(Base):
    """Table model for physical store"""
    __tablename__ = 'loja_fisica_mesa'

    id = Column(Integer, primary_key=True)
    nome = Column(String(50), nullable=False)
    slug = Column(String(100), nullable=False, unique=True)
    status = Column(String(20), default='livre')
    usuario_responsavel_id = Column(Integer, ForeignKey('auth_user.id'), nullable=True)
    capacidade = Column(Integer, default=4)
    observacoes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    usuario_responsavel = relationship('User', backref='mesas_responsavel')
    pedidos = relationship('PedidoLocal', back_populates='mesa')
    reservas_estoque = relationship('EstoqueReserva', back_populates='mesa')

    STATUS_CHOICES = {
        'livre': 'Livre',
        'ocupada': 'Ocupada',
        'reservada': 'Reservada',
        'manutencao': 'Manutenção'
    }

    def __str__(self):
        return f"Mesa {self.nome} - {self.STATUS_CHOICES.get(self.status, self.status)}"

    def __init__(self, nome: str, status: str = 'livre', usuario_responsavel_id: int = None, capacidade: int = 4, observacoes: str = '', slug: str = None):
        if status not in self.STATUS_CHOICES:
            raise ValueError(f'status inválido para Mesa: {status}')
        self.nome = nome
        # definir slug com base no nome se não fornecido
        self.slug = slug or gerar_slug(str(nome))
        self.status = status
        self.usuario_responsavel_id = int(usuario_responsavel_id) if usuario_responsavel_id else None
        self.capacidade = int(capacidade)
        self.observacoes = observacoes or ''
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = self.created_at


class PedidoLocal(Base):
    """Local/Physical store order model"""
    __tablename__ = 'loja_fisica_pedido_local'

    id = Column(Integer, primary_key=True)
    # Padronizar numero como inteiro único (antes era string com prefixo 'LCL-...')
    numero = Column(Integer, unique=True, nullable=False)
    mesa_id = Column(Integer, ForeignKey('loja_fisica_mesa.id'), nullable=False)
    atendente_id = Column(Integer, ForeignKey('auth_user.id'), nullable=False)
    status = Column(String(20), default='pendente')
    total = Column(Numeric(10, 2), nullable=False)
    observacoes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    mesa = relationship('Mesa', back_populates='pedidos')
    atendente = relationship('User', backref='pedidos_atendidos')
    itens = relationship('ItemPedidoLocal', back_populates='pedido')
    pagamento = relationship('Pagamento', back_populates='pedido', uselist=False)
    movimentacoes_estoque = relationship('MovimentacaoEstoque', back_populates='pedido_local')
    reservas_estoque = relationship('EstoqueReserva', back_populates='pedido_local')

    STATUS_CHOICES = {
        'pendente': 'Pendente',
        'em_preparo': 'Em Preparo',
        'pronto': 'Pronto',
        'entregue': 'Entregue',
        'cancelado': 'Cancelado'
    }

    def __str__(self):
        return f"Pedido #{self.numero} - Mesa {self.mesa.nome}"

    def __init__(self, numero: int, mesa_id: int, atendente_id: int, status: str = 'pendente', total=0, observacoes: str = ''):
        if status not in self.STATUS_CHOICES:
            raise ValueError(f'status inválido para PedidoLocal: {status}')
        # armazenar como inteiro
        self.numero = int(numero)
        self.mesa_id = int(mesa_id)
        self.atendente_id = int(atendente_id)
        self.status = status
        self.total = total or 0
        self.observacoes = observacoes or ''
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = self.created_at


class ItemPedidoLocal(Base):
    """Local order item model"""
    __tablename__ = 'loja_fisica_item_pedido_local'

    id = Column(Integer, primary_key=True)
    pedido_id = Column(Integer, ForeignKey('loja_fisica_pedido_local.id'), nullable=False)
    produto_id = Column(Integer, ForeignKey('core_produto.id'), nullable=False)
    nome = Column(String(200), nullable=False)
    quantidade = Column(Integer, nullable=False)
    preco_unitario = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)
    observacoes = Column(Text, nullable=True)

    # Relationships
    pedido = relationship('PedidoLocal', back_populates='itens')
    produto = relationship('Produto')

    def __str__(self):
        return f"{self.nome} x{self.quantidade}"

    @staticmethod
    def before_insert(mapper, connection, target):
        target.subtotal = target.quantidade * target.preco_unitario

    @staticmethod
    def before_update(mapper, connection, target):
        target.subtotal = target.quantidade * target.preco_unitario

    def __init__(self, pedido_id: int, produto_id: int, nome: str, quantidade: int, preco_unitario, subtotal=None, observacoes: str = ''):
        if int(quantidade) <= 0:
            raise ValueError('quantidade deve ser > 0')
        self.pedido_id = int(pedido_id)
        self.produto_id = int(produto_id)
        self.nome = nome
        self.quantidade = int(quantidade)
        self.preco_unitario = preco_unitario
        self.subtotal = subtotal if subtotal is not None else (self.quantidade * self.preco_unitario)
        self.observacoes = observacoes or ''

event.listen(ItemPedidoLocal, 'before_insert', ItemPedidoLocal.before_insert)
event.listen(ItemPedidoLocal, 'before_update', ItemPedidoLocal.before_update)


class MovimentacaoEstoque(Base):
    """Stock movement model"""
    __tablename__ = 'loja_fisica_movimentacao_estoque'

    id = Column(Integer, primary_key=True)
    produto_id = Column(Integer, ForeignKey('core_produto.id'), nullable=False)
    tipo = Column(String(20), nullable=False)
    origem = Column(String(20), nullable=False)
    quantidade = Column(Integer, nullable=False)
    quantidade_anterior = Column(Integer, nullable=False)
    quantidade_nova = Column(Integer, nullable=False)
    usuario_id = Column(Integer, ForeignKey('auth_user.id'), nullable=False)
    observacao = Column(Text, nullable=True)
    pedido_local_id = Column(Integer, ForeignKey('loja_fisica_pedido_local.id'), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    produto = relationship('Produto')
    usuario = relationship('User')
    pedido_local = relationship('PedidoLocal', back_populates='movimentacoes_estoque')

    TIPO_CHOICES = {
        'entrada': 'Entrada',
        'saida': 'Saída',
        'ajuste': 'Ajuste',
        'reserva': 'Reserva',
        'cancelamento_reserva': 'Cancelamento de Reserva'
    }

    ORIGEM_CHOICES = {
        'venda_online': 'Venda Online',
        'venda_fisica': 'Venda Física',
        'compra': 'Compra',
        'ajuste_manual': 'Ajuste Manual',
        'reserva_mesa': 'Reserva Mesa'
    }

    def __str__(self):
        return f"{self.produto.nome} - {self.TIPO_CHOICES.get(self.tipo, self.tipo)} ({self.quantidade})"

    def __init__(self, produto_id: int, tipo: str, origem: str, quantidade: int, quantidade_anterior: int, quantidade_nova: int, usuario_id: int, observacao: str = '', pedido_local_id: int = None):
        if tipo not in self.TIPO_CHOICES:
            raise ValueError(f'tipo inválido para MovimentacaoEstoque: {tipo}')
        if origem not in self.ORIGEM_CHOICES:
            raise ValueError(f'origem inválida para MovimentacaoEstoque: {origem}')
        self.produto_id = int(produto_id)
        self.tipo = tipo
        self.origem = origem
        self.quantidade = int(quantidade)
        self.quantidade_anterior = int(quantidade_anterior)
        self.quantidade_nova = int(quantidade_nova)
        self.usuario_id = int(usuario_id)
        self.observacao = observacao or ''
        self.pedido_local_id = int(pedido_local_id) if pedido_local_id else None
        self.created_at = datetime.now(timezone.utc)


class EstoqueReserva(Base):
    """Stock reservation model"""
    __tablename__ = 'loja_fisica_estoque_reserva'

    id = Column(Integer, primary_key=True)
    produto_id = Column(Integer, ForeignKey('core_produto.id'), nullable=False)
    quantidade = Column(Integer, nullable=False)
    mesa_id = Column(Integer, ForeignKey('loja_fisica_mesa.id'), nullable=False)
    usuario_id = Column(Integer, ForeignKey('auth_user.id'), nullable=False)
    status = Column(String(20), default='ativa')
    expira_em = Column(DateTime(timezone=True), nullable=False)
    pedido_local_id = Column(Integer, ForeignKey('loja_fisica_pedido_local.id'), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    produto = relationship('Produto')
    mesa = relationship('Mesa', back_populates='reservas_estoque')
    usuario = relationship('User')
    pedido_local = relationship('PedidoLocal', back_populates='reservas_estoque')

    STATUS_CHOICES = {
        'ativa': 'Ativa',
        'confirmada': 'Confirmada',
        'cancelada': 'Cancelada',
        'expirada': 'Expirada'
    }

    def __str__(self):
        return f"Reserva: {self.produto.nome} x{self.quantidade} - Mesa {self.mesa.nome}"

    def __init__(self, produto_id: int, quantidade: int, mesa_id: int, usuario_id: int, status: str = 'ativa', expira_em=None, pedido_local_id: int = None):
        if status not in self.STATUS_CHOICES:
            raise ValueError(f'status inválido para EstoqueReserva: {status}')
        self.produto_id = int(produto_id)
        self.quantidade = int(quantidade)
        self.mesa_id = int(mesa_id)
        self.usuario_id = int(usuario_id)
        self.status = status
        if expira_em is None:
            raise ValueError('expira_em é obrigatório para EstoqueReserva')
        if expira_em.tzinfo is None:
            expira_em = expira_em.replace(tzinfo=timezone.utc)
        self.expira_em = expira_em
        self.pedido_local_id = int(pedido_local_id) if pedido_local_id else None
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = self.created_at


class Pagamento(Base):
    """Payment model for physical store"""
    __tablename__ = 'loja_fisica_pagamento'

    id = Column(Integer, primary_key=True)
    pedido_id = Column(Integer, ForeignKey('loja_fisica_pedido_local.id'), unique=True, nullable=False)
    metodo = Column(String(20), nullable=False)
    valor_total = Column(Numeric(10, 2), nullable=False)
    valor_recebido = Column(Numeric(10, 2), nullable=True)
    troco = Column(Numeric(10, 2), default=0)
    desconto = Column(Numeric(10, 2), default=0)
    status = Column(String(20), default='pendente')
    observacoes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    pedido = relationship('PedidoLocal', back_populates='pagamento')

    METODO_CHOICES = {
        'dinheiro': 'Dinheiro',
        'cartao_credito': 'Cartão de Crédito',
        'cartao_debito': 'Cartão de Débito',
        'pix': 'PIX',
        'transferencia': 'Transferência'
    }

    STATUS_CHOICES = {
        'pendente': 'Pendente',
        'aprovado': 'Aprovado',
        'recusado': 'Recusado',
        'cancelado': 'Cancelado'
    }

    def __str__(self):
        return f"Pagamento #{self.pedido.numero} - {self.METODO_CHOICES.get(self.metodo, self.metodo)}"

    def __init__(self, pedido_id: int, metodo: str, valor_total, valor_recebido=None, troco=0, desconto=0, status: str = 'pendente', observacoes: str = ''):
        if metodo not in self.METODO_CHOICES:
            raise ValueError(f'metodo inválido para Pagamento: {metodo}')
        if status not in self.STATUS_CHOICES:
            raise ValueError(f'status inválido para Pagamento: {status}')
        self.pedido_id = int(pedido_id)
        self.metodo = metodo
        self.valor_total = valor_total
        self.valor_recebido = valor_recebido
        self.troco = troco
        self.desconto = desconto
        self.status = status
        self.observacoes = observacoes or ''
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = self.created_at

    @staticmethod
    def before_insert(mapper, connection, target):
        if target.valor_recebido and target.metodo == 'dinheiro':
            target.troco = max(Decimal('0'), target.valor_recebido - target.valor_total)

    @staticmethod
    def before_update(mapper, connection, target):
        if target.valor_recebido and target.metodo == 'dinheiro':
            target.troco = max(Decimal('0'), target.valor_recebido - target.valor_total)

event.listen(Pagamento, 'before_insert', Pagamento.before_insert)
event.listen(Pagamento, 'before_update', Pagamento.before_update)


if __name__ == '__main__':
    # Reusar engine/Session do core_models
    from backend.core_models import db, Session, Base as CoreBase
    from backend.user_models import User

    # Criar tabelas
    CoreBase.metadata.create_all(bind=db)

    with Session() as session:
        # Criar/garantir um usuário responsável (usar testuser se existir).
        # Se não existir, tenta usar qualquer usuário já presente; se não houver, cria testuser.
        user = session.query(User).filter_by(username='testuser').first()
        if not user:
            user = session.query(User).first()
            if user:
                logger.info('Usando usuário existente: %s', user.username)
            else:
                # criar um usuário mínimo (reutiliza construtor de User)
                try:
                    user = User(username='testuser', email='testuser@example.com', nome='Usuário Teste', password='senha123')
                    session.add(user)
                    session.commit()
                    logger.info('Usuário de teste criado: testuser')
                except Exception as e:
                    session.rollback()
                    # fallback simples: criar objeto mínimo sem set_password
                    user = User.__new__(User)
                    user.username = 'testuser'
                    user.email = 'testuser@example.com'
                    user.nome = 'Usuário Teste'
                    user.password = 'senha_em_texto'
                    session.add(user)
                    session.commit()
                    logger.info('Usuário de teste criado (fallback): testuser')

        # Criar mesa de exemplo
        mesa = session.query(Mesa).filter_by(nome='Mesa 1').first()
        if not mesa:
            mesa = Mesa(nome='Mesa 1', status='livre', usuario_responsavel_id=(user.id if user else None), capacidade=4, observacoes='')
            session.add(mesa)
            session.commit()
            logger.info('Mesa criada: Mesa 1')

        # Criar pedido local
        pedido = session.query(PedidoLocal).filter_by(numero=1).first()
        if not pedido:
            atendente_id = user.id if getattr(user, 'id', None) is not None else 1
            pedido = PedidoLocal(numero=1, mesa_id=mesa.id, atendente_id=atendente_id, status='pendente', total=0, observacoes='')
            session.add(pedido)
            session.commit()
            logger.info('PedidoLocal criado: 1')

        # Garantir produto de exemplo (usando core Produto existente)
        produto = session.query(Produto).filter_by(codigo='CERV-PIL-001').first()
        if not produto:
            logger.info('Produto CERV-PIL-001 não encontrado — execute core_models.py/online_models.py para criar.')
        else:
            # Criar item do pedido local
            item = session.query(ItemPedidoLocal).filter_by(pedido_id=pedido.id, produto_id=produto.id).first()
            if not item:
                item = ItemPedidoLocal(pedido_id=pedido.id, produto_id=produto.id, nome=produto.nome, quantidade=2, preco_unitario=produto.venda, subtotal=produto.venda * 2)
                session.add(item)
                pedido.total = item.subtotal
                session.commit()
                logger.info('ItemPedidoLocal criado')

            # Criar movimentação de estoque de exemplo
            mov = session.query(MovimentacaoEstoque).filter_by(produto_id=produto.id, quantidade=-2).first()
            if not mov:
                mov = MovimentacaoEstoque(produto_id=produto.id, tipo='saida', origem='venda_fisica', quantidade= -2, quantidade_anterior=produto.estoque, quantidade_nova=(produto.estoque - 2), usuario_id=(user.id if user else None), observacao='Venda na mesa', pedido_local_id=pedido.id)
                session.add(mov)
                # Atualizar estoque no produto
                produto.estoque = produto.estoque - 2
                session.commit()
                logger.info('MovimentacaoEstoque criada e estoque atualizado')

            # Criar reserva de estoque de exemplo
            reserva = session.query(EstoqueReserva).filter_by(produto_id=produto.id, mesa_id=mesa.id).first()
            if not reserva:
                from datetime import timedelta
                reserva = EstoqueReserva(produto_id=produto.id, quantidade=1, mesa_id=mesa.id, usuario_id=(user.id if user else None), status='ativa', expira_em=datetime.now(timezone.utc) + timedelta(minutes=30), pedido_local_id=pedido.id)
                session.add(reserva)
                session.commit()
                logger.info('EstoqueReserva criada')

            # Criar pagamento de exemplo
            pag = session.query(Pagamento).filter_by(pedido_id=pedido.id).first()
            if not pag:
                pag = Pagamento(pedido_id=pedido.id, metodo='pix', valor_total=pedido.total, valor_recebido=pedido.total, troco=0, desconto=0, status='aprovado')
                session.add(pag)
                session.commit()
                logger.info('Pagamento criado')

        # Resumo final
        mesas = session.query(Mesa).count()
        pedidos = session.query(PedidoLocal).count()
        itens = session.query(ItemPedidoLocal).count()
        movs = session.query(MovimentacaoEstoque).count()
        reservas = session.query(EstoqueReserva).count()
        pagamentos = session.query(Pagamento).count()
    logger.info('Mesas: %s | Pedidos: %s | Itens: %s | Mov: %s | Reservas: %s | Pagamentos: %s', mesas, pedidos, itens, movs, reservas, pagamentos)
