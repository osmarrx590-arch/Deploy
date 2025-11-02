"""Views utilitárias (funções CRUD) usando SQLAlchemy Session do projeto.

Cada função é simples e idempotente quando aplicável; retornam objetos ou listas.
Use essas funções em scripts, testes ou em uma camada HTTP posteriormente.
"""

from typing import Optional, List, Dict, Any
from contextlib import contextmanager
from backend.core_models import Session, Categoria, Empresa, Produto, NotaFiscal
from backend.fisica_models import Mesa, MovimentacaoEstoque
from backend.user_models import User


@contextmanager
def session_scope():
    # criar sessão com expire_on_commit=False para que instâncias retornadas
    # mantenham seus atributos após o commit/fechamento da sessão
    session = Session(expire_on_commit=False)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


# ------------------------- Categoria -------------------------
def create_categoria(nome: str, descricao: str = '') -> Categoria:
    with session_scope() as s:
        cat = s.query(Categoria).filter_by(nome=nome).first()
        if cat:
            return cat
        cat = Categoria(nome=nome, descricao=descricao)
        s.add(cat)
        s.flush()
        return cat


def get_categoria(cat_id: int) -> Optional[Categoria]:
    with Session(expire_on_commit=False) as s:
        return s.query(Categoria).get(cat_id)


def list_categorias() -> List[Categoria]:
    with Session(expire_on_commit=False) as s:
        return s.query(Categoria).order_by(Categoria.nome).all()


def update_categoria(cat_id: int, **fields) -> Optional[Categoria]:
    with session_scope() as s:
        cat = s.query(Categoria).get(cat_id)
        if not cat:
            return None
        for k, v in fields.items():
            if hasattr(cat, k):
                setattr(cat, k, v)
        s.add(cat)
        return cat


def delete_categoria(cat_id: int) -> bool:
    with session_scope() as s:
        cat = s.query(Categoria).get(cat_id)
        if not cat:
            return False
        s.delete(cat)
        return True


# ------------------------- Empresa -------------------------
def create_empresa(data: Dict[str, Any]) -> Empresa:
    with session_scope() as s:
        emp = s.query(Empresa).filter_by(cnpj=data.get('cnpj')).first()
        if emp:
            return emp
        emp = Empresa(
            nome=data.get('nome'), endereco=data.get('endereco', ''), telefone=data.get('telefone', ''),
            email=data.get('email', ''), cnpj=data.get('cnpj'), slug=data.get('slug', '')
        )
        s.add(emp)
        s.flush()
        # opcional: criar nota fiscal se fornecida
        nf = data.get('nota_fiscal')
        if nf:
            nota = NotaFiscal(empresa_id=emp.id, serie=nf.get('serie', '1'), numero=nf.get('numero', '0'), descricao=nf.get('descricao', ''), data=nf.get('data'))
            s.add(nota)
        return emp


def get_empresa(emp_id: int) -> Optional[Empresa]:
    with Session(expire_on_commit=False) as s:
        return s.query(Empresa).get(emp_id)


def list_empresas() -> List[Empresa]:
    with Session(expire_on_commit=False) as s:
        return s.query(Empresa).order_by(Empresa.nome).all()


def update_empresa(emp_id: int, **fields) -> Optional[Empresa]:
    with session_scope() as s:
        emp = s.query(Empresa).get(emp_id)
        if not emp:
            return None
        for k, v in fields.items():
            if hasattr(emp, k):
                setattr(emp, k, v)
        s.add(emp)
        return emp


def delete_empresa(emp_id: int) -> bool:
    with session_scope() as s:
        emp = s.query(Empresa).get(emp_id)
        if not emp:
            return False
        s.delete(emp)
        return True


# ------------------------- Produto -------------------------
def create_produto(data: Dict[str, Any]) -> Produto:
    with session_scope() as s:
        prod = s.query(Produto).filter_by(codigo=data.get('codigo')).first()
        if prod:
            return prod
        prod = Produto(
            nome=data.get('nome'), categoria_id=data.get('categoria_id'), empresa_id=data.get('empresa_id'),
            descricao=data.get('descricao', ''), custo=data.get('custo', 0), venda=data.get('venda', 0),
            codigo=data.get('codigo'), estoque=data.get('estoque', 0), disponivel=data.get('disponivel', True),
            imagem=data.get('imagem'), slug=data.get('slug', data.get('codigo'))
        )
        s.add(prod)
        s.flush()
        return prod


def get_produto_by_codigo(codigo: str) -> Optional[Produto]:
    with Session(expire_on_commit=False) as s:
        return s.query(Produto).filter_by(codigo=codigo).first()


def list_produtos(limit: int = 100) -> List[Produto]:
    with Session(expire_on_commit=False) as s:
        return s.query(Produto).limit(limit).all()


def update_produto(prod_id: int, **fields) -> Optional[Produto]:
    with session_scope() as s:
        prod = s.query(Produto).get(prod_id)
        if not prod:
            return None
        for k, v in fields.items():
            if hasattr(prod, k):
                setattr(prod, k, v)
        s.add(prod)
        return prod


def delete_produto(prod_id: int) -> bool:
    with session_scope() as s:
        prod = s.query(Produto).get(prod_id)
        if not prod:
            return False
        s.delete(prod)
        return True


# ------------------------- Mesa -------------------------
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
    with Session(expire_on_commit=False) as s:
        return s.query(Mesa).order_by(Mesa.nome).all()


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


# ------------------------- Movimentacao Estoque -------------------------
def create_movimentacao(data: Dict[str, Any]) -> MovimentacaoEstoque:
    with session_scope() as s:
        mov = MovimentacaoEstoque(
            produto_id=data['produto_id'], tipo=data['tipo'], origem=data['origem'], quantidade=data['quantidade'],
            quantidade_anterior=data.get('quantidade_anterior', 0), quantidade_nova=data.get('quantidade_nova', 0), usuario_id=data.get('usuario_id', 1), observacao=data.get('observacao', ''), pedido_local_id=data.get('pedido_local_id')
        )
        s.add(mov)
        s.flush()
        return mov


# ------------------------- User -------------------------
def get_user_by_username(username: str) -> Optional[User]:
    with Session() as s:
        return s.query(User).filter_by(username=username).first()


def create_user(username: str, email: str, nome: str, password: str, tipo=None) -> User:
    with session_scope() as s:
        user = s.query(User).filter_by(username=username).first()
        if user:
            return user
        user = User(username=username, email=email, nome=nome, password=password, tipo=tipo)
        s.add(user)
        s.flush()
        return user


if __name__ == '__main__':
    from backend.logging_config import logger
    logger.info('\n=== Demo CRUD usando core_views ===')

    # --- Categoria CRUD ---
    logger.info('\n-- Categoria: create')
    c = create_categoria('TEST_CAT', 'Categoria de teste')
    logger.info('Criada: %s %s', c.id, c.nome)

    logger.info('-- Categoria: read')
    fetched = get_categoria(c.id)
    logger.info('Encontrada: %s %s', fetched.id, fetched.nome)

    logger.info('-- Categoria: update')
    updated = update_categoria(c.id, descricao='Descrição atualizada')
    logger.info('Atualizada: %s %s', updated.id, updated.descricao)

    logger.info('-- Categoria: list')
    cats = list_categorias()
    logger.info('Total categorias: %d', len(cats))

    logger.info('-- Categoria: delete')
    deleted = delete_categoria(c.id)
    logger.info('Deletada? %s', deleted)

    # --- Empresa CRUD ---
    logger.info('\n-- Empresa: create')
    emp = create_empresa({'nome': 'Empresa Teste', 'endereco': 'Rua X', 'telefone': '0', 'email': 'a@b', 'cnpj': '00.000.000/0001-00', 'slug': 'empresa-teste'})
    logger.info('Criada: %s %s', emp.id, emp.nome)

    logger.info('-- Empresa: update')
    emp2 = update_empresa(emp.id, telefone='11111111')
    logger.info('Atualizada telefone: %s', emp2.telefone)

    logger.info('-- Empresa: list')
    empresas = list_empresas()
    logger.info('Total empresas: %d', len(empresas))

    # --- Produto CRUD ---
    logger.info('\n-- Produto: create')
    # cria categoria temporária para referência
    cat_tmp = create_categoria('TMP_CAT', 'tmp')
    prod = create_produto({'nome': 'Produto Teste', 'categoria_id': cat_tmp.id, 'empresa_id': emp.id, 'descricao': 'x', 'custo': 1, 'venda': 2, 'codigo': 'TST-001', 'estoque': 10, 'disponivel': True, 'imagem': None, 'slug': 'tst-001'})
    logger.info('Criado: %s %s', prod.id, prod.nome)

    logger.info('-- Produto: read')
    p_f = get_produto_by_codigo(prod.codigo)
    logger.info('Encontrado por código: %s %s', p_f.id, p_f.nome)

    logger.info('-- Produto: update')
    p_u = update_produto(prod.id, venda=3.5)
    logger.info('Atualizado venda: %.2f', float(p_u.venda))

    logger.info('-- Produto: list')
    ps = list_produtos()
    logger.info('Total produtos retornados (limit): %d', len(ps))

    logger.info('-- Produto: delete')
    deletedp = delete_produto(prod.id)
    logger.info('Deletado produto? %s', deletedp)

    logger.info('\nDemo CRUD finalizada.')
