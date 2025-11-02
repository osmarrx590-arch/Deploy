"""Script idempotente para popular o banco SQLite (bancodados.db) usando SQLAlchemy.

Cria categorias, empresas, produtos, usuário admin, mesas e movimentações de estoque.

Usage:
    python populate_db_sqlalchemy.py

Este script assume que os arquivos `core_models.py`, `fisica_models.py` e `user_models.py`
estão na mesma pasta e expõem `Session`, `Base` e os modelos utilizados.
"""

# executar no powershell
# python d:/Python/Choperia/backend/populate_db_sqlalchemy.py

"""  """
"""
$env:PYTHONPATH = (Get-Location).Path
python .\backend\populate_db_sqlalchemy.py
"""
# populate_db_sqlalchemy.py

from decimal import Decimal
from datetime import date, datetime, timedelta, timezone
from backend.core_models import Session, Base, db, Categoria, Empresa, Produto, NotaFiscal
from backend.fisica_models import Mesa, MovimentacaoEstoque
from backend.user_models import User, UserType
from backend.logging_config import logger

DEFAULT_CATEGORIES = [
    "BEBIDA", "COMIDA", "LANCHE", "SUCO", "TAPIOCA",
    "BALDE", "CERVEJA", "SOBREMESA", "PIZZA", "MARMITEX", "OUTROS"
]

EMPRESAS_DEFAULT = [
    {
        "nome": "Choperia Point do Morro",
        "endereco": "Avenida Cumbica, 784 Vila Gilda 04954-203 Bairro Bom / SP",
        "telefone": "945876323",
        "email": "choperia@example.net",
        "cnpj": "57.851.872/3504-08",
        "slug": "choperia-point-do-morro",
        "nota_fiscal": {"serie": "CHOP-001", "numero": "1001", "descricao": "Nota fiscal inicial", "data": "2025-02-09"}
    },
    {
        "nome": "Choperia do Zé",
        "endereco": "Rua A, 123",
        "telefone": "123456789",
        "email": "choperia@example.com",
        "cnpj": "12345678000100",
        "slug": "choperia-do-ze",
        "nota_fiscal": {"serie": "CHOP-101", "numero": "2351", "descricao": "Nota fiscal inicial", "data": "2025-02-09"}
    },
    {
        "nome": "Bar do João",
        "endereco": "Rua B, 456",
        "telefone": "987654321",
        "email": "joao@exemplo. com",
        "cnpj": "12345678000200",
        "slug": "bar-do-joao",
        "nota_fiscal": {
            "serie": "BAR-001",
            "numero": "2001",
            "descricao": "Nota fiscal inicial",
            "data": "2025-02-09"
        }
    },
]

PRODUTOS_DEFAULT = [
        {
            "nome": "Chopp Pilsen",
            "descricao": "Chopp claro, leve e refrescante com notas sutis de malte",
            "custo": Decimal('8.90'),
            "venda": Decimal('12.90'),
            "codigo": "CHOP-001",
            "estoque": 100,
            "empresa": "Choperia do Zé",
            "categoria": "CERVEJA",
            "imagem": "https://images.unsplash.com/photo-1583744513233-64c7d1aec5c1",
            "disponivel": True
        },
        {
            "nome": "Chopp IPA",
            "descricao": "Chopp aromático com notas cítricas e amargor pronunciado",
            "custo": Decimal('10.90'),
            "venda": Decimal('15.90'),
            "codigo": "CHOP-002",
            "estoque": 80,
            "empresa": "Choperia do Zé",
            "categoria": "CERVEJA",
            "imagem": "https://images.unsplash.com/photo-1584225064785-c62a8b43d148",
            "disponivel": True
        },
        {
            "nome": "Chopp Weiss",
            "descricao": "Chopp de trigo, refrescante com notas de banana e cravo",
            "custo": Decimal('9.90'),
            "venda": Decimal('14.90'),
            "codigo": "CHOP-003",
            "estoque": 75,
            "empresa": "Choperia do Zé",
            "categoria": "CERVEJA",
            "imagem": "https://images.unsplash.com/photo-1584225064432-13f34585bc49",
            "disponivel": True
        },
        {
            "nome": "Chopp Stout",
            "descricao": "Chopp escuro, encorpado com notas de café e chocolate",
            "custo": Decimal('11.90'),
            "venda": Decimal('16.90'),
            "codigo": "CHOP-004",
            "estoque": 60,
            "empresa": "Choperia do Zé",
            "categoria": "CERVEJA",
            "imagem": "https://images.unsplash.com/photo-1584225064784-61ef9a8b2b07",
            "disponivel": True
        },
        {
            "nome": "Chopp Red Ale",
            "descricao": "Chopp vermelho com notas de caramelo e malte torrado",
            "custo": Decimal('10.90'),
            "venda": Decimal('15.90'),
            "codigo": "CHOP-005",
            "estoque": 70,
            "empresa": "Choperia do Zé",
            "categoria": "CERVEJA",
            "imagem": "https://images.unsplash.com/photo-1584225064775-863933c1b5c0",
            "disponivel": True
        },
        {
            "nome": "Porção de Batatas Fritas",
            "descricao": "Batatas fritas crocantes com tempero especial da casa",
            "custo": Decimal('15.90'),
            "venda": Decimal('25.90'),
            "codigo": "POR-001",
            "estoque": 50,
            "empresa": "Choperia do Zé",
            "categoria": "COMIDA",
            "imagem": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877",
            "disponivel": True
        },
        {
            "nome": "Tábua de Frios",
            "descricao": "Seleção de queijos e frios premium",
            "custo": Decimal('45.90'),
            "venda": Decimal('65.90'),
            "codigo": "TAB-001",
            "estoque": 30,
            "empresa": "Choperia do Zé",
            "categoria": "COMIDA",
            "imagem": "https://images.unsplash.com/photo-1625938144755-652e08e359b7",
            "disponivel": True
        },
        {
            "nome": "Isca de Peixe",
            "descricao": "Iscas de peixe empanadas com molho tártaro",
            "custo": Decimal('30.90'),
            "venda": Decimal('45.90'),
            "codigo": "ISC-001",
            "estoque": 40,
            "empresa": "Choperia do Zé",
            "categoria": "COMIDA",
            "imagem": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58",
            "disponivel": True
        },
        {
            "nome": "Pastéis Mistos",
            "descricao": "Mix de pastéis com recheios variados (6 unidades)",
            "custo": Decimal('25.90'),
            "venda": Decimal('35.90'),
            "codigo": "PAS-001",
            "estoque": 45,
            "empresa": "Choperia do Zé",
            "categoria": "COMIDA",
            "imagem": "https://images.unsplash.com/photo-1625938144802-69竊4e359b7",
            "disponivel": True
        },
        {
            "nome": "Tábua de Frios Premium",
            "descricao": "Seleção especial de queijos e frios importados",
            "custo": Decimal('65.90'),
            "venda": Decimal('89.90'),
            "codigo": "TAB-002",
            "estoque": 25,
            "empresa": "Choperia do Zé",
            "categoria": "COMIDA",
            "imagem": "https://images.unsplash.com/photo-1625938144755-652e08e359b7",
            "disponivel": True
        },
        {
            "nome": "Nachos com Guacamole",
            "descricao": "Nachos crocantes com guacamole fresco",
            "custo": Decimal('22.90'),
            "venda": Decimal('32.90'),
            "codigo": "NAC-001",
            "estoque": 35,
            "empresa": "Choperia do Zé",
            "categoria": "COMIDA",
            "imagem": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877",
            "disponivel": True
        },
        {
            "nome": "Bolinho de Bacalhau",
            "descricao": "Bolinhos de bacalhau tradicional português",
            "custo": Decimal('32.90'),
            "venda": Decimal('42.90'),
            "codigo": "BOL-001",
            "estoque": 40,
            "empresa": "Choperia do Zé",
            "categoria": "COMIDA",
            "imagem": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58",
            "disponivel": True
        },
        {
            "nome": "Anéis de Cebola",
            "descricao": "Anéis de cebola empanados e crocantes",
            "custo": Decimal('18.90'),
            "venda": Decimal('28.90'),
            "codigo": "ANE-001",
            "estoque": 45,
            "empresa": "Choperia do Zé",
            "categoria": "COMIDA",
            "imagem": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877",
            "disponivel": True
        },
        {
            "nome": "Refrigerante Cola",
            "descricao": "Refrigerante tipo cola 350ml",
            "custo": Decimal('3.90'),
            "venda": Decimal('6.90'),
            "codigo": "BEB-001",
            "estoque": 200,
            "empresa": "Choperia do Zé",
            "categoria": "BEBIDA",
            "imagem": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97",
            "disponivel": True
        },
        {
            "nome": "Água Mineral",
            "descricao": "Água mineral sem gás 500ml",
            "custo": Decimal('2.50'),
            "venda": Decimal('5.00'),
            "codigo": "BEB-002",
            "estoque": 250,
            "empresa": "Choperia do Zé",
            "categoria": "BEBIDA",
            "imagem": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97",
            "disponivel": True
        },
        {
            "nome": "Suco de Laranja",
            "descricao": "Suco natural de laranja 400ml",
            "custo": Decimal('4.90'),
            "venda": Decimal('8.90'),
            "codigo": "SUC-001",
            "estoque": 100,
            "empresa": "Choperia do Zé",
            "categoria": "SUCO",
            "imagem": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97",
            "disponivel": True
        },
        {
            "nome": "Tapioca de Queijo",
            "descricao": "Tapioca recheada com queijo coalho",
            "custo": Decimal('8.90'),
            "venda": Decimal('14.90'),
            "codigo": "TAP-001",
            "estoque": 60,
            "empresa": "Choperia do Zé",
            "categoria": "TAPIOCA",
            "imagem": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877",
            "disponivel": True
        },
        {
            "nome": "Tapioca de Carne",
            "descricao": "Tapioca recheada com carne seca",
            "custo": Decimal('10.90'),
            "venda": Decimal('16.90'),
            "codigo": "TAP-002",
            "estoque": 55,
            "empresa": "Choperia do Zé",
            "categoria": "TAPIOCA",
            "imagem": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877",
            "disponivel": True
        },
        {
            "nome": "Pizza Margherita",
            "descricao": "Pizza com molho de tomate, mussarela e manjericão",
            "custo": Decimal('25.90'),
            "venda": Decimal('39.90'),
            "codigo": "PIZ-001",
            "estoque": 40,
            "empresa": "Choperia do Zé",
            "categoria": "PIZZA",
            "imagem": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877",
            "disponivel": True
        },
        {
            "nome": "Pizza Calabresa",
            "descricao": "Pizza com calabresa, cebola e mussarela",
            "custo": Decimal('27.90'),
            "venda": Decimal('42.90'),
            "codigo": "PIZ-002",
            "estoque": 35,
            "empresa": "Choperia do Zé",
            "categoria": "PIZZA",
            "imagem": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877",
            "disponivel": True
        },
        {
            "nome": "Marmitex Executiva",
            "descricao": "Arroz, feijão, bife grelhado, salada e farofa",
            "custo": Decimal('15.90'),
            "venda": Decimal('25.90'),
            "codigo": "MAR-001",
            "estoque": 30,
            "empresa": "Choperia do Zé",
            "categoria": "MARMITEX",
            "imagem": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877",
            "disponivel": True
        },
        {
            "nome": "Balde de Cerveja",
            "descricao": "Balde com 6 cervejas long neck",
            "custo": Decimal('45.90'),
            "venda": Decimal('69.90'),
            "codigo": "BAL-001",
            "estoque": 50,
            "empresa": "Choperia do Zé",
            "categoria": "BALDE",
            "imagem": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877",
            "disponivel": True
        },
        {
            "nome": "Pudim de Leite",
            "descricao": "Pudim de leite condensado tradicional",
            "custo": Decimal('8.90'),
            "venda": Decimal('14.90'),
            "codigo": "SOB-001",
            "estoque": 25,
            "empresa": "Choperia do Zé",
            "categoria": "SOBREMESA",
            "imagem": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877",
            "disponivel": True
        },
        {
            "nome": "Petit Gateau",
            "descricao": "Bolo de chocolate com recheio cremoso",
            "custo": Decimal('12.90'),
            "venda": Decimal('19.90'),
            "codigo": "SOB-002",
            "estoque": 20,
            "empresa": "Choperia do Zé",
            "categoria": "SOBREMESA",
            "imagem": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877",
            "disponivel": True
        },
        {
            "nome": "Suco de Abacaxi",
            "descricao": "Suco natural de abacaxi 400ml",
            "custo": Decimal('4.90'),
            "venda": Decimal('8.90'),
            "codigo": "SUC-002",
            "estoque": 90,
            "empresa": "Choperia do Zé",
            "categoria": "SUCO",
            "imagem": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97",
            "disponivel": True
        },
        {
            "nome": "Suco de Maracujá",
            "descricao": "Suco natural de maracujá 400ml",
            "custo": Decimal('4.90'),
            "venda": Decimal('8.90'),
            "codigo": "SUC-003",
            "estoque": 85,
            "empresa": "Choperia do Zé",
            "categoria": "SUCO",
            "imagem": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97",
            "disponivel": True
        },
        {
            "nome": "X-Tudo",
            "descricao": "Hambúrguer completo com tudo que tem direito",
            "custo": Decimal('18.90'),
            "venda": Decimal('28.90'),
            "codigo": "LAN-001",
            "estoque": 40,
            "empresa": "Choperia do Zé",
            "categoria": "LANCHE",
            "imagem": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877",
            "disponivel": True
        },
        {
            "nome": "Hot Dog Especial",
            "descricao": "Cachorro quente com molhos especiais",
            "custo": Decimal('12.90'),
            "venda": Decimal('19.90'),
            "codigo": "LAN-002",
            "estoque": 45,
            "empresa": "Choperia do Zé",
            "categoria": "LANCHE",
            "imagem": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877",
            "disponivel": True
        },
        {
            "nome": "Misto Quente",
            "descricao": "Sanduíche de queijo e presunto na chapa",
            "custo": Decimal('8.90'),
            "venda": Decimal('14.90'),
            "codigo": "LAN-003",
            "estoque": 50,
            "empresa": "Choperia do Zé",
            "categoria": "LANCHE",
            "imagem": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877",
            "disponivel": True
        },
        {
            "nome": "Cerveja Long Neck",
            "descricao": "Cerveja importada long neck 355ml",
            "custo": Decimal('8.90'),
            "venda": Decimal('12.90'),
            "codigo": "CER-001",
            "estoque": 150,
            "empresa": "Choperia do Zé",
            "categoria": "CERVEJA",
            "imagem": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877",
            "disponivel": True
        },
        {
            "nome": "Porção de Calabresa",
            "descricao": "Calabresa acebolada na chapa",
            "custo": Decimal('22.90'),
            "venda": Decimal('32.90'),
            "codigo": "POR-002",
            "estoque": 40,
            "empresa": "Choperia do Zé",
            "categoria": "COMIDA",
            "imagem": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877",
            "disponivel": True
        }
    ]

def create_categories(session):
    for nome in DEFAULT_CATEGORIES:
        cat = session.query(Categoria).filter_by(nome=nome).first()
        if not cat:
            cat = Categoria(nome=nome, descricao=f"Categoria {nome}")
            session.add(cat)
            logger.info(f"Criada categoria: {nome}")
    session.commit()

def create_empresas(session):
    for ed in EMPRESAS_DEFAULT:
        emp = session.query(Empresa).filter_by(cnpj=ed['cnpj']).first()
        if not emp:
            emp = Empresa(nome=ed['nome'], endereco=ed['endereco'], telefone=ed['telefone'], email=ed['email'], cnpj=ed['cnpj'], slug=ed['slug'])
            session.add(emp)
            session.commit()
            nf = ed.get('nota_fiscal')
            if nf:
                nf_obj = NotaFiscal(empresa_id=emp.id, serie=nf['serie'], numero=nf['numero'], descricao=nf['descricao'], data=date.fromisoformat(nf['data']))
                session.add(nf_obj)
                session.commit()
                logger.info(f"Empresa e nota fiscal criadas: {emp.nome}")
        else:
            logger.info(f"Empresa já existe: {emp.nome}")

def create_user_admin(session):
    user = session.query(User).filter_by(username='admin').first()
    if not user:
        user = User(username='admin', email='admin@example.com', nome='Administrador', password='admin123', tipo=UserType.admin)
        user.is_superuser = True
        session.add(user)
        session.commit()
        logger.info('Usuário admin criado: admin')
    else:
        logger.info('Usuário admin já existe')
    # Recarrega o usuário pelo username no contexto da sessão e retorna o id
    user_obj = session.query(User).filter_by(username='admin').first()
    return user_obj.id if user_obj else None

def create_produtos(session, usuario_id):
    for pd in PRODUTOS_DEFAULT:
        cat = session.query(Categoria).filter_by(nome=pd['categoria']).first()
        emp = session.query(Empresa).filter_by(nome=pd['empresa']).first()
        if not cat or not emp:
            logger.info(f"Pular produto {pd['nome']}: categoria ou empresa ausente")
            continue
        slug = f"{pd['nome'].lower().replace(' ', '-')[:200]}"
        prod = session.query(Produto).filter_by(codigo=pd['codigo']).first()
        if not prod:
            prod = Produto(nome=pd['nome'], categoria_id=cat.id, empresa_id=emp.id, descricao=pd['descricao'], custo=pd['custo'], venda=pd['venda'], codigo=pd['codigo'], estoque=pd['estoque'], disponivel=pd['disponivel'], imagem=pd['imagem'], slug=slug)
            session.add(prod)
            session.commit()
            logger.info(f"Produto criado: {prod.nome}")
            # criar movimentacao de entrada
            mov = MovimentacaoEstoque(produto_id=prod.id, tipo='entrada', origem='compra', quantidade=prod.estoque, quantidade_anterior=0, quantidade_nova=prod.estoque, usuario_id=usuario_id if usuario_id else 1, observacao='Entrada inicial')
            session.add(mov)
            session.commit()
            logger.info('Movimentacao de estoque criada')
        else:
            logger.info(f"Produto já existe: {prod.nome}")

def create_mesas(session, usuario_id=None):
    # cria mesas 01..10 e alguns balcões
    for i in range(1, 11): # percorre de 1 a 10
        nome = str(i).zfill(2) # Formata com dois dígitos ex: 01, 02, ..., 10
        mesa = session.query(Mesa).filter_by(nome=nome).first()
        if not mesa:
            mesa = Mesa(nome=nome, status='livre', usuario_responsavel_id=usuario_id, capacidade=4, observacoes='')
            session.add(mesa)
            logger.info(f"Mesa criada: {nome} (responsavel_id={usuario_id})")
    for nome in ['Balcão 1', 'Balcão 2', 'Entrega 1']:
        mesa = session.query(Mesa).filter_by(nome=nome).first()
        if not mesa:
            mesa = Mesa(nome=nome, status='livre', usuario_responsavel_id=usuario_id, capacidade=1, observacoes='Mesa de balcão')
        session.add(mesa)
        logger.info(f"Mesa criada: {nome} (responsavel_id={usuario_id})")
    session.commit()

def create_users_custom(session):
    """Cria os usuários físicos e online solicitados, se não existirem."""
    users_to_create = [
        # fisica
        {"username": "julia", "email": "julia@gmail.com", "nome": "Julia", "password": "2325*-9+", "tipo": UserType.fisica},
        {"username": "mariana", "email": "mariana@gmail.com", "nome": "Mariana", "password": "2325*-9+", "tipo": UserType.fisica},
        # online
        {"username": "osmar", "email": "osmar@gmail.com", "nome": "Osmar", "password": "2325*-9+", "tipo": UserType.online},
        {"username": "amanda", "email": "amanda@gmail.com", "nome": "Amanda", "password": "2325*-9+", "tipo": UserType.online},
        {"username": "gabriela", "email": "gabriela@gmail.com", "nome": "Gabriela", "password": "2325*-9+", "tipo": UserType.online},
        {"username": "juliana", "email": "juliana@gmail.com", "nome": "Juliana", "password": "2325*-9+", "tipo": UserType.online},
    ]

    created_ids = []
    for u in users_to_create:
        exists = session.query(User).filter((User.username == u['username']) | (User.email == u['email'])).first()
        if exists:
            logger.info(f"Usuário já existe: {exists.username} <{exists.email}>")
            created_ids.append(exists.id)
            continue
        try:
            new_user = User(username=u['username'], email=u['email'], nome=u['nome'], password=u['password'], tipo=u['tipo'])
            # se for admin (nenhum aqui) poderia setar is_superuser
            session.add(new_user)
            session.commit()
            logger.info(f"Usuário criado: {new_user.username} <{new_user.email}> tipo={new_user.tipo}")
            created_ids.append(new_user.id)
        except Exception as e:
            session.rollback()
            logger.exception('Erro ao criar usuário %s: %s', u['username'], e)
    return created_ids

def main():
    # Garante criação das tabelas usando o engine compartilhado (db)
    Base.metadata.create_all(bind=db)
    with Session() as session:
        # Se já houver dados nas tabelas principais, não executa a população completa.
        try:
            totais = {
                'categorias': session.query(Categoria).count(),
                'empresas': session.query(Empresa).count(),
                'produtos': session.query(Produto).count(),
                'mesas': session.query(Mesa).count(),
                'usuarios': session.query(User).count(),
            }
        except Exception:
            # Se alguma tabela não existir ainda, continua com a população (create_all já foi chamada acima)
            totais = { 'categorias': 0, 'empresas': 0, 'produtos': 0, 'mesas': 0, 'usuarios': 0 }

        total_registros = sum(totais.values())
        if total_registros > 0:
            logger.info('Banco já contém dados; pulando populate. Totais: %s', totais)
            # Ainda realiza o backfill de slug se necessário
            try:
                from backend.fisica_models import gerar_slug
                all_mesas = session.query(Mesa).all()
                updated = 0
                for m in all_mesas:
                    if not getattr(m, 'slug', None):
                        m.slug = gerar_slug(m.nome)
                        session.add(m)
                        updated += 1
                if updated > 0:
                    session.commit()
                    logger.info(f'Backfill: slugs gerados para {updated} mesas')
            except Exception as e:
                session.rollback()
                logger.exception('Erro no backfill de slug: %s', e)
            return

        # Sem registros: executa a população idempotente
        create_categories(session)
        create_empresas(session)
        # cria/garante o usuário admin e obtém o id no mesmo contexto da sessão
        usuario_id = create_user_admin(session)
        # cria os usuários físicos e online solicitados
        created_user_ids = create_users_custom(session)
        # se não obteve um usuario_id admin, usa o primeiro criado como fallback
        if not usuario_id and created_user_ids:
            usuario_id = created_user_ids[0]
        create_produtos(session, usuario_id)
        create_mesas(session, usuario_id)
        # Backfill: garantir que todas as mesas tenham slug (usa gerar_slug do modelo)
        try:
            from backend.fisica_models import gerar_slug
            all_mesas = session.query(Mesa).all()
            updated = 0
            for m in all_mesas:
                if not getattr(m, 'slug', None):
                    m.slug = gerar_slug(m.nome)
                    session.add(m)
                    updated += 1
            if updated > 0:
                session.commit()
                logger.info(f'Backfill: slugs gerados para {updated} mesas')
        except Exception as e:
            session.rollback()
            logger.exception('Erro no backfill de slug: %s', e)

if __name__ == '__main__':
    main()
