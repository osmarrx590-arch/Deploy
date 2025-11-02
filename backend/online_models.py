from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import (
    Column, Integer, String, ForeignKey, DateTime, Text, Numeric, Boolean, UniqueConstraint
)
from sqlalchemy.orm import relationship
from backend.core_models import Base, Produto
from backend.user_models import User


class Favorito(Base):
    __tablename__ = 'loja_online_favorito'
    __table_args__ = (UniqueConstraint('user_id', 'produto_id', name='uix_user_produto_favorito'),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('auth_user.id', ondelete='CASCADE'), nullable=False)
    produto_id = Column(Integer, ForeignKey('core_produto.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship('User', backref='favoritos')
    produto = relationship('Produto')

    def __str__(self):
        return f"{self.user.nome} - {self.produto.nome}"

    def __init__(self, user_id: int, produto_id: int, created_at=None):
        if not user_id or not produto_id:
            raise ValueError('user_id e produto_id são obrigatórios para Favorito')
        self.user_id = int(user_id)
        self.produto_id = int(produto_id)
        if created_at is None:
            self.created_at = datetime.now(timezone.utc)
        else:
            # ensure timezone-aware
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            self.created_at = created_at


class Avaliacao(Base):
    __tablename__ = 'loja_online_avaliacao'
    __table_args__ = (UniqueConstraint('user_id', 'produto_id', name='uix_user_produto_avaliacao'),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('auth_user.id', ondelete='CASCADE'), nullable=False)
    produto_id = Column(Integer, ForeignKey('core_produto.id', ondelete='CASCADE'), nullable=False)
    rating = Column(Integer, nullable=False)
    comentario = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship('User', backref='avaliacoes')
    produto = relationship('Produto', backref='avaliacoes')

    def __str__(self):
        return f"{self.produto.nome} - {self.rating} estrelas"

    def __init__(self, user_id: int, produto_id: int, rating: int, comentario: str = None, created_at=None, updated_at=None):
        if rating is None or not (1 <= int(rating) <= 5):
            raise ValueError('rating deve ser inteiro entre 1 e 5')
        self.user_id = int(user_id)
        self.produto_id = int(produto_id)
        self.rating = int(rating)
        self.comentario = comentario or ''
        if created_at is None:
            self.created_at = datetime.now(timezone.utc)
        else:
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            self.created_at = created_at
        if updated_at is None:
            self.updated_at = self.created_at
        else:
            if updated_at.tzinfo is None:
                updated_at = updated_at.replace(tzinfo=timezone.utc)
            self.updated_at = updated_at


class PedidoOnline(Base):
    __tablename__ = 'loja_online_pedido'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('auth_user.id', ondelete='CASCADE'), nullable=False)
    numero = Column(String(20), unique=True, nullable=False)
    status = Column(String(20), default='pendente')
    metodo_pagamento = Column(String(20), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)
    desconto = Column(Numeric(10, 2), default=0)
    total = Column(Numeric(10, 2), nullable=False)
    # Campos opcionais para integração de pagamento (Mercado Pago, Stripe, etc.)
    payment_provider = Column(String(50), nullable=True)
    payment_id = Column(String(200), nullable=True)
    payment_status = Column(String(50), nullable=True)
    # fim dos campos para integração de pagamento
    
    nome_cliente = Column(String(200), nullable=False)

    endereco_cep = Column(String(10), nullable=True)
    endereco_rua = Column(String(200), nullable=True)
    endereco_numero = Column(String(20), nullable=True)
    endereco_complemento = Column(String(100), nullable=True)
    endereco_bairro = Column(String(100), nullable=True)
    endereco_cidade = Column(String(100), nullable=True)
    endereco_estado = Column(String(2), nullable=True)

    observacoes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship('User', backref='pedidos_online')
    itens = relationship('ItemPedidoOnline', back_populates='pedido')

    STATUS_CHOICES = {
        'pendente': 'Pendente',
        'confirmado': 'Confirmado',
        'em_preparo': 'Em Preparo',
        'a_caminho': 'A Caminho',
        'entregue': 'Entregue',
        'cancelado': 'Cancelado'
    }

    PAYMENT_CHOICES = {
        'cartao_credito': 'Cartão de Crédito',
        'cartao_debito': 'Cartão de Débito',
        'pix': 'PIX',
        'dinheiro': 'Dinheiro',
        'transferencia': 'Transferência'
    }

    def __str__(self):
        return f"Pedido #{self.numero} - {self.nome_cliente}"

    def __init__(self, user_id: int, numero: str, status: str, metodo_pagamento: str, subtotal, desconto=0, total=None, nome_cliente: str = '', endereco_cep: str = '', endereco_rua: str = '', endereco_numero: str = '', endereco_complemento: str = '', endereco_bairro: str = '', endereco_cidade: str = '', endereco_estado: str = '', observacoes: str = '', created_at=None, updated_at=None):
        if status not in self.STATUS_CHOICES:
            raise ValueError(f'status inválido: {status}')
        if metodo_pagamento not in self.PAYMENT_CHOICES:
            raise ValueError(f'metodo_pagamento inválido: {metodo_pagamento}')
        self.user_id = int(user_id)
        self.numero = str(numero)
        self.status = status
        self.metodo_pagamento = metodo_pagamento
        self.subtotal = subtotal if subtotal is not None else 0
        self.desconto = desconto or 0
        self.total = total if total is not None else (self.subtotal - self.desconto)
        self.nome_cliente = nome_cliente
        self.endereco_cep = endereco_cep
        self.endereco_rua = endereco_rua
        self.endereco_numero = endereco_numero
        self.endereco_complemento = endereco_complemento
        self.endereco_bairro = endereco_bairro
        self.endereco_cidade = endereco_cidade
        self.endereco_estado = endereco_estado
        self.observacoes = observacoes or ''
        if created_at is None:
            self.created_at = datetime.now(timezone.utc)
        else:
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            self.created_at = created_at
        if updated_at is None:
            self.updated_at = self.created_at
        else:
            if updated_at.tzinfo is None:
                updated_at = updated_at.replace(tzinfo=timezone.utc)
            self.updated_at = updated_at


class ItemPedidoOnline(Base):
    __tablename__ = 'loja_online_item_pedido'

    id = Column(Integer, primary_key=True, autoincrement=True)
    pedido_id = Column(Integer, ForeignKey('loja_online_pedido.id', ondelete='CASCADE'), nullable=False)
    produto_id = Column(Integer, ForeignKey('core_produto.id', ondelete='CASCADE'), nullable=False)
    nome = Column(String(200), nullable=False)
    quantidade = Column(Integer, nullable=False)
    preco_unitario = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)

    pedido = relationship('PedidoOnline', back_populates='itens')
    produto = relationship('Produto')

    def __str__(self):
        return f"{self.nome} x{self.quantidade}"

    @staticmethod
    def before_insert(mapper, connection, target):
        target.subtotal = target.quantidade * target.preco_unitario

    @staticmethod
    def before_update(mapper, connection, target):
        target.subtotal = target.quantidade * target.preco_unitario

    def __init__(self, pedido_id: int, produto_id: int, nome: str, quantidade: int, preco_unitario, subtotal=None):
        if int(quantidade) <= 0:
            raise ValueError('quantidade deve ser > 0')
        self.pedido_id = int(pedido_id)
        self.produto_id = int(produto_id)
        self.nome = nome
        self.quantidade = int(quantidade)
        self.preco_unitario = preco_unitario
        self.subtotal = subtotal if subtotal is not None else (self.quantidade * self.preco_unitario)


from sqlalchemy import event
event.listen(ItemPedidoOnline, 'before_insert', ItemPedidoOnline.before_insert)
event.listen(ItemPedidoOnline, 'before_update', ItemPedidoOnline.before_update)


class Cupom(Base):
    __tablename__ = 'loja_online_cupom'

    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo = Column(String(50), unique=True, nullable=False)
    nome = Column(String(100), nullable=False)
    tipo = Column(String(20), nullable=False)
    valor = Column(Numeric(10, 2), nullable=False)
    valor_minimo = Column(Numeric(10, 2), default=0)
    ativo = Column(Boolean, default=True)
    data_inicio = Column(DateTime, nullable=False)
    data_fim = Column(DateTime, nullable=False)
    uso_maximo = Column(Integer, default=1)
    uso_atual = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    TIPO_CHOICES = {
        'percentual': 'Percentual',
        'valor_fixo': 'Valor Fixo'
    }

    def __str__(self):
        return f"{self.codigo} - {self.nome}"

    @property
    def is_valid(self):
        now = datetime.now(timezone.utc)
        return (self.ativo and self.data_inicio <= now <= self.data_fim and self.uso_atual < self.uso_maximo)

    def __init__(self, codigo: str, nome: str, tipo: str, valor, data_inicio, data_fim, valor_minimo=0, ativo=True, uso_maximo=1, uso_atual=0, created_at=None):
        if tipo not in self.TIPO_CHOICES:
            raise ValueError(f'tipo de cupom inválido: {tipo}')
        if data_inicio.tzinfo is None:
            data_inicio = data_inicio.replace(tzinfo=timezone.utc)
        if data_fim.tzinfo is None:
            data_fim = data_fim.replace(tzinfo=timezone.utc)
        if data_inicio > data_fim:
            raise ValueError('data_inicio deve ser anterior ou igual a data_fim')
        self.codigo = codigo
        self.nome = nome
        self.tipo = tipo
        self.valor = valor
        self.valor_minimo = valor_minimo
        self.ativo = ativo
        self.data_inicio = data_inicio
        self.data_fim = data_fim
        self.uso_maximo = int(uso_maximo)
        self.uso_atual = int(uso_atual)
        if created_at is None:
            self.created_at = datetime.now(timezone.utc)
        else:
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            self.created_at = created_at


if __name__ == '__main__':
    # Importa o engine/Session do core_models para reutilizar o mesmo banco
    from backend.core_models import db, Session, Base as CoreBase

    # Cria as tabelas deste módulo (e as do core se ainda não existirem)
    CoreBase.metadata.create_all(bind=db)

    # Exemplo idempotente: contar registros e criar um cupom simples se não existir
    from backend.logging_config import logger
    with Session() as session:
        # Contagens básicas
        fav_count = session.query(Favorito).count()
        aval_count = session.query(Avaliacao).count()
        pedido_count = session.query(PedidoOnline).count()
        cupom_count = session.query(Cupom).count()
        logger.info('Favoritos: %s | Avaliações: %s | Pedidos: %s | Cupons: %s', fav_count, aval_count, pedido_count, cupom_count)

        # Criar um cupom de exemplo apenas se não existir
        example = session.query(Cupom).filter_by(codigo='BOASVINDAS').first()
        if not example:
            from datetime import timedelta
            now = datetime.now(timezone.utc)
            example = Cupom(
                codigo='BOASVINDAS',
                nome='Cupom Boas Vindas',
                tipo='percentual',
                valor=10,
                valor_minimo=0,
                ativo=True,
                data_inicio=now - timedelta(days=1),
                data_fim=now + timedelta(days=30),
                uso_maximo=100,
                uso_atual=0
            )
            session.add(example)
            session.commit()
            logger.info('Cupom de exemplo criado: BOASVINDAS')
        else:
            logger.info('Cupom BOASVINDAS já existe')

        # --- Inserção de dados de exemplo: User, Produto (se necessário), Pedido, Item, Avaliação, Favorito
        # Criar/garantir usuário de teste
        user = session.query(User).filter_by(username='testuser').first()
        if not user:
            try:
                user = User(username='testuser', email='testuser@example.com', nome='Usuário Teste', password='senha123')
                session.add(user)
                session.commit()
                logger.info('Usuário de teste criado: testuser')
            except Exception as e:
                session.rollback()
                logger.exception('Falha ao criar usuário via User.__init__(): %s', e)
                # Tentar criar um usuário mínimo sem usar set_password (fallback)
                user = User.__new__(User)
                user.username = 'testuser'
                user.email = 'testuser@example.com'
                user.nome = 'Usuário Teste'
                user.password = 'senha_em_texto'  # warning: não é seguro, somente para teste local
                session.add(user)
                session.commit()
                logger.info('Usuário de teste criado (fallback): testuser')

        # Garantir produto de exemplo
        prod = session.query(Produto).filter_by(codigo='CERV-PIL-001').first()
        if not prod:
            # Criar categoria/empresa se necessário
            from backend.core_models import Categoria, Empresa
            cat = session.query(Categoria).filter_by(nome='Bebidas').first()
            if not cat:
                cat = Categoria(nome='Bebidas', descricao='Bebidas em geral')
                session.add(cat)
                session.commit()
            emp = session.query(Empresa).first()
            if not emp:
                emp = Empresa(nome='Empresa X', endereco='-', telefone='-', email='x@example.com', cnpj='00.000.000/0001-00', slug='empresa-x')
                session.add(emp)
                session.commit()
            prod = Produto(nome='Cerveja Pilsen', categoria_id=cat.id, empresa_id=emp.id, descricao='Pilsen leve', custo=2.5, venda=5.0, codigo='CERV-PIL-001', estoque=100, disponivel=True, imagem=None, slug='cerveja-pilsen')
            session.add(prod)
            session.commit()
            logger.info('Produto de exemplo criado: CERV-PIL-001')

        # Criar um pedido online de exemplo
        from datetime import timedelta
        numero = f"ON{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        pedido = PedidoOnline(user_id=user.id, numero=numero, status='pendente', metodo_pagamento='pix', subtotal=0, desconto=0, total=0, nome_cliente=user.nome, endereco_cep='00000-000', endereco_rua='Rua Teste', endereco_numero='1', endereco_bairro='Centro', endereco_cidade='Cidade', endereco_estado='ST', observacoes='')
        session.add(pedido)
        session.commit()
        logger.info('Pedido criado: %s (id=%s)', pedido.numero, pedido.id)

        # Criar item do pedido
        item = ItemPedidoOnline(pedido_id=pedido.id, produto_id=prod.id, nome=prod.nome, quantidade=2, preco_unitario=prod.venda, subtotal=prod.venda * 2)
        session.add(item)
        # Atualizar valores do pedido
        pedido.subtotal = item.subtotal
        pedido.total = pedido.subtotal - (pedido.desconto or 0)
        session.commit()
        logger.info('Item criado: %s x%s (subtotal=%s)', item.nome, item.quantidade, item.subtotal)

        # Criar avaliação se não existir
        aval = session.query(Avaliacao).filter_by(user_id=user.id, produto_id=prod.id).first()
        if not aval:
            aval = Avaliacao(user_id=user.id, produto_id=prod.id, rating=5, comentario='Excelente!')
            session.add(aval)
            session.commit()
            logger.info('Avaliação criada: 5 estrelas')

        # Criar favorito se não existir
        fav = session.query(Favorito).filter_by(user_id=user.id, produto_id=prod.id).first()
        if not fav:
            fav = Favorito(user_id=user.id, produto_id=prod.id)
            session.add(fav)
            session.commit()
            logger.info('Favorito criado')
