from backend.core_models import Session
from backend.fisica_models import PedidoLocal, ItemPedidoLocal
from backend.logging_config import logger

mesa_id = 11
with Session() as s:
    pedido = s.query(PedidoLocal).filter_by(mesa_id=mesa_id).order_by(PedidoLocal.created_at.desc()).first()
    if not pedido:
        logger.info('Nenhum pedido encontrado para mesa %s', mesa_id)
    else:
        logger.info('Pedido id=%s status=%s total=%s', pedido.id, pedido.status, float(pedido.total))
        itens = s.query(ItemPedidoLocal).filter_by(pedido_id=pedido.id).all()
        logger.info('Total itens: %d', len(itens))
        for it in itens:
            logger.info('%s %s %s %s %s %s %s', it.id, it.pedido_id, it.produto_id, it.nome, it.quantidade, float(it.preco_unitario), float(it.subtotal))
