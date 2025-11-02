"""CRUD utilities para usuários (User).
"""
from typing import Optional
from contextlib import contextmanager
from backend.core_models import Session
from backend.user_models import User, UserType


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


def create_user(username: str, email: str, nome: str, password: str, tipo=UserType.online) -> User:
    with session_scope() as s:
        u = s.query(User).filter_by(username=username).first()
        if u:
            return u
        user = User(username=username, email=email, nome=nome, password=password, tipo=tipo)
        s.add(user)
        s.flush()
        return user


def get_user(username: str) -> Optional[User]:
    with Session(expire_on_commit=False) as s:
        return s.query(User).filter_by(username=username).first()


def get_user_by_id(user_id: int) -> Optional[User]:
    with Session(expire_on_commit=False) as s:
        return s.query(User).filter_by(id=user_id).first()


def get_user_by_email(email: str) -> Optional[User]:
    with Session(expire_on_commit=False) as s:
        return s.query(User).filter_by(email=email).first()


def delete_user(username: str) -> bool:
    with session_scope() as s:
        u = s.query(User).filter_by(username=username).first()
        if not u:
            return False
        s.delete(u)
        return True


if __name__ == '__main__':
    # garantir que tabelas existam
    from backend.core_models import db, Base as CoreBase
    CoreBase.metadata.create_all(bind=db)
    from backend.logging_config import logger
    logger.info('\n=== Demo CRUD')
    u = create_user('demo', 'demo@example.com', 'Demo User', 'demo123')
    logger.info('Criado user: %s %s', u.id, u.username)
    f = get_user('demo')
    logger.info('Fetch user: %s %s', f.id, f.username)
    ok = delete_user('demo')
    logger.info('Deletado: %s', ok)
