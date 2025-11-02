"""
Modelos core convertidos de Django para SQLAlchemy:
- Empresa
- NotaFiscal
- Categoria
- Produto

Usa o mesmo arquivo SQLite `bancodados.db` para conveniência.
"""

from sqlalchemy import (
    create_engine, Column, Integer, String, Text, DateTime, Date, Boolean,
    ForeignKey, Numeric, UniqueConstraint
)
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from sqlalchemy.sql import func
import enum

import os
from backend.logging_config import logger

# Usa DATABASE_URL se definido, senão fallback para sqlite local
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///bancodados.db')

# Se for sqlite, é recomendado passar check_same_thread=False para multi-thread
connect_args = {}
if DATABASE_URL.startswith('sqlite'):
    connect_args = {"connect_args": {"check_same_thread": False}}

# Usa o mesmo engine do projeto
db = create_engine(DATABASE_URL, **connect_args)
Session = sessionmaker(bind=db)
Base = declarative_base()

class EmpresaStatus(enum.Enum):
    ativa = 'ativa'
    inativa = 'inativa'
    suspensa = 'suspensa'

class Empresa(Base):
    __tablename__ = 'core_empresa'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(200), nullable=False)
    endereco = Column(Text, nullable=False)
    telefone = Column(String(20), nullable=False)
    email = Column(String(255), nullable=False)
    cnpj = Column(String(18), unique=True, nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    status = Column(String(20), nullable=False, default=EmpresaStatus.ativa.value)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relacionamentos
    notas_fiscais = relationship('NotaFiscal', back_populates='empresa', cascade='all, delete-orphan')
    produtos = relationship('Produto', back_populates='empresa', cascade='all, delete-orphan')

    def __repr__(self):
        return f"Empresa(id={self.id}, nome={self.nome})"

    def __str__(self):
        return self.nome

class NotaFiscal(Base):
    __tablename__ = 'core_nota_fiscal'
    __table_args__ = (
        UniqueConstraint('empresa_id', 'serie', 'numero', name='uix_empresa_serie_numero'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(Integer, ForeignKey('core_empresa.id', ondelete='CASCADE'), nullable=False)
    serie = Column(String(10), default='1')
    numero = Column(String(20), nullable=False)
    descricao = Column(Text, nullable=False)
    data = Column(Date, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    empresa = relationship('Empresa', back_populates='notas_fiscais')

    def __repr__(self):
        return f"NotaFiscal(id={self.id}, numero={self.numero}, empresa_id={self.empresa_id})"

    def __str__(self):
        return f"NF {self.numero} - {self.empresa.nome if self.empresa else 'N/A'}"

class Categoria(Base):
    __tablename__ = 'core_categoria'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(100), unique=True, nullable=False)
    descricao = Column(Text, nullable=True)
    ativa = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    produtos = relationship('Produto', back_populates='categoria', cascade='all, delete-orphan')

    def __repr__(self):
        return f"Categoria(id={self.id}, nome={self.nome})"

    def __str__(self):
        return self.nome

class Produto(Base):
    __tablename__ = 'core_produto'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(200), nullable=False)
    categoria_id = Column(Integer, ForeignKey('core_categoria.id', ondelete='CASCADE'), nullable=False)
    empresa_id = Column(Integer, ForeignKey('core_empresa.id', ondelete='CASCADE'), nullable=False)
    descricao = Column(Text, nullable=False)
    custo = Column(Numeric(10, 2), nullable=False)
    venda = Column(Numeric(10, 2), nullable=False)
    codigo = Column(String(50), unique=True, nullable=False)
    estoque = Column(Integer, default=0)
    disponivel = Column(Boolean, default=True)
    imagem = Column(String(500), nullable=True)
    slug = Column(String(255), unique=True, nullable=False)

    # Beer-specific fields
    style = Column(String(100), nullable=True)
    abv = Column(String(20), nullable=True)
    ibu = Column(Integer, nullable=True)
    rating = Column(Numeric(3, 2), default=0.0)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    categoria = relationship('Categoria', back_populates='produtos')
    empresa = relationship('Empresa', back_populates='produtos')

    def __repr__(self):
        return f"Produto(id={self.id}, nome={self.nome}, codigo={self.codigo})"

    def __str__(self):
        return self.nome

    @property
    def price(self):
        return float(self.venda)

    @property
    def inStock(self):
        return bool(self.disponivel and (self.estoque or 0) > 0)


def list_all_produtos(session):
    """Lista todos os produtos com detalhes completos: categoria e empresa."""
    produtos = session.query(Produto).all()
    if not produtos:
        logger.info('Nenhum produto encontrado.')
        return
    logger.info('\nLista completa de produtos:')
    for p in produtos:
        categoria = p.categoria.nome if p.categoria else 'N/A'
        empresa = p.empresa.nome if p.empresa else 'N/A'
        logger.info('---')
        logger.info('ID: %s', p.id)
        logger.info('Nome: %s', p.nome)
        logger.info('Código: %s', p.codigo)
        logger.info('Categoria: %s', categoria)
        logger.info('Empresa: %s', empresa)
        logger.info('Descrição: %s', p.descricao)
        logger.info('Preço venda: %.2f', float(p.venda))
        logger.info('Preço custo: %.2f', float(p.custo))
        logger.info('Estoque: %s', p.estoque)
        logger.info('Disponível: %s', p.disponivel)
        logger.info('Imagem: %s', p.imagem)
        logger.info('Slug: %s', p.slug)
        logger.info('Style: %s | ABV: %s | IBU: %s | Rating: %s', p.style, p.abv, p.ibu, p.rating)


def list_all_categorias(session):
    categorias = session.query(Categoria).all()
    if not categorias:
        logger.info('\nNenhuma categoria encontrada.')
        return
    logger.info('\nLista de categorias:')
    for c in categorias:
        logger.info('---')
        logger.info('ID: %s | Nome: %s | Descrição: %s | Ativa: %s', c.id, c.nome, c.descricao, c.ativa)


def list_all_empresas(session):
    empresas = session.query(Empresa).all()
    if not empresas:
        logger.info('\nNenhuma empresa encontrada.')
        return
    logger.info('\nLista de empresas:')
    for e in empresas:
        logger.info('---')
        logger.info('ID: %s | Nome: %s | CNPJ: %s | Email: %s | Telefone: %s | Slug: %s', e.id, e.nome, e.cnpj, e.email, e.telefone, e.slug)


def list_all_notas(session):
    notas = session.query(NotaFiscal).all()
    if not notas:
        logger.info('\nNenhuma nota fiscal encontrada.')
        return
    logger.info('\nLista de notas fiscais:')
    for n in notas:
        empresa = n.empresa.nome if n.empresa else 'N/A'
        logger.info('---')
        logger.info('ID: %s | Empresa: %s | Série: %s | Número: %s | Data: %s | Descrição: %s', n.id, empresa, n.serie, n.numero, n.data, n.descricao)

# Nota: não chamar create_all aqui no import, para evitar execução prematura
# A criação das tabelas será feita explicitamente pela aplicação no startup

if __name__ == '__main__':
    # Exemplo rápido de criação e verificação (idempotente)
    with Session() as session:
        # Categoria: criar somente se não existir
        cat = session.query(Categoria).filter_by(nome='Bebidas').first()
        if not cat:
            cat = Categoria(nome='Bebidas', descricao='Bebidas em geral')
            session.add(cat)
            session.commit()  # commit para obter cat.id
            logger.info(f"Categoria criada: {cat}")
        else:
            logger.info(f"Categoria existente: {cat}")

        # Empresa: buscar por CNPJ (único) antes de criar
        emp = session.query(Empresa).filter_by(cnpj='12.345.678/0001-90').first()
        if not emp:
            emp = Empresa(
                nome='Cervejaria X',
                endereco='Rua A, 123',
                telefone='99999-9999',
                email='contato@cervejariax.com',
                cnpj='12.345.678/0001-90',
                slug='cervejaria-x'
            )
            session.add(emp)
            session.commit()  # commit para obter emp.id
            logger.info(f"Empresa criada: {emp}")
        else:
            logger.info(f"Empresa existente: {emp}")

        # Produto: criar somente se não existir (por código)
        prod = session.query(Produto).filter_by(codigo='CERV-PIL-001').first()
        if not prod:
            prod = Produto(
                nome='Cerveja Pilsen',
                categoria_id=cat.id,
                empresa_id=emp.id,
                descricao='Pilsen leve',
                custo=2.5,
                venda=5.0,
                codigo='CERV-PIL-001',
                estoque=100,
                disponivel=True,
                imagem=None,
                slug='cerveja-pilsen'
            )
            session.add(prod)
            session.commit()
            logger.info(f"Produto criado: {prod}")
        else:
            logger.info(f"Produto existente: {prod}")

        # Nota Fiscal: criar um exemplo idempotente (empresa, serie, numero)
        nota = session.query(NotaFiscal).filter_by(empresa_id=emp.id, serie='1', numero='0001').first()
        if not nota:
            from datetime import date
            nota = NotaFiscal(
                empresa_id=emp.id,
                serie='1',
                numero='0001',
                descricao='Nota fiscal de teste',
                data=date.today()
            )
            session.add(nota)
            session.commit()
            logger.info(f"Nota fiscal criada: {nota}")
        else:
            logger.info(f"Nota fiscal existente: {nota}")

        logger.info('OK - tabelas e entradas de exemplo criadas (idempotente)')

    # Listar todos os produtos com detalhes dentro de uma sessão
    with Session() as s:
        list_all_produtos(s)
        # Listar categorias, empresas e notas fiscais (se houver)
        list_all_categorias(s)
        list_all_empresas(s)
        list_all_notas(s)