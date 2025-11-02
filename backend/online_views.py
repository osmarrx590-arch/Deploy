"""CRUD utilities for loja_online models (Favorito, Avaliacao, PedidoOnline, Cupom).
"""
from typing import Optional, List, Dict, Any
from contextlib import contextmanager
from backend.core_models import Session
from backend.online_models import Favorito, Avaliacao, PedidoOnline, ItemPedidoOnline, Cupom


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


def create_favorito(user_id: int, produto_id: int) -> Favorito:
    with session_scope() as s:
        fav = s.query(Favorito).filter_by(user_id=user_id, produto_id=produto_id).first()
        if fav:
            return fav
        fav = Favorito(user_id=user_id, produto_id=produto_id)
        s.add(fav)
        s.flush()
        return fav


def create_avaliacao(user_id: int, produto_id: int, rating: int, comentario: str = '') -> Avaliacao:
    with session_scope() as s:
        aval = s.query(Avaliacao).filter_by(user_id=user_id, produto_id=produto_id).first()
        if aval:
            # Atualizar avaliação existente
            aval.rating = rating
            aval.comentario = comentario
            from datetime import datetime, timezone
            aval.updated_at = datetime.now(timezone.utc)
            s.flush()
            return aval
        aval = Avaliacao(user_id=user_id, produto_id=produto_id, rating=rating, comentario=comentario)
        s.add(aval)
        s.flush()
        return aval


def list_avaliacoes(user_id: int) -> List[Avaliacao]:
    """Retorna todas as avaliações de um usuário."""
    with session_scope() as s:
        avals = s.query(Avaliacao).filter_by(user_id=user_id).all()
        return avals


def delete_avaliacao(user_id: int, produto_id: int) -> bool:
    """Remove uma avaliação por user_id e produto_id. Retorna True se deletou, False se não encontrou."""
    with session_scope() as s:
        aval = s.query(Avaliacao).filter_by(user_id=user_id, produto_id=produto_id).first()
        if not aval:
            return False
        s.delete(aval)
        s.flush()
        return True


def create_pedido_online(data: Dict[str, Any]) -> PedidoOnline:
    with session_scope() as s:
        pedido = PedidoOnline(**data)
        s.add(pedido)
        s.flush()
        return pedido


def create_cupom(data: Dict[str, Any]) -> Cupom:
    with session_scope() as s:
        cup = s.query(Cupom).filter_by(codigo=data.get('codigo')).first()
        if cup:
            return cup
        cup = Cupom(**data)
        s.add(cup)
        s.flush()
        return cup


def list_favoritos(user_id: int) -> List[Favorito]:
    """Retorna todos os favoritos de um usuário."""
    with session_scope() as s:
        favs = s.query(Favorito).filter_by(user_id=user_id).all()
        return favs


def delete_favorito(user_id: int, produto_id: int) -> bool:
    """Remove um favorito por user_id e produto_id. Retorna True se deletou, False se não encontrou."""
    with session_scope() as s:
        fav = s.query(Favorito).filter_by(user_id=user_id, produto_id=produto_id).first()
        if not fav:
            return False
        s.delete(fav)
        s.flush()
        return True


if __name__ == '__main__':
    from backend.logging_config import logger
    logger.info('\n=== Demo CRUD')
    # garantir que as tabelas existam (reusar engine do core_models)
    from backend.core_models import db, Base as CoreBase
    CoreBase.metadata.create_all(bind=db)

    # criação rápida de cupom
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    cup = create_cupom({'codigo': 'TESTCUP', 'nome': 'Teste', 'tipo': 'valor_fixo', 'valor': 5, 'data_inicio': now - timedelta(days=1), 'data_fim': now + timedelta(days=30)})
    logger.info('Cupom criado: %s %s', cup.id, cup.codigo)
    fav = create_favorito(1, 1)
    logger.info('Favorito criado (user=1, prod=1): %s', fav.id)
    logger.info('Demo online_views finalizada')
