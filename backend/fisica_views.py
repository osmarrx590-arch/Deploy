"""CRUD utilities for loja_fisica models (Mesa, PedidoLocal, ItemPedidoLocal, MovimentacaoEstoque).
Simple functions intended for scripts/tests or to be wrapped by an HTTP layer.
"""
from typing import Optional, List, Dict, Any
from contextlib import contextmanager
from backend.core_models import Session, Produto
from backend.fisica_models import Mesa, PedidoLocal, ItemPedidoLocal, MovimentacaoEstoque, gerar_slug
from decimal import Decimal
from sqlalchemy import func
from backend.logging_config import logger


@contextmanager
def session_scope():
    session = Session(expire_on_commit=False)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def create_mesa(nome: str, usuario_responsavel_id: Optional[int] = None, capacidade: int = 4, observacoes: str = '') -> Mesa:
    with session_scope() as s:
        mesa = s.query(Mesa).filter_by(nome=nome).first()
        if mesa:
            return mesa
        mesa = Mesa(nome=nome, status='livre', usuario_responsavel_id=usuario_responsavel_id, capacidade=capacidade, observacoes=observacoes)
        s.add(mesa)
        s.flush()
        return mesa


def list_mesas() -> List[Mesa]:
    from sqlalchemy.orm import joinedload
    with Session(expire_on_commit=False) as s:
        # Fazer eager loading dos pedidos e seus itens
        return s.query(Mesa).options(
            joinedload(Mesa.pedidos).joinedload(PedidoLocal.itens)
        ).order_by(Mesa.nome).all()


def update_mesa(mesa_id: int, **fields) -> Optional[Mesa]:
    with session_scope() as s:
        mesa = s.query(Mesa).get(mesa_id)
        if not mesa:
            return None
        for k, v in fields.items():
            if hasattr(mesa, k):
                setattr(mesa, k, v)
        s.add(mesa)
        return mesa


def delete_mesa(mesa_id: int) -> bool:
    with session_scope() as s:
        mesa = s.query(Mesa).get(mesa_id)
        if not mesa:
            return False
        s.delete(mesa)
        return True


# Movimentacoes e pedidos: implementações básicas
def create_pedido_local(data: Dict[str, Any]) -> PedidoLocal:
    from sqlalchemy.exc import IntegrityError
    with session_scope() as s:
        # Se o caller não forneceu 'numero', calcular sequencialmente como max(numero)+1
        # Fazer tentativas em caso de race condition / IntegrityError (concorrência)
        if not data.get('numero'):
            max_num = s.query(func.max(PedidoLocal.numero)).scalar() or 0
            data['numero'] = int(max_num) + 1
        else:
            try:
                data['numero'] = int(data.get('numero'))
            except Exception:
                # fallback: recomputar
                max_num = s.query(func.max(PedidoLocal.numero)).scalar() or 0
                data['numero'] = int(max_num) + 1

        attempts = 0
        while attempts < 5:
            try:
                pedido = PedidoLocal(**data)
                s.add(pedido)
                s.flush()
                return pedido
            except IntegrityError as ie:
                # possivelmente numero duplicado por concorrência; recomputar e tentar novamente
                attempts += 1
                logger.warning(f"[create_pedido_local] IntegrityError ao criar pedido com numero={data.get('numero')}, tentativa={attempts}: {ie}")
                try:
                    s.rollback()
                except Exception:
                    pass
                max_num = s.query(func.max(PedidoLocal.numero)).scalar() or 0
                data['numero'] = int(max_num) + 1
                continue
            except Exception:
                # re-raise outras exceções para fora do contexto
                raise
        # Se falhar após tentativas, raise
        raise RuntimeError('Não foi possível criar PedidoLocal após várias tentativas devido a conflito de número')


def create_item_pedido(data: Dict[str, Any]) -> ItemPedidoLocal:
    with session_scope() as s:
        item = ItemPedidoLocal(**data)
        s.add(item)
        s.flush()
        return item


def create_movimentacao(data: Dict[str, Any]) -> MovimentacaoEstoque:
    with session_scope() as s:
        mov = MovimentacaoEstoque(**data)
        s.add(mov)
        s.flush()
        return mov


def processar_pagamento_mesa(mesa_id: int, pedido_numero: Optional[str], metodo: str, itens: List[Dict[str, Any]], total: float, usuario_id: Optional[int] = None) -> Dict[str, Any]:
    """Processa pagamento para a mesa: cria Pagamento, registra movimentações e finaliza o pedido local.
    Retorna um dict com a mesa atualizada (mesmo formato de api_get_mesa).
    """
    with session_scope() as s:
        # buscar pedido pendente para a mesa
        pedido = s.query(PedidoLocal).filter_by(mesa_id=mesa_id, status='pendente').order_by(PedidoLocal.created_at.desc()).first()
        if not pedido:
            raise ValueError('Pedido pendente não encontrado para esta mesa')

        # Registrar movimentações de estoque (saída) para cada item
        for it in itens:
            try:
                quantidade = int(it.get('quantidade', 0))
                produto_id = int(it.get('produtoId') or it.get('produto_id'))
                # quantidade negativa para movimentação de saída
                mov_data = {
                    'produto_id': produto_id,
                    'tipo': 'saida',
                    'origem': 'venda_fisica',
                    'quantidade': -quantidade,
                    'quantidade_anterior': 0,
                    'quantidade_nova': 0,
                    'usuario_id': usuario_id or 1,
                    'observacao': f'Pagamento mesa {mesa_id} pedido {pedido.id}',
                    'pedido_local_id': pedido.id
                }
                create_movimentacao(mov_data)
            except Exception:
                # continuar mesmo que haja erro em alguma movimentação pontual
                pass

        # criar um registro de Pagamento básico no modelo Pagamento (se existir)
        try:
            from backend.fisica_models import Pagamento
            pagamento = Pagamento(pedido_id=pedido.id, metodo=metodo, valor_total=total, valor_recebido=total, troco=0, desconto=0, status='aprovado')
            s.add(pagamento)
            s.flush()
        except Exception:
            # não é crítico; continuar sem pagamento persistido
            pagamento = None

        # marcar pedido como entregue / finalizado
        pedido.status = 'entregue'
        pedido.total = total
        s.add(pedido)

        # atualizar status da mesa para livre
        mesa = s.query(Mesa).get(mesa_id)
        if mesa:
            mesa.status = 'livre'
            s.add(mesa)

        # limpar reservas de estoque associadas a este pedido (se houver)
        try:
            s.query(MovimentacaoEstoque).filter_by(pedido_local_id=pedido.id).all()
        except Exception:
            pass

    # retornar estrutura similar a api_get_mesa
    with Session(expire_on_commit=False) as s2:
        m = s2.query(Mesa).get(mesa_id)
        if not m:
            return {'id': mesa_id}
        pedidos = sorted(m.pedidos, key=lambda p: getattr(p, 'created_at', 0), reverse=True)
        # escolher o último pedido pendente (se houver)
        last_pedido = next((p for p in pedidos if getattr(p, 'status', None) == 'pendente'), None)
        itens_out = []
        try:
            if last_pedido and getattr(last_pedido, 'itens', None):
                for it in last_pedido.itens:
                    itens_out.append({
                        'id': it.id,
                        'produtoId': it.produto_id,
                        'nome': it.nome,
                        'quantidade': it.quantidade,
                        'precoUnitario': float(it.preco_unitario),
                        'total': float(getattr(it, 'subtotal', it.quantidade * it.preco_unitario)),
                        'mesaId': last_pedido.mesa_id,
                        'status': 'ativo'
                    })
        except Exception:
            itens_out = []

        # se o último pedido pendente não existir, garantir que retorno não mostre itens
        if last_pedido is None:
            return {
                'id': m.id,
                'nome': m.nome,
                'status': (m.status.capitalize() if isinstance(m.status, str) else m.status),
                'pedido': 0,
                'slug': getattr(m, 'slug', None) or gerar_slug(m.nome),
                'itens': []
            }

        return {
            'id': m.id,
            'nome': m.nome,
            'status': (m.status.capitalize() if isinstance(m.status, str) else m.status),
            'pedido': getattr(m, 'pedido', 0) or 0,
            'slug': getattr(m, 'slug', None) or gerar_slug(m.nome),
            'itens': itens_out
        }


def get_pedido_pendente_por_mesa(mesa_id: int) -> Optional[PedidoLocal]:
    """Retorna um PedidoLocal com status 'pendente' para a mesa, se existir."""
    with Session(expire_on_commit=False) as s:
        return s.query(PedidoLocal).filter_by(mesa_id=mesa_id, status='pendente').order_by(PedidoLocal.created_at.desc()).first()


def add_item_to_pedido(pedido_id: int, produto_id: int, nome: str, quantidade: int, preco_unitario) -> ItemPedidoLocal:
    """Adiciona ou atualiza um item no pedido. Se já existir um item com o mesmo produto_id, incrementa a quantidade."""
    with session_scope() as s:
        pedido = s.query(PedidoLocal).get(pedido_id)
        if not pedido:
            raise ValueError('Pedido não encontrado')

        logger.debug(f"[BD] Estado inicial do pedido id={pedido_id}: total={pedido.total}")
        itens_antes = s.query(ItemPedidoLocal).filter_by(pedido_id=pedido.id).all()
        for it in itens_antes:
            logger.debug(f"[BD] Item antes: id={it.id} produto_id={it.produto_id} nome={it.nome} qtd={it.quantidade} preco={it.preco_unitario} subtotal={it.subtotal}")

        # normalizar/validar tipos de entrada
        try:
            produto_id_int = int(produto_id)
        except Exception:
            produto_id_int = produto_id

        try:
            quantidade_int = int(quantidade)
        except Exception:
            raise ValueError('quantidade inválida, deve ser um inteiro')

        # verificar se já existe item com mesmo produto_id
        item_existente = s.query(ItemPedidoLocal).filter_by(pedido_id=pedido.id, produto_id=produto_id_int).first()

        if item_existente:
            logger.debug(f"[BD] Item existente encontrado: id={item_existente.id} produto_id={item_existente.produto_id} nome={item_existente.nome} qtd={item_existente.quantidade} preco={item_existente.preco_unitario} subtotal={item_existente.subtotal}")
            # atualizar quantidade do item existente (garantir int)
            new_qtd = int(item_existente.quantidade or 0) + quantidade_int
            if new_qtd <= 0:
                raise ValueError('quantidade resultante deve ser > 0')
            item_existente.quantidade = new_qtd
            # atualizar subtotal explicitamente (before_update listener cobriria, mas garantimos aqui)
            try:
                item_existente.preco_unitario = item_existente.preco_unitario or preco_unitario
                item_existente.subtotal = item_existente.quantidade * item_existente.preco_unitario
            except Exception:
                # se houver problema com tipos numéricos, converter para Decimal
                item_existente.preco_unitario = Decimal(str(item_existente.preco_unitario)) if item_existente.preco_unitario is not None else Decimal(str(preco_unitario))
                item_existente.subtotal = Decimal(str(item_existente.quantidade)) * Decimal(str(item_existente.preco_unitario))

            s.add(item_existente)
            item = item_existente
        else:
            logger.debug(f"[BD] Nenhum item existente encontrado para produto_id={produto_id_int}, criando novo.")
            # criar novo item (garantir tipos corretos)
            try:
                preco_val = preco_unitario
            except Exception:
                preco_val = Decimal(str(preco_unitario))
            item = ItemPedidoLocal(pedido_id=pedido.id, produto_id=produto_id_int, nome=nome, quantidade=quantidade_int, preco_unitario=preco_val)
            s.add(item)

        try:
            s.flush()
            # garantir que o item reflita valores atualizados do banco
            try:
                s.refresh(item)
            except Exception:
                pass

            # Estado dos itens após flush
            itens_depois = s.query(ItemPedidoLocal).filter_by(pedido_id=pedido.id).all()
            for it in itens_depois:
                logger.debug(f"[BD] Item depois: id={it.id} produto_id={it.produto_id} nome={it.nome} qtd={it.quantidade} preco={it.preco_unitario} subtotal={it.subtotal}")

            # recalcular total do pedido consultando todos os itens
            total = sum([Decimal(str(getattr(it, 'subtotal', 0))) for it in itens_depois], Decimal('0'))
            logger.debug(f"[BD] Novo total do pedido id={pedido_id}: {total}")
            pedido.total = total
            s.add(pedido)
            return item
        except Exception as e:
            # log detalhado para depuração
            import traceback
            logger.exception(f"[fisica_views.add_item_to_pedido] erro ao adicionar item pedido_id={pedido_id} produto_id={produto_id} quantidade={quantidade} preco_unitario={preco_unitario}: {e}")
            traceback.print_exc()
            raise


def remove_item_from_pedido(item_id: int) -> bool:
    """Remove um ItemPedidoLocal e atualiza o total do pedido pai."""
    with session_scope() as s:
        item = s.query(ItemPedidoLocal).get(item_id)
        if not item:
            return False
        pedido_id = item.pedido_id
        pedido = s.query(PedidoLocal).get(pedido_id)
        s.delete(item)
        try:
            s.flush()
            if pedido:
                # recalcular total consultando os itens restantes
                itens = s.query(ItemPedidoLocal).filter_by(pedido_id=pedido_id).all()
                total = sum([Decimal(str(getattr(it, 'subtotal', 0))) for it in itens], Decimal('0'))
                pedido.total = total
                s.add(pedido)
            return True
        except Exception as e:
            import traceback
            logger.exception(f"[fisica_views.remove_item_from_pedido] erro ao remover item_id={item_id}: {e}")
            traceback.print_exc()
            raise


def cancelar_pedido_por_mesa(mesa_id: int) -> bool:
    """Cancela o pedido pendente (status 'pendente') associado à mesa.
    Marca o pedido como 'cancelado' e atualiza o status da mesa para 'livre'.
    Retorna True se um pedido foi encontrado e cancelado, False caso contrário.
    """

    with session_scope() as s:
        # buscar o último pedido associado à mesa (qualquer status)
        pedido = s.query(PedidoLocal).filter_by(mesa_id=mesa_id).order_by(PedidoLocal.created_at.desc()).first()
        if not pedido:
            logger.info(f"[fisica_views.cancelar_pedido_por_mesa] nenhum pedido encontrado para mesa_id={mesa_id}")
            return False

        logger.info(f"[fisica_views.cancelar_pedido_por_mesa] processando cancelamento para pedido id={pedido.id} (status={pedido.status}) mesa_id={mesa_id}")

        # buscar itens do pedido
        itens = s.query(ItemPedidoLocal).filter_by(pedido_id=pedido.id).all()

        # se o pedido ainda estava pendente, precisamos criar movimentações de entrada para restaurar o estoque
        criar_movimentacoes = (getattr(pedido, 'status', None) == 'pendente')

        for it in itens:
            if criar_movimentacoes:
                try:
                    produto = s.query(Produto).get(it.produto_id)
                    quantidade_anterior = produto.estoque if produto and getattr(produto, 'estoque', None) is not None else 0
                    quantidade_nova = quantidade_anterior + int(it.quantidade or 0)

                    # criar movimentação de entrada
                    mov = MovimentacaoEstoque(
                        produto_id=it.produto_id,
                        tipo='entrada',
                        origem='venda_fisica',
                        quantidade=int(it.quantidade or 0),
                        quantidade_anterior=int(quantidade_anterior),
                        quantidade_nova=int(quantidade_nova),
                        usuario_id=getattr(pedido, 'atendente_id', 1) or 1,
                        observacao=f'Cancelamento pedido mesa {mesa_id} pedido {pedido.id}',
                        pedido_local_id=pedido.id
                    )
                    s.add(mov)

                    # atualizar estoque do produto se existir
                    if produto:
                        produto.estoque = int(quantidade_nova)
                        s.add(produto)
                except Exception:
                    # não bloquear cancelamento por erro na movimentação/restauração de estoque
                    pass

            # remover o item do pedido (independente do status anterior)
            try:
                s.delete(it)
            except Exception:
                pass

        # log quantidade final de itens (deve ser 0)
            try:
                remaining = s.query(ItemPedidoLocal).filter_by(pedido_id=pedido.id).count()
                logger.debug(f"[fisica_views.cancelar_pedido_por_mesa] itens restantes para pedido id={pedido.id}: {remaining}")
            except Exception:
                pass

        # marcar pedido como cancelado e zerar total
        pedido.status = 'cancelado'
        try:
            pedido.total = 0
        except Exception:
            pass
        s.add(pedido)

        # atualizar status da mesa para livre
        mesa = s.query(Mesa).get(mesa_id)
        if mesa:
            mesa.status = 'livre'
            try:
                mesa.pedido = 0
            except Exception:
                pass
            s.add(mesa)

    return True


if __name__ == '__main__':
    # garantir que tabelas existam
    from backend.core_models import db, Base as CoreBase
    CoreBase.metadata.create_all(bind=db)
    logger.info('\n=== Demo CRUD')
    m = create_mesa('01', usuario_responsavel_id=None)
    logger.info('Criada mesa: %s %s %s', m.id, m.nome, m.usuario_responsavel_id)
    ms = list_mesas()
    logger.info('Total mesas: %d', len(ms))
    if ms:
        mid = ms[0].id
        update_mesa(mid, status='ocupada')
        logger.info('Atualizada mesa id %s', mid)
        delete_mesa(mid)
        logger.info('Deletada mesa id %s', mid)
    logger.info('Demo fisica_views finalizada')


