# Script de teste para validar add_item_to_pedido
from backend.core_models import db, Session, Base
from backend.fisica_models import Mesa, Produto
from backend.fisica_views import create_mesa, create_pedido_local, add_item_to_pedido
from backend.logging_config import logger

# Criar tabelas
Base.metadata.create_all(bind=db)

# Preparar dados
with Session() as s:
    # criar produto de teste se não existir
    prod = s.query(Produto).filter_by(codigo='TEST-PROD-001').first()
    if not prod:
        # categoria and empresa are required by Produto constructor in core_models.py; attempt minimal creation
        from backend.core_models import Categoria, Empresa
        cat = s.query(Categoria).filter_by(nome='TestCat').first()
        if not cat:
            cat = Categoria(nome='TestCat', descricao='Categoria de teste')
            s.add(cat)
            s.commit()
        emp = s.query(Empresa).filter_by(cnpj='00.000.000/0000-00').first()
        if not emp:
            emp = Empresa(nome='TestEmp', endereco='', telefone='', email='test@example.com', cnpj='00.000.000/0000-00', slug='testemp')
            s.add(emp)
            s.commit()
        prod = Produto(nome='Produto Teste', categoria_id=cat.id, empresa_id=emp.id, descricao='desc', custo=1.0, venda=5.0, codigo='TEST-PROD-001', estoque=10, disponivel=True, imagem=None, slug='prod-teste')
        s.add(prod)
        s.commit()
# capturar valores primitivos do produto (evitar DetachedInstanceError)
prod_id = prod.id
prod_venda = float(prod.venda)
prod_nome = prod.nome

# criar mesa e pedido
mesa = create_mesa('Mesa Teste')
# reutilizar pedido se já existir
from backend.fisica_models import PedidoLocal
with Session() as s:
    pedido = s.query(PedidoLocal).filter_by(numero=2001).first()
    if not pedido:
        pedido = create_pedido_local({'numero': 2001, 'mesa_id': mesa.id, 'atendente_id': 1, 'status': 'pendente', 'total': 0, 'observacoes': ''})
    else:
        # garantir que esteja pendente
        if pedido.status != 'pendente':
            pedido.status = 'pendente'
            s.add(pedido)
            s.commit()

# adicionar item uma vez
item1 = add_item_to_pedido(pedido.id, prod_id, prod_nome, 1, prod_venda)
logger.info('Depois 1ª adição -> item: %s %s %s %s', item1.id, item1.produto_id, item1.quantidade, float(item1.subtotal))

# adicionar o mesmo item mais uma vez (deve incrementar quantidade)
item2 = add_item_to_pedido(pedido.id, prod_id, prod_nome, 2, prod_venda)
logger.info('Depois 2ª adição -> item: %s %s %s %s', item2.id, item2.produto_id, item2.quantidade, float(item2.subtotal))

# verificar itens totais no pedido
with Session() as s:
    itens = s.query(type(item2)).filter_by(pedido_id=pedido.id).all()
    logger.info('Itens do pedido:')
    for it in itens:
        logger.info(' - %s %s %s %s', it.id, it.produto_id, it.quantidade, float(it.subtotal))

logger.info('Teste finalizado')
