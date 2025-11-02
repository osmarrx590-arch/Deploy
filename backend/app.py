# D:\OsmarSoftware\happy-hops-home - Sem a integração do mercado pago\backend\app.py
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

from backend.user_views import create_user, get_user, delete_user, get_user_by_id, get_user_by_email
from backend.user_models import UserType
from backend.core_views import (
    create_categoria, list_categorias, get_categoria, update_categoria, delete_categoria,
    create_empresa, list_empresas, get_empresa, update_empresa, delete_empresa,
    create_produto, list_produtos, get_produto_by_codigo, update_produto, delete_produto
)
from pydantic import BaseModel, EmailStr
from typing import List
from typing import Optional
from backend.user_models import User
from backend.core_models import Session as CoreSession, Produto
import os
import datetime
import jwt
from fastapi.responses import JSONResponse
from fastapi import Response, Request

# Mercado Pago SDK: carregar localmente dentro dos endpoints para evitar erros de análise
mercadopago = None

app = FastAPI(title="Choperia Backend API")

from backend.logging_config import logger


# Garantir criação das tabelas dos modelos registrados quando a app iniciar.
"""
Evento de startup do FastAPI para criar tabelas no banco de dados.
# Ao executar o comando: (venv) PS D:/OsmarSoftware/happy-hops-home> python -m uvicorn backend.app:app --reload --port 8000
"""
# Importar os módulos de modelo aqui (ou quaisquer outros que definam classes
# que precisem criar suas tabelas) antes de chamar create_all.
@app.on_event("startup")
def startup_event():
    # Importar User e quaisquer outros modelos para garantir que as classes
    # estão registradas na metadata do mesmo Base compartilhado.
    try:
        from backend import user_models  # noqa: F401 (import for side-effects)
    except Exception as e:
        logger.warning(f"Aviso: falha ao importar backend.user_models no startup: {e}")

    # Importar modelos adicionais que possam não ter sido importados ainda
    try:
        from backend import fisica_models  # noqa: F401
        from backend import online_models  # noqa: F401

    except Exception:
        pass

    # Agora criar todas as tabelas registradas na metadata compartilhada
    try:
        from backend.core_models import Base, db
        Base.metadata.create_all(bind=db)
        logger.info("Tabelas do banco verificadas/criadas (startup)")
    except Exception as e:
        logger.exception(f"Erro ao criar/verificar tabelas no startup: {e}")

    # Popular o banco automaticamente (idempotente)
    try:
        from backend.populate_db_sqlalchemy import main as populate_main
        populate_main()
        logger.info("Banco populado automaticamente (startup)")
    except Exception as e:
        logger.exception(f"Erro ao popular o banco no startup: {e}")


# Middleware de registro de solicitações simples para ajudar a depurar tempos limite/solicitações recebidas
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Middleware que registra cada requisição HTTP recebida, mostrando método, URL, status e tempo de resposta.
    Útil para depuração e monitoramento de performance.
    """
    import time
    start = time.time()
    try:
        logger.debug(f"[middleware] -> incoming {request.method} {request.url}")
    except Exception:
        logger.debug("[middleware] -> incoming (could not format request)")
    try:
        response = await call_next(request)
        elapsed = (time.time() - start) * 1000
        logger.debug(f"[middleware] <- completed {request.method} {request.url} status={response.status_code} time_ms={elapsed:.1f}")
        return response
    except Exception as e:
        elapsed = (time.time() - start) * 1000
        logger.exception(f"[middleware] <- exception {request.method} {request.url} error={e} time_ms={elapsed:.1f}")
        raise

# CORS (ajuste conforme necessário para o frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://192.168.1.112:8080",
        "https://bab26d3d-85cf-49b5-b412-01b7bf802c75.lovableproject.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    nome: str
    password: str
    tipo: Optional[str] = "online"


class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    nome: str
    tipo: str


# --- Categoria models and endpoints ---
class CategoriaIn(BaseModel):
    nome: str
    descricao: str = ""


class CategoriaOut(BaseModel):
    id: int
    nome: str
    descricao: str


@app.post('/categorias/', response_model=CategoriaOut)
def api_create_categoria(payload: CategoriaIn):
    """
    Cria uma nova categoria no banco de dados.
    Parâmetros:
        payload: CategoriaIn - dados da categoria (nome, descrição)
    Retorno:
        CategoriaOut - dados da categoria criada
    """
    c = create_categoria(payload.nome, descricao=payload.descricao)
    return CategoriaOut(id=c.id, nome=c.nome, descricao=c.descricao or "")


@app.get('/categorias/', response_model=List[CategoriaOut])
def api_list_categorias():
    """
    Lista todas as categorias cadastradas.
    Retorno:
        Lista de CategoriaOut
    """
    cats = list_categorias()
    return [CategoriaOut(id=c.id, nome=c.nome, descricao=c.descricao or "") for c in cats]


@app.get('/categorias/{cat_id}', response_model=CategoriaOut)
def api_get_categoria(cat_id: int):
    """
    Busca uma categoria pelo id.
    Parâmetros:
        cat_id: int - id da categoria
    Retorno:
        CategoriaOut se encontrada, senão erro 404
    """
    c = get_categoria(cat_id)
    if not c:
        raise HTTPException(status_code=404, detail='Categoria não encontrada')
    return CategoriaOut(id=c.id, nome=c.nome, descricao=c.descricao or "")


@app.put('/categorias/{cat_id}', response_model=CategoriaOut)
def api_update_categoria(cat_id: int, payload: CategoriaIn):
    """
    Atualiza os dados de uma categoria existente.
    Parâmetros:
        cat_id: int - id da categoria
        payload: CategoriaIn - novos dados
    Retorno:
        CategoriaOut atualizada ou erro 404
    """
    c = update_categoria(cat_id, nome=payload.nome, descricao=payload.descricao)
    if not c:
        raise HTTPException(status_code=404, detail='Categoria não encontrada')
    return CategoriaOut(id=c.id, nome=c.nome, descricao=c.descricao or "")


@app.delete('/categorias/{cat_id}')
def api_delete_categoria(cat_id: int):
    """
    Remove uma categoria pelo id.
    Parâmetros:
        cat_id: int - id da categoria
    Retorno:
        {'deleted': True} se sucesso, senão erro 404
    """
    ok = delete_categoria(cat_id)
    if not ok:
        raise HTTPException(status_code=404, detail='Categoria não encontrada')
    return {'deleted': True}


# --- Empresa models and endpoints ---
class EmpresaIn(BaseModel):
    nome: str
    endereco: str = ''
    telefone: str = ''
    email: EmailStr | str = ''
    cnpj: str
    slug: str | None = None


class EmpresaOut(BaseModel):
    id: int
    nome: str
    endereco: str
    telefone: str
    email: str
    cnpj: str
    slug: str


@app.post('/empresas/', response_model=EmpresaOut)
def api_create_empresa(payload: EmpresaIn):
    """
    Cria uma nova empresa.
    Parâmetros:
        payload: EmpresaIn - dados da empresa
    Retorno:
        EmpresaOut - dados da empresa criada
    """
    data = payload.dict()
    emp = create_empresa(data)
    return EmpresaOut(id=emp.id, nome=emp.nome, endereco=emp.endereco, telefone=emp.telefone, email=emp.email, cnpj=emp.cnpj, slug=emp.slug)


@app.get('/empresas/', response_model=List[EmpresaOut])
def api_list_empresas():
    """
    Lista todas as empresas cadastradas.
    Retorno:
        Lista de EmpresaOut
    """
    emps = list_empresas()
    return [EmpresaOut(id=e.id, nome=e.nome, endereco=e.endereco, telefone=e.telefone, email=e.email, cnpj=e.cnpj, slug=e.slug) for e in emps]


@app.get('/empresas/{emp_id}', response_model=EmpresaOut)
def api_get_empresa(emp_id: int):
    """
    Busca uma empresa pelo id.
    Parâmetros:
        emp_id: int - id da empresa
    Retorno:
        EmpresaOut se encontrada, senão erro 404
    """
    e = get_empresa(emp_id)
    if not e:
        raise HTTPException(status_code=404, detail='Empresa não encontrada')
    return EmpresaOut(id=e.id, nome=e.nome, endereco=e.endereco, telefone=e.telefone, email=e.email, cnpj=e.cnpj, slug=e.slug)


@app.put('/empresas/{emp_id}', response_model=EmpresaOut)
def api_update_empresa(emp_id: int, payload: EmpresaIn):
    """
    Atualiza os dados de uma empresa existente.
    Parâmetros:
        emp_id: int - id da empresa
        payload: EmpresaIn - novos dados
    Retorno:
        EmpresaOut atualizada ou erro 404
    """
    e = update_empresa(emp_id, **payload.dict())
    if not e:
        raise HTTPException(status_code=404, detail='Empresa não encontrada')
    return EmpresaOut(id=e.id, nome=e.nome, endereco=e.endereco, telefone=e.telefone, email=e.email, cnpj=e.cnpj, slug=e.slug)


@app.delete('/empresas/{emp_id}')
def api_delete_empresa(emp_id: int):
    """
    Remove uma empresa pelo id.
    Parâmetros:
        emp_id: int - id da empresa
    Retorno:
        {'deleted': True} se sucesso, senão erro 404
    """
    ok = delete_empresa(emp_id)
    if not ok:
        raise HTTPException(status_code=404, detail='Empresa não encontrada')
    return {'deleted': True}


# --- Produto models and endpoints ---
class ProdutoIn(BaseModel):
    nome: str
    categoria_id: int
    empresa_id: int
    descricao: str = ''
    custo: float = 0.0
    venda: float = 0.0
    codigo: str
    estoque: int = 0
    disponivel: bool = True
    imagem: str | None = None
    slug: str | None = None


class ProdutoOut(BaseModel):
    id: int
    nome: str
    categoria_id: int
    empresa_id: int
    descricao: str
    custo: float
    venda: float
    codigo: str
    estoque: int
    disponivel: bool
    imagem: str | None
    slug: str


@app.post('/produtos/', response_model=ProdutoOut)
def api_create_produto(payload: ProdutoIn):
    """
    Cria um novo produto.
    Parâmetros:
        payload: ProdutoIn - dados do produto
    Retorno:
        ProdutoOut - dados do produto criado
    """
    data = payload.dict()
    prod = create_produto(data)
    try:
        logger.info(f"Produto criado no backend: id={prod.id} nome={prod.nome} categoria_id={prod.categoria_id} empresa_id={prod.empresa_id} estoque={prod.estoque}")
    except Exception:
        # fallback safe print if logger misconfigured
        print(f"Produto criado no backend: id={getattr(prod, 'id', None)} nome={getattr(prod, 'nome', None)}")
    return ProdutoOut(
        id=prod.id, nome=prod.nome, categoria_id=prod.categoria_id, empresa_id=prod.empresa_id,
        descricao=prod.descricao, custo=float(prod.custo), venda=float(prod.venda), codigo=prod.codigo,
        estoque=prod.estoque, disponivel=prod.disponivel, imagem=prod.imagem, slug=prod.slug
    )


@app.get('/produtos/', response_model=List[ProdutoOut])
def api_list_produtos(limit: int = 100):
    """
    Lista todos os produtos cadastrados, com limite opcional.
    Parâmetros:
        limit: int - quantidade máxima de produtos
    Retorno:
        Lista de ProdutoOut
    """
    ps = list_produtos(limit=limit)
    return [ProdutoOut(
        id=p.id, nome=p.nome, categoria_id=p.categoria_id, empresa_id=p.empresa_id,
        descricao=p.descricao, custo=float(p.custo), venda=float(p.venda), codigo=p.codigo,
        estoque=p.estoque, disponivel=p.disponivel, imagem=p.imagem, slug=p.slug
    ) for p in ps]


@app.get('/produtos/codigo/{codigo}', response_model=ProdutoOut)
def api_get_produto_by_codigo(codigo: str):
    """
    Busca um produto pelo código.
    Parâmetros:
        codigo: str - código do produto
    Retorno:
        ProdutoOut se encontrado, senão erro 404
    """
    p = get_produto_by_codigo(codigo)
    if not p:
        raise HTTPException(status_code=404, detail='Produto não encontrado')
    return ProdutoOut(
        id=p.id, nome=p.nome, categoria_id=p.categoria_id, empresa_id=p.empresa_id,
        descricao=p.descricao, custo=float(p.custo), venda=float(p.venda), codigo=p.codigo,
        estoque=p.estoque, disponivel=p.disponivel, imagem=p.imagem, slug=p.slug
    )


@app.put('/produtos/{prod_id}', response_model=ProdutoOut)
def api_update_produto(prod_id: int, payload: ProdutoIn):
    """
    Atualiza os dados de um produto existente.
    Parâmetros:
        prod_id: int - id do produto
        payload: ProdutoIn - novos dados
    Retorno:
        ProdutoOut atualizado ou erro 404
    """
    p = update_produto(prod_id, **payload.dict())
    if not p:
        raise HTTPException(status_code=404, detail='Produto não encontrado')
    return ProdutoOut(
        id=p.id, nome=p.nome, categoria_id=p.categoria_id, empresa_id=p.empresa_id,
        descricao=p.descricao, custo=float(p.custo), venda=float(p.venda), codigo=p.codigo,
        estoque=p.estoque, disponivel=p.disponivel, imagem=p.imagem, slug=p.slug
    )


@app.delete('/produtos/{prod_id}')
def api_delete_produto(prod_id: int):
    """
    Remove um produto pelo id.
    Parâmetros:
        prod_id: int - id do produto
    Retorno:
        {'deleted': True} se sucesso, senão erro 404
    """
    ok = delete_produto(prod_id)
    if not ok:
        raise HTTPException(status_code=404, detail='Produto não encontrado')
    return {'deleted': True}


# --- Mesa models and endpoints ---
from pydantic import BaseModel
from backend.fisica_views import list_mesas as db_list_mesas, create_mesa as db_create_mesa, update_mesa as db_update_mesa, delete_mesa as db_delete_mesa, create_item_pedido, create_pedido_local, create_movimentacao, get_pedido_pendente_por_mesa, add_item_to_pedido
from backend.fisica_views import remove_item_from_pedido
from backend.fisica_views import processar_pagamento_mesa
from backend.fisica_views import cancelar_pedido_por_mesa
from backend.fisica_models import Mesa as MesaModel, gerar_slug
from sqlalchemy import func

class MesaIn(BaseModel):
    nome: str
    status: str = 'Livre'  # 'Livre' ou 'Ocupada'
    # padronizado: pedido é inteiro
    pedido: int = 0

class MesaOut(BaseModel):
    id: int
    nome: str
    status: str
    # padronizado: pedido é inteiro
    pedido: int
    slug: str | None = None
    itens: list | None = None


class ItemIn(BaseModel):
    produtoId: int
    quantidade: int
    nome: str | None = None
    precoUnitario: float | None = None
    usuarioId: int | None = None
    # número do pedido sugerido (agora inteiro)
    numero: int | None = None

# Mantemos MESAS_DB como fallback local/in-memory para testes rápidos
MESAS_DB = []


@app.get('/mesas', response_model=list[MesaOut])
def api_list_mesas():
    """
    Lista mesas: tenta carregar do banco (via fisica_views.list_mesas).
    Se houver erro ou retorno vazio, faz fallback para MESAS_DB (in-memory).
    Adiciona logs para auxiliar a depuração de qual origem está sendo usada.
    """
    try:
        db_ms = db_list_mesas()
        logger.info("[mesas] carregadas %d mesas do DB", len(db_ms))
        if db_ms:
            out = []
            for m in db_ms:
                # tentar mapear itens do pedido local mais recente (se existir)
                itens_out = []
                last_pedido = None
                try:
                    # pegar último pedido associado (se houver) e seus itens
                    pedidos_lista = getattr(m, 'pedidos', None)
                    logger.info(f"[DEBUG] Mesa {m.nome} (id={m.id}): pedidos={pedidos_lista}, len={len(pedidos_lista) if pedidos_lista else 0}")
                    
                    if pedidos_lista:
                        # ordenar por created_at se disponível
                        pedidos = sorted(pedidos_lista, key=lambda p: getattr(p, 'created_at', 0), reverse=True)
                        last_pedido = pedidos[0] if pedidos else None
                        
                        if last_pedido:
                            logger.info(f"[DEBUG] Mesa {m.nome}: last_pedido.id={last_pedido.id}, last_pedido.numero={getattr(last_pedido, 'numero', 'ATTR_NAO_EXISTE')}")
                        else:
                            logger.info(f"[DEBUG] Mesa {m.nome}: pedidos lista vazia após sort")
                    else:
                        logger.info(f"[DEBUG] Mesa {m.nome}: sem relacionamento 'pedidos' ou None")
                    
                    if last_pedido and getattr(last_pedido, 'itens', None):
                        for it in last_pedido.itens:
                            # use foreign key pedido_id em vez de acessar relação reversa 'pedido'
                            # para evitar lazy-loading fora de sessão (DetachedInstanceError)
                            itens_out.append({
                                'id': it.id,
                                'produtoId': it.produto_id,
                                'nome': it.nome,
                                'quantidade': it.quantidade,
                                'precoUnitario': float(it.preco_unitario),
                                'total': float(getattr(it, 'subtotal', it.quantidade * it.preco_unitario)),
                                'mesaId': getattr(it, 'pedido_id', m.id) or m.id,
                                'status': 'ativo'
                            })
                except Exception as ex:
                    logger.error(f"[DEBUG] Erro ao processar mesa {m.nome}: {ex}", exc_info=True)
                    itens_out = []

                # Se existe pedido mais recente, usar seu número; senão usar 0
                numero_pedido = last_pedido.numero if last_pedido else 0
                logger.info(f"[DEBUG] Mesa {m.nome}: numero_pedido final={numero_pedido}")

                out.append({
                    'id': m.id,
                    'nome': m.nome,
                    # normalizar status para o formato esperado pelo frontend (Primeira letra maiúscula)
                    'status': (m.status.capitalize() if isinstance(m.status, str) else m.status),
                    # usar número do pedido mais recente se existir
                    'pedido': numero_pedido,
                    'slug': getattr(m, 'slug', None) or gerar_slug(m.nome),
                    'itens': itens_out
                })
            return out
        else:
            logger.info('[mesas] DB retornou 0 mesas; usando fallback in-memory')
    except Exception as e:
        logger.exception('[mesas] erro ao ler mesas do DB: %s', e)

    logger.info('[mesas] retornando %d mesas do fallback in-memory', len(MESAS_DB))
    return MESAS_DB


@app.post('/mesas', response_model=MesaOut)
def api_create_mesa(payload: MesaIn):
    """
    Cria uma nova mesa: tenta persistir no DB via fisica_views.create_mesa.
    Se falhar, insere no MESAS_DB in-memory.
    """
    try:
        m = db_create_mesa(payload.nome)
        logger.info('[mesas] criada mesa no DB: id=%s nome=%s', m.id, m.nome)
        return {
            'id': m.id,
            'nome': m.nome,
            'status': (m.status.capitalize() if isinstance(m.status, str) else m.status),
            'pedido': 0,
            'slug': getattr(m, 'slug', None) or gerar_slug(m.nome)
        }
    except Exception as e:
        logger.exception('[mesas] erro ao criar mesa no DB, fallback in-memory: %s', e)
        mesa = payload.dict()
        mesa['id'] = (max([m.get('id', 0) for m in MESAS_DB]) + 1) if MESAS_DB else 1
        mesa['slug'] = gerar_slug(mesa['nome'])
        MESAS_DB.append(mesa)
        return mesa


@app.get('/mesas/{mesa_id}', response_model=MesaOut)
def api_get_mesa(mesa_id: int):
    """
    Busca uma mesa pelo id: prioriza DB, fallback para in-memory.
    """
    try:
        # buscar no DB via Session direto (evitar dependência adicional)
        with CoreSession(expire_on_commit=False) as s:
            m = s.query(MesaModel).get(mesa_id)
            if m:
                itens_out = []
                try:
                    pedidos = sorted(m.pedidos, key=lambda p: getattr(p, 'created_at', 0), reverse=True)
                    # escolher o último pedido pendente (se houver)
                    last_pedido = next((p for p in pedidos if getattr(p, 'status', None) == 'pendente'), None)
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

                # Se houver um pedido pendente, preferir expor seu número no campo `pedido`.
                display_pedido = 0
                try:
                    pedidos = sorted(m.pedidos, key=lambda p: getattr(p, 'created_at', 0), reverse=True)
                    last_pedido = next((p for p in pedidos if getattr(p, 'status', None) == 'pendente'), None)
                    if last_pedido:
                        display_pedido = getattr(last_pedido, 'numero', 0) or 0
                except Exception:
                    display_pedido = getattr(m, 'pedido', 0) or 0

                return {
                    'id': m.id,
                    'nome': m.nome,
                    'status': (m.status.capitalize() if isinstance(m.status, str) else m.status),
                    'pedido': display_pedido,
                    'slug': getattr(m, 'slug', None) or gerar_slug(m.nome),
                    'itens': itens_out
                }
    except Exception as e:
        logger.exception('[mesas] erro ao buscar mesa por id no DB: %s', e)

    # fallback in-memory
    for mm in MESAS_DB:
        if mm.get('id') == mesa_id:
            return mm
    raise HTTPException(status_code=404, detail='Mesa não encontrada')


@app.post('/mesas/{mesa_id}/itens')
async def api_add_item_mesa(mesa_id: int, payload: ItemIn, request: Request):
    """
    Adiciona um item a uma mesa (cria/usa PedidoLocal e ItemPedidoLocal).
    - Busca/Cria um PedidoLocal para a mesa;
    - Cria ItemPedidoLocal via create_item_pedido;
    - Registra movimentação de estoque (opcional) via create_movimentacao;
    - Atualiza o status da mesa para 'ocupada';
    - Retorna a mesa atualizada (api_get_mesa format)
    """
    try:
        # garantir que a mesa exista
        with CoreSession(expire_on_commit=False) as s:
            mesa = s.query(MesaModel).get(mesa_id)
            if not mesa:
                raise HTTPException(status_code=404, detail='Mesa não encontrada')

        # tentar reusar um pedido pendente existente
        pedido = get_pedido_pendente_por_mesa(mesa_id)
        if not pedido:
            # usar numero sugerido do frontend se estiver presente
            suggested_num = None
            try:
                suggested_num = payload.numero if getattr(payload, 'numero', None) else None
            except Exception:
                suggested_num = None

            # Tentar criar usando numero sugerido, com fallback em caso de conflito; se não houver
            # numero sugerido, create_pedido_local irá computar max(numero)+1 de forma segura.
            if suggested_num:
                try:
                    pedido_data = {
                        'numero': int(suggested_num),
                        'mesa_id': mesa_id,
                        'atendente_id': payload.usuarioId or 1,
                        'status': 'pendente',
                        'total': 0,
                        'observacoes': ''
                    }
                    pedido = create_pedido_local(pedido_data)
                except Exception as e:
                    # Possível IntegrityError por número duplicado; gerar fallback seguro
                    logger.warning('[mesas] numero sugerido duplicado ou inválido: %s — gerando fallback (%s)', suggested_num, e)
                    # delegar fallback para create_pedido_local (sem numero) que fará max+1
                    pedido_data = {
                        'mesa_id': mesa_id,
                        'atendente_id': payload.usuarioId or 1,
                        'status': 'pendente',
                        'total': 0,
                        'observacoes': ''
                    }
                    pedido = create_pedido_local(pedido_data)
            else:
                pedido_data = {
                    # sem 'numero' para delegar geração sequencial segura ao create_pedido_local
                    'mesa_id': mesa_id,
                    'atendente_id': payload.usuarioId or 1,
                    'status': 'pendente',
                    'total': 0,
                    'observacoes': ''
                }
                pedido = create_pedido_local(pedido_data)

        try:
            # DEBUG: log do payload recebido (ajuda a diagnosticar discrepâncias entre frontend/backend)
            try:
                # raw json do request
                raw = await request.json()
                logger.debug('[mesas] raw request json: %s', raw)
            except Exception:
                pass
            try:
                logger.debug('[mesas] payload (parsed ItemIn): %s (type: %s)', payload, type(payload))
            except Exception:
                pass

            # adicionar item ao pedido (helper atualiza total e faz merge se item já existir)
            item = add_item_to_pedido(pedido.id, payload.produtoId, payload.nome or f'Produto {payload.produtoId}', int(payload.quantidade), float(payload.precoUnitario or 0))
            logger.info('[mesas] item adicionado/atualizado id=%s quantidade=%s', item.id, item.quantidade)

            # atualizar status da mesa para ocupada
            db_update_mesa(mesa_id, status='ocupada')
        except Exception as e:
            logger.exception('[mesas] erro ao adicionar/atualizar item: %s', e)
            raise HTTPException(status_code=500, detail='Erro ao adicionar/atualizar item no pedido')

        # opcional: registrar movimentação de estoque (origem reserva_mesa)
        try:
            mov_data = {
                'produto_id': payload.produtoId,
                'tipo': 'reserva',
                'origem': 'reserva_mesa',
                'quantidade': -int(payload.quantidade),
                'quantidade_anterior': 0,
                'quantidade_nova': 0,
                'usuario_id': payload.usuarioId or 1,
                'observacao': f'Reserva para mesa {mesa_id}',
                'pedido_local_id': pedido.id
            }
            create_movimentacao(mov_data)
        except Exception:
            pass

        return api_get_mesa(mesa_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception('[mesas] erro ao adicionar item na mesa: %s', e)
        raise HTTPException(status_code=500, detail='Erro ao adicionar item na mesa')



@app.post('/mesas/{mesa_id}/pagamento')
def api_pagamento_mesa(mesa_id: int, payload: dict):
    """Endpoint para processar o pagamento de uma mesa.
    Espera payload com campos: metodo, itens, total, usuarioId (opcional)
    Retorna a mesa atualizada.
    """
    try:
        metodo = payload.get('metodo') or payload.get('metodoPagamento') or 'desconhecido'
        itens = payload.get('itens', [])
        total = float(payload.get('total', 0))
        usuario_id = payload.get('usuarioId') or payload.get('usuario_id')
        pedido_numero = payload.get('pedidoNumero') or payload.get('pedido_numero')

        result = processar_pagamento_mesa(mesa_id, pedido_numero, metodo, itens, total, usuario_id)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.exception('[mesas] erro ao processar pagamento no backend: %s', e)
        raise HTTPException(status_code=500, detail='Erro ao processar pagamento')



@app.delete('/mesas/{mesa_id}/itens/{item_id}')
def api_remove_item_mesa(mesa_id: int, item_id: int):
    """Remove um item de pedido (ItemPedidoLocal) e retorna a mesa atualizada."""
    try:
        ok = remove_item_from_pedido(item_id)
        if not ok:
            raise HTTPException(status_code=404, detail='Item não encontrado')
        
        # verificar se ainda há itens no pedido da mesa
        pedido = get_pedido_pendente_por_mesa(mesa_id)
        if pedido:
            with CoreSession(expire_on_commit=False) as s:
                from backend.fisica_models import ItemPedidoLocal as ItemModel
                itens_count = s.query(ItemModel).filter_by(pedido_id=pedido.id).count()
                # se não há mais itens, voltar mesa para livre
                if itens_count == 0:
                    db_update_mesa(mesa_id, status='livre')
        
        return api_get_mesa(mesa_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception('[mesas] erro ao remover item da mesa: %s', e)
        raise HTTPException(status_code=500, detail='Erro ao remover item da mesa')


@app.post('/pedidos/{mesa_id}/cancelar')
def api_cancelar_pedido_mesa(mesa_id: int):
    """Cancela pedido pendente associado à mesa e atualiza status da mesa para livre."""
    try:
        ok = cancelar_pedido_por_mesa(mesa_id)
        if not ok:
            raise HTTPException(status_code=404, detail='Pedido pendente não encontrado para esta mesa')
        # retornar a mesa atualizada
        return api_get_mesa(mesa_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception('[pedidos] erro ao cancelar pedido no backend: %s', e)
        raise HTTPException(status_code=500, detail='Erro ao cancelar pedido')


@app.delete('/pedidos/{mesa_id}/cancelar')
def api_cancelar_pedido_mesa_delete(mesa_id: int):
    """Alias DELETE para cancelar pedido por mesa (compatibilidade)."""
    logger.info('[pedidos] DELETE /pedidos/%s/cancelar chamado', mesa_id)
    try:
        ok = cancelar_pedido_por_mesa(mesa_id)
        if not ok:
            raise HTTPException(status_code=404, detail='Pedido pendente não encontrado para esta mesa')
        return api_get_mesa(mesa_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception('[pedidos] erro ao cancelar pedido (DELETE) no backend: %s', e)
        raise HTTPException(status_code=500, detail='Erro ao cancelar pedido')


# --- Endpoints para Pedidos Online (loja online) ---
from backend.core_models import Session as CoreSession
from backend.online_models import PedidoOnline, ItemPedidoOnline
from backend.online_views import create_favorito, list_favoritos, delete_favorito
from backend.online_views import create_avaliacao, list_avaliacoes, delete_avaliacao


@app.post('/pedidos/')
def api_create_pedido(payload: dict, request: Request):
    """Cria um pedido online e seus itens. Mapeia o payload do frontend para os modelos do DB."""
    try:
        logger.info('[pedidos][CREATE] payload recebido: %s', payload)
        
        with CoreSession() as s:
            # Gerar número único de pedido (ON + timestamp)
            numero = f"ON{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            # Tentar pegar user do token, fallback para payload
            user = get_user_from_token(request)
            user_id = user.id if user else (payload.get('usuarioId') or payload.get('usuario_id') or payload.get('userId') or payload.get('user_id') or 1)
            
            metodo = payload.get('metodoPagamento') or payload.get('metodo_pagamento') or 'pix'
            subtotal = float(payload.get('subtotal', 0) or 0)
            desconto = float(payload.get('desconto', 0) or 0)
            total = float(payload.get('total', subtotal - desconto) or 0)
            nome_cliente = payload.get('nome') or payload.get('nome_cliente') or 'Cliente'

            pedido = PedidoOnline(
                user_id=user_id,
                numero=numero,
                status='pendente',
                metodo_pagamento=metodo,
                subtotal=subtotal,
                desconto=desconto,
                total=total,
                nome_cliente=nome_cliente,
                endereco_cep=payload.get('endereco_cep', ''),
                endereco_rua=payload.get('endereco_rua', ''),
                endereco_numero=payload.get('endereco_numero', ''),
                endereco_complemento=payload.get('endereco_complemento', ''),
                endereco_bairro=payload.get('endereco_bairro', ''),
                endereco_cidade=payload.get('endereco_cidade', ''),
                endereco_estado=payload.get('endereco_estado', ''),
                observacoes=payload.get('observacoes', '')
            )
            s.add(pedido)
            s.flush()
            logger.info('[pedidos][CREATE] pedido criado: id=%s numero=%s', pedido.id, pedido.numero)

            itens_out = []
            for it in payload.get('itens', []):
                produto_id = it.get('id') or it.get('produtoId') or it.get('produto_id')
                nome_item = it.get('nome') or it.get('descricao') or ''
                quantidade = int(it.get('quantidade', 1))
                preco_unitario = float(it.get('venda') or it.get('preco_unitario') or it.get('preco') or 0)
                item = ItemPedidoOnline(pedido_id=pedido.id, produto_id=produto_id, nome=nome_item, quantidade=quantidade, preco_unitario=preco_unitario)
                s.add(item)
                s.flush()
                itens_out.append({
                    'id': item.id,
                    'produto_id': item.produto_id,
                    'nome': item.nome,
                    'quantidade': item.quantidade,
                    'preco_unitario': float(item.preco_unitario),
                    'subtotal': float(item.subtotal)
                })
                logger.info('[pedidos][CREATE] item adicionado: produto_id=%s nome=%s qtd=%s', item.produto_id, item.nome, item.quantidade)

            s.commit()
            logger.info('[pedidos][CREATE] pedido salvo com sucesso: %s itens', len(itens_out))

            return {
                'id': pedido.id,
                'numero': pedido.numero,
                'status': pedido.status,
                'metodo_pagamento': pedido.metodo_pagamento,
                'subtotal': float(pedido.subtotal),
                'desconto': float(pedido.desconto),
                'total': float(pedido.total),
                'nome_cliente': pedido.nome_cliente,
                'itens': itens_out
            }
    except Exception as e:
        logger.exception('[pedidos] erro ao criar pedido online: %s', e)
        raise HTTPException(status_code=500, detail='Erro ao criar pedido')


# --- Favoritos (loja online) ---
@app.post('/favoritos/')
def api_create_favorito(payload: dict, request: Request):
    """Cria um favorito no backend. Espera payload com produtoId ou id e opcionalmente usuarioId.
    Se usuário estiver autenticado via cookie JWT, usa esse usuário.
    Retorna o favorito criado ou existente.
    """
    try:
        # log request info for debugging frontend -> backend sync
        try:
            logger.info('[favoritos][CREATE] request received path=%s remote=%s payload=%s', request.url.path, request.client.host if request.client else None, payload)
        except Exception:
            logger.info('[favoritos][CREATE] request received (could not format payload)')

        user = get_user_from_token(request)
        # log auth presence (don't log token value)
        try:
            cookie_present = 'access_token' in request.cookies
        except Exception:
            cookie_present = False
        auth_header = bool(request.headers.get('Authorization'))
        if user:
            logger.info('[favoritos][CREATE] authenticated user id=%s username=%s cookie_present=%s auth_header=%s', getattr(user, 'id', None), getattr(user, 'username', None), cookie_present, auth_header)
        else:
            logger.info('[favoritos][CREATE] no authenticated user; cookie_present=%s auth_header=%s', cookie_present, auth_header)

        produto_id = payload.get('produtoId') or payload.get('id') or payload.get('produto_id')
        if not produto_id:
            raise HTTPException(status_code=400, detail='produtoId é obrigatório')
        user_id = user.id if user else (payload.get('usuarioId') or payload.get('usuario_id') or 1)
        fav = create_favorito(int(user_id), int(produto_id))
        return {'id': fav.id, 'user_id': fav.user_id, 'produto_id': fav.produto_id, 'created_at': fav.created_at.isoformat()}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception('[favoritos] erro ao criar favorito: %s', e)
        raise HTTPException(status_code=500, detail='Erro ao criar favorito')


# --- Avaliações (loja online) ---
@app.post('/avaliacoes/')
def api_create_avaliacao(payload: dict, request: Request):
    """Cria uma avaliação no backend. Espera payload com produtoId, rating e opcionalmente comentario e usuarioId."""
    try:
        try:
            logger.info('[avaliacoes][CREATE] request received path=%s remote=%s payload=%s', request.url.path, request.client.host if request.client else None, payload)
        except Exception:
            logger.info('[avaliacoes][CREATE] request received (could not format payload)')

        user = get_user_from_token(request)
        try:
            cookie_present = 'access_token' in request.cookies
        except Exception:
            cookie_present = False
        auth_header = bool(request.headers.get('Authorization'))
        if user:
            logger.info('[avaliacoes][CREATE] authenticated user id=%s username=%s cookie_present=%s auth_header=%s', getattr(user, 'id', None), getattr(user, 'username', None), cookie_present, auth_header)
        else:
            logger.info('[avaliacoes][CREATE] no authenticated user; cookie_present=%s auth_header=%s', cookie_present, auth_header)

        produto_id = payload.get('produtoId') or payload.get('id') or payload.get('produto_id')
        rating = payload.get('rating') or payload.get('nota')
        comentario = payload.get('comentario') or payload.get('comentary') or ''
        if not produto_id or rating is None:
            raise HTTPException(status_code=400, detail='produtoId e rating são obrigatórios')
        user_id = user.id if user else (payload.get('usuarioId') or payload.get('usuario_id') or 1)
        aval = create_avaliacao(int(user_id), int(produto_id), int(rating), comentario)
        return {'id': aval.id, 'user_id': aval.user_id, 'produto_id': aval.produto_id, 'rating': aval.rating, 'comentario': aval.comentario, 'created_at': aval.created_at.isoformat()}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception('[avaliacoes] erro ao criar avaliacao: %s', e)
        raise HTTPException(status_code=500, detail='Erro ao criar avaliacao')


@app.get('/avaliacoes/')
def api_list_avaliacoes(request: Request, usuarioId: int | None = None):
    """Lista avaliações do usuário autenticado ou do usuarioId passado como query param."""
    try:
        try:
            logger.info('[avaliacoes][LIST] request received path=%s remote=%s query_usuarioId=%s', request.url.path, request.client.host if request.client else None, usuarioId)
        except Exception:
            logger.info('[avaliacoes][LIST] request received (could not format)')

        user = get_user_from_token(request)
        try:
            cookie_present = 'access_token' in request.cookies
        except Exception:
            cookie_present = False
        auth_header = bool(request.headers.get('Authorization'))
        if user:
            logger.info('[avaliacoes][LIST] authenticated user id=%s username=%s cookie_present=%s auth_header=%s', getattr(user, 'id', None), getattr(user, 'username', None), cookie_present, auth_header)
        else:
            logger.info('[avaliacoes][LIST] no authenticated user; cookie_present=%s auth_header=%s query_usuarioId=%s', cookie_present, auth_header, usuarioId)

        user_id = user.id if user else (usuarioId or 1)
        avals = list_avaliacoes(int(user_id))
        out = []
        for a in avals:
            out.append({'id': a.id, 'user_id': a.user_id, 'produto_id': a.produto_id, 'rating': a.rating, 'comentario': a.comentario, 'created_at': a.created_at.isoformat()})
        return out
    except Exception as e:
        logger.exception('[avaliacoes] erro ao listar avaliacoes: %s', e)
        raise HTTPException(status_code=500, detail='Erro ao listar avaliacoes')


@app.delete('/avaliacoes/{produto_id}')
def api_delete_avaliacao(produto_id: int, request: Request, usuarioId: int | None = None):
    """Deleta avaliação do usuário autenticado (ou usuarioId passado) para o produto_id informado."""
    try:
        try:
            logger.info('[avaliacoes][DELETE] request received path=%s remote=%s produto_id=%s query_usuarioId=%s', request.url.path, request.client.host if request.client else None, produto_id, usuarioId)
        except Exception:
            logger.info('[avaliacoes][DELETE] request received (could not format)')

        user = get_user_from_token(request)
        try:
            cookie_present = 'access_token' in request.cookies
        except Exception:
            cookie_present = False
        auth_header = bool(request.headers.get('Authorization'))
        if user:
            logger.info('[avaliacoes][DELETE] authenticated user id=%s username=%s cookie_present=%s auth_header=%s produto_id=%s', getattr(user, 'id', None), getattr(user, 'username', None), cookie_present, auth_header, produto_id)
        else:
            logger.info('[avaliacoes][DELETE] no authenticated user; cookie_present=%s auth_header=%s produto_id=%s query_usuarioId=%s', cookie_present, auth_header, produto_id, usuarioId)

        user_id = user.id if user else (usuarioId or 1)
        ok = delete_avaliacao(int(user_id), int(produto_id))
        if not ok:
            raise HTTPException(status_code=404, detail='Avaliação não encontrada')
        return {'deleted': True}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception('[avaliacoes] erro ao deletar avaliacao: %s', e)
        raise HTTPException(status_code=500, detail='Erro ao deletar avaliacao')


@app.get('/favoritos/')
def api_list_favoritos(request: Request, usuarioId: int | None = None):
    """Lista favoritos do usuário autenticado ou do usuarioId passado como query param."""
    try:
        # log request and query param
        try:
            logger.info('[favoritos][LIST] request received path=%s remote=%s query_usuarioId=%s', request.url.path, request.client.host if request.client else None, usuarioId)
        except Exception:
            logger.info('[favoritos][LIST] request received (could not format)')

        user = get_user_from_token(request)
        try:
            cookie_present = 'access_token' in request.cookies
        except Exception:
            cookie_present = False
        auth_header = bool(request.headers.get('Authorization'))
        if user:
            logger.info('[favoritos][LIST] authenticated user id=%s username=%s cookie_present=%s auth_header=%s', getattr(user, 'id', None), getattr(user, 'username', None), cookie_present, auth_header)
        else:
            logger.info('[favoritos][LIST] no authenticated user; cookie_present=%s auth_header=%s query_usuarioId=%s', cookie_present, auth_header, usuarioId)

        user_id = user.id if user else (usuarioId or 1)
        favs = list_favoritos(int(user_id))
        out = []
        for f in favs:
            out.append({'id': f.id, 'user_id': f.user_id, 'produto_id': f.produto_id, 'created_at': f.created_at.isoformat()})
        return out
    except Exception as e:
        logger.exception('[favoritos] erro ao listar favoritos: %s', e)
        raise HTTPException(status_code=500, detail='Erro ao listar favoritos')


@app.delete('/favoritos/{produto_id}')
def api_delete_favorito(produto_id: int, request: Request, usuarioId: int | None = None):
    """Deleta favorito do usuário autenticado (ou usuarioId passado) para o produto_id informado."""
    try:
        # log delete intent
        try:
            logger.info('[favoritos][DELETE] request received path=%s remote=%s produto_id=%s query_usuarioId=%s', request.url.path, request.client.host if request.client else None, produto_id, usuarioId)
        except Exception:
            logger.info('[favoritos][DELETE] request received (could not format)')

        user = get_user_from_token(request)
        try:
            cookie_present = 'access_token' in request.cookies
        except Exception:
            cookie_present = False
        auth_header = bool(request.headers.get('Authorization'))
        if user:
            logger.info('[favoritos][DELETE] authenticated user id=%s username=%s cookie_present=%s auth_header=%s produto_id=%s', getattr(user, 'id', None), getattr(user, 'username', None), cookie_present, auth_header, produto_id)
        else:
            logger.info('[favoritos][DELETE] no authenticated user; cookie_present=%s auth_header=%s produto_id=%s query_usuarioId=%s', cookie_present, auth_header, produto_id, usuarioId)

        user_id = user.id if user else (usuarioId or 1)
        ok = delete_favorito(int(user_id), int(produto_id))
        if not ok:
            raise HTTPException(status_code=404, detail='Favorito não encontrado')
        return {'deleted': True}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception('[favoritos] erro ao deletar favorito: %s', e)
        raise HTTPException(status_code=500, detail='Erro ao deletar favorito')


@app.get('/pedidos/', response_model=List[dict])
def api_list_pedidos(limit: int = 100):
    """Lista pedidos online recentes."""
    try:
        with CoreSession(expire_on_commit=False) as s:
            pedidos = s.query(PedidoOnline).order_by(PedidoOnline.created_at.desc()).limit(limit).all()
            out = []
            for p in pedidos:
                itens = []
                for it in getattr(p, 'itens', []) or []:
                    itens.append({
                        'id': it.id,
                        'produto_id': it.produto_id,
                        'nome': it.nome,
                        'quantidade': it.quantidade,
                        'preco_unitario': float(it.preco_unitario),
                        'subtotal': float(it.subtotal)
                    })
                out.append({
                    'id': p.id,
                    'numero': p.numero,
                    'status': p.status,
                    'metodo_pagamento': p.metodo_pagamento,
                    'subtotal': float(p.subtotal),
                    'desconto': float(p.desconto),
                    'total': float(p.total),
                    'nome_cliente': p.nome_cliente,
                    'itens': itens
                })
            return out
    except Exception as e:
        logger.exception('[pedidos] erro ao listar pedidos: %s', e)
        raise HTTPException(status_code=500, detail='Erro ao listar pedidos')


# ------------------ Mercado Pago: criar sessão / webhook ------------------
class CreateSessionIn(BaseModel):
    pedido_id: int
    tipoPagamento: str = 'pix'
    cliente: Optional[dict] = None
    retorno: Optional[dict] = None


@app.post('/checkout/create-session')
def api_create_session(payload: CreateSessionIn, request: Request):
    """Cria preferência / pagamento no Mercado Pago e retorna dados para o frontend.
    Usa MP_ACCESS_TOKEN no .env. Retorna init_point ou qr_code em base64.
    """
    try:
        # importar SDK localmente (evita erro se lib não estiver instalada no ambiente de análise)
        try:
            import mercadopago as _mercadopago
        except Exception:
            _mercadopago = None

        if _mercadopago is None:
            logger.error('mercadopago SDK não instalado')
            raise HTTPException(status_code=500, detail='mercadopago SDK não instalado no servidor')

        mp_token = os.environ.get('MP_ACCESS_TOKEN')
        if not mp_token:
            logger.error('MP_ACCESS_TOKEN não configurado')
            raise HTTPException(status_code=500, detail='MP_ACCESS_TOKEN não configurado no servidor')

        sdk = _mercadopago.SDK(mp_token)

        # buscar pedido no DB
        with CoreSession(expire_on_commit=False) as s:
            pedido = s.query(PedidoOnline).filter_by(id=payload.pedido_id).first()
            if not pedido:
                raise HTTPException(status_code=404, detail='Pedido não encontrado')

            # construir items para a preferência
            items = []
            for it in getattr(pedido, 'itens', []) or []:
                items.append({
                    'id': str(it.id),
                    'title': it.nome,
                    'quantity': int(it.quantidade),
                    'unit_price': float(it.preco_unitario)
                })

            notification_url = os.environ.get('MP_NOTIFICATION_URL')

            pref_body = {
                'items': items,
                'external_reference': str(pedido.id),
            }
            if notification_url:
                pref_body['notification_url'] = notification_url

            # se tipo for pix, solicitar pagamento via payment_method_id ou adicional
            if payload.tipoPagamento and payload.tipoPagamento.lower() == 'pix':
                # Mercado Pago tem endpoint especifico para criar payments com qr
                # Aqui usamos a preferência e o checkout tradicional; MP irá expor init_point/qr quando aplicável
                pass

            logger.info('[checkout] criando preferencia MP para pedido=%s', pedido.id)
            result = sdk.preference().create(pref_body)
            status = result.get('status')
            res_body = result.get('response') if isinstance(result, dict) else None

            # salvar referência no pedido
            if res_body:
                pedido.payment_provider = 'mercadopago'
                pedido.payment_id = str(res_body.get('id') or res_body.get('preference_id') or '')
                pedido.payment_status = 'pending'
                s.add(pedido)
                s.commit()

            return JSONResponse(content={'provider': 'mercadopago', 'preference': res_body})
    except HTTPException:
        raise
    except Exception as e:
        logger.exception('[checkout] erro ao criar sessao MP: %s', e)
        raise HTTPException(status_code=500, detail='Erro ao criar sessão de pagamento')


@app.post('/webhooks/mercadopago')
async def api_webhook_mercadopago(request: Request):
    """Recebe notificações do Mercado Pago.
    Valida buscando o payment via API e atualiza o PedidoOnline correspondente.
    """
    try:
        # importar SDK localmente
        try:
            import mercadopago as _mercadopago
        except Exception:
            _mercadopago = None

        if _mercadopago is None:
            logger.error('mercadopago SDK não instalado (webhook)')
            return JSONResponse(status_code=500, content={'ok': False, 'detail': 'mercadopago SDK não instalado'})

        body = await request.json()
        logger.info('[webhook] recebida payload: %s', body)

        # Mercado Pago envia {"type":"payment","data":{"id":<payment_id>}} ou query params
        payment_id = None
        if isinstance(body, dict):
            data = body.get('data') or {}
            payment_id = data.get('id') or body.get('id')

        # fallback: verificar query params (topic and id)
        if not payment_id:
            try:
                params = dict(request.query_params)
                payment_id = params.get('id') or params.get('payment_id')
            except Exception:
                payment_id = None

        if not payment_id:
            logger.warning('[webhook] payment_id não encontrado na notificação')
            return JSONResponse(status_code=400, content={'ok': False, 'detail': 'payment_id not found'})

        mp_token = os.environ.get('MP_ACCESS_TOKEN')
        sdk = _mercadopago.SDK(mp_token)

        # buscar payment para confirmar status
        payment_res = sdk.payment().get(payment_id)
        resp = payment_res.get('response') if isinstance(payment_res, dict) else None
        logger.info('[webhook] consulta MP payment result: %s', resp)

        external_ref = None
        if resp:
            # external_reference pode estar em resp['external_reference'] ou em resp['metadata']
            external_ref = resp.get('external_reference') or (resp.get('metadata') or {}).get('pedido_id')
            status_mp = resp.get('status') or resp.get('payment_status') or resp.get('collection_status')
        else:
            status_mp = None

        if not external_ref:
            logger.warning('[webhook] external_reference não encontrado no payment MP: %s', resp)
            # tentar localizar por payment_id no pedido
            with CoreSession(expire_on_commit=False) as s:
                p = s.query(PedidoOnline).filter_by(payment_id=str(payment_id)).first()
                if p:
                    external_ref = p.id

        if not external_ref:
            logger.error('[webhook] não foi possível vincular notificação a um pedido local')
            return JSONResponse(status_code=404, content={'ok': False, 'detail': 'pedido not found for payment'})

        with CoreSession() as s:
            pedido = s.query(PedidoOnline).filter_by(id=int(external_ref)).first()
            if not pedido:
                logger.error('[webhook] pedido local não encontrado id=%s', external_ref)
                return JSONResponse(status_code=404, content={'ok': False, 'detail': 'pedido not found'})

            # atualizar status com idempotência
            mp_status = str(status_mp or '').lower()
            prev_status = (pedido.payment_status or '').lower() if pedido.payment_status else ''
            if prev_status == 'paid' and mp_status == 'approved':
                logger.info('[webhook] pedido já marcado como pago (id=%s)', pedido.id)
                return JSONResponse(content={'ok': True})

            pedido.payment_provider = 'mercadopago'
            pedido.payment_id = str(payment_id)
            pedido.payment_status = mp_status or 'unknown'
            if mp_status and str(mp_status).lower() in ('approved', 'paid', 'success'):
                pedido.status = 'confirmado'

            s.add(pedido)
            s.commit()

        return JSONResponse(content={'ok': True})
    except Exception as e:
        logger.exception('[webhook] erro ao processar notificacao MP: %s', e)
        return JSONResponse(status_code=500, content={'ok': False, 'detail': 'erro interno'})



@app.put('/mesas/{mesa_id}', response_model=MesaOut)
def api_update_mesa(mesa_id: int, payload: MesaIn):
    """
    Atualiza mesa: tenta atualizar no DB via fisica_views.update_mesa, fallback in-memory.
    """
    try:
        m = db_update_mesa(mesa_id, **payload.dict())
        if m:
            return {
                'id': m.id,
                'nome': m.nome,
                'status': (m.status.capitalize() if isinstance(m.status, str) else m.status),
                'pedido': getattr(m, 'pedido', 0) or 0,
                'slug': getattr(m, 'slug', None) or gerar_slug(m.nome)
            }
    except Exception as e:
        logger.exception('[mesas] erro ao atualizar mesa no DB: %s', e)

    # fallback in-memory
    for mm in MESAS_DB:
        if mm.get('id') == mesa_id:
            mm.update(payload.dict())
            mm['slug'] = mm['nome'].replace(' ', '-').lower()
            return mm
    raise HTTPException(status_code=404, detail='Mesa não encontrada')


@app.delete('/mesas/{mesa_id}')
def api_delete_mesa(mesa_id: int):
    """
    Remove mesa: tenta apagar no DB via fisica_views.delete_mesa, fallback in-memory.
    """
    try:
        ok = db_delete_mesa(mesa_id)
        if ok:
            logger.info('[mesas] deletada mesa no DB id=%s', mesa_id)
            return {'deleted': True}
    except Exception as e:
        logger.exception('[mesas] erro ao deletar mesa no DB: %s', e)

    # fallback in-memory
    for mm in MESAS_DB:
        if mm.get('id') == mesa_id:
            MESAS_DB.remove(mm)
            return {'deleted': True}
    raise HTTPException(status_code=404, detail='Mesa não encontrada')


@app.get('/mesas/slug/{slug}', response_model=MesaOut)
def api_get_mesa_by_slug(slug: str):
    """
    Busca uma mesa pelo slug (case-insensitive). Primeiro tenta buscar no DB pelo campo slug
    (comparação em lowercase). Se não encontrar, gera slug a partir do nome (gerar_slug) e tenta
    casar. Se tudo falhar, usa fallback in-memory MESAS_DB.
    """
    try:
        with CoreSession(expire_on_commit=False) as s:
            # busca case-insensitive no campo slug
            try:
                m = s.query(MesaModel).filter(func.lower(MesaModel.slug) == slug.lower()).first()
            except Exception:
                m = None
            if m:
                itens_out = []
                try:
                    pedidos = sorted(m.pedidos, key=lambda p: getattr(p, 'created_at', 0), reverse=True)
                    # escolher o último pedido pendente (se houver)
                    last_pedido = next((p for p in pedidos if getattr(p, 'status', None) == 'pendente'), None)
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

                # Preferir expor o número do último pedido pendente, se existir
                display_pedido = 0
                try:
                    pedidos = sorted(m.pedidos, key=lambda p: getattr(p, 'created_at', 0), reverse=True)
                    last_pedido = next((p for p in pedidos if getattr(p, 'status', None) == 'pendente'), None)
                    if last_pedido:
                        display_pedido = getattr(last_pedido, 'numero', 0) or 0
                except Exception:
                    display_pedido = getattr(m, 'pedido', 0) or 0

                return {
                    'id': m.id,
                    'nome': m.nome,
                    'status': (m.status.capitalize() if isinstance(m.status, str) else m.status),
                    'pedido': display_pedido,
                    'slug': getattr(m, 'slug', None) or gerar_slug(m.nome),
                    'itens': itens_out
                }

            # fallback: procurar gerando slug a partir do nome
            ms = s.query(MesaModel).all()
            for m2 in ms:
                if gerar_slug(m2.nome).lower() == slug.lower():
                        itens_out = []
                        try:
                            pedidos = sorted(m2.pedidos, key=lambda p: getattr(p, 'created_at', 0), reverse=True)
                            # escolher o último pedido pendente (se houver)
                            last_pedido = next((p for p in pedidos if getattr(p, 'status', None) == 'pendente'), None)
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
                            itens_out = []
                        return {
                            'id': m2.id,
                            'nome': m2.nome,
                            'status': (m2.status.capitalize() if isinstance(m2.status, str) else m2.status),
                            'pedido': getattr(m2, 'pedido', 0) or 0,
                            'slug': getattr(m2, 'slug', None) or gerar_slug(m2.nome),
                            'itens': itens_out
                        }
    except Exception as e:
        logger.exception('[mesas] erro ao buscar mesa por slug no DB: %s', e)

    # fallback in-memory
    for mm in MESAS_DB:
        try:
            if (mm.get('slug') and mm.get('slug').lower() == slug.lower()) or (str(mm.get('nome')).lower() == slug.lower()) or (gerar_slug(mm.get('nome')).lower() == slug.lower()):
                return mm
        except Exception:
            continue

    raise HTTPException(status_code=404, detail='Mesa não encontrada')

# --- User models and endpoints ---
@app.get("/ping")
def ping():
    """
    Endpoint de saúde. Retorna status 'ok' para indicar que o backend está online.
    """
    return {"status": "ok"}


@app.post("/users/", response_model=UserOut)
def api_create_user(payload: UserCreate):
    """
    Cria um novo usuário.
    Parâmetros:
        payload: UserCreate - dados do usuário
    Retorno:
        UserOut - dados do usuário criado
    """
    # Mapear tipo recebido para o Enum
    tipo_map = {
        "online": UserType.online,
        "fisica": UserType.fisica,
        "admin": UserType.admin,
    }
    tipo = tipo_map.get(payload.tipo.lower(), UserType.online)
    user = create_user(payload.username, payload.email, payload.nome, payload.password, tipo=tipo)
    if not user:
        raise HTTPException(status_code=400, detail="Não foi possível criar o usuário")
    return UserOut(
        id=user.id,
        username=user.username,
        email=user.email,
        nome=user.nome,
        # Usar .name retorna 'online'|'fisica'|'admin' compatível com o frontend
        tipo=user.tipo.name if hasattr(user.tipo, 'name') else str(user.tipo),
    )


@app.get("/users/{username}", response_model=UserOut)
def api_get_user(username: str):
    """
    Busca um usuário pelo username.
    Parâmetros:
        username: str - nome de usuário
    Retorno:
        UserOut se encontrado, senão erro 404
    """
    u = get_user(username)
    if not u:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return UserOut(
        id=u.id,
        username=u.username,
        email=u.email,
        nome=u.nome,
        tipo=u.tipo.name if hasattr(u.tipo, 'name') else str(u.tipo),
    )


@app.delete("/users/{username}")
def api_delete_user(username: str):
    """
    Remove um usuário pelo username.
    Parâmetros:
        username: str - nome de usuário
    Retorno:
        {'deleted': True} se sucesso, senão erro 404
    """
    ok = delete_user(username)
    if not ok:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {"deleted": True}


# --- Pontos de extremidade de conveniência de autenticação (controlados por backend) ---
class LoginIn(BaseModel):
    email: EmailStr
    password: str


class RegisterIn(BaseModel):
    nome: str
    email: EmailStr
    password: str
    tipo: Optional[str] = "online"


@app.post('/auth/login')
def api_login(payload: LoginIn):
    """
    Realiza login do usuário via email e senha.
    Parâmetros:
        payload: LoginIn - email e senha
    Retorno:
        Dados do usuário autenticado e cookie JWT
    """
    # busca pelo email e verifica senha
    logger.info('[auth.login] attempt login for: %s', payload.email)
    user = get_user_by_email(payload.email)
    if not user or not user.check_password(payload.password):
        logger.info('[auth.login] invalid credentials for: %s', payload.email)
        raise HTTPException(status_code=401, detail='Credenciais inválidas')

    # gerar JWT
    secret = os.environ.get('JWT_SECRET', 'devsecret')
    exp_minutes = int(os.environ.get('JWT_EXP_MINUTES', '1440'))  # 24 horas
    payload_jwt = {
        'sub': str(user.id),
        'email': user.email,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=exp_minutes)
    }
    token = jwt.encode(payload_jwt, secret, algorithm='HS256')

    # definir cookie httpOnly
    response = JSONResponse(content={
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'nome': user.nome,
        # Enviar tipo como nome do enum (ex: 'online', 'fisica', 'admin')
        'tipo': user.tipo.name if hasattr(user.tipo, 'name') else str(user.tipo)
    })
    response.set_cookie(key='access_token', value=token, httponly=True, samesite='lax', max_age=exp_minutes * 60)
    return response


@app.post('/auth/register')
def api_register(payload: RegisterIn):
    """
    Realiza cadastro de novo usuário.
    Parâmetros:
        payload: RegisterIn - nome, email, senha, tipo
    Retorno:
        Dados do usuário criado e cookie JWT
    """
    logger.info('[auth.register] attempt register for: %s nome=%s tipo=%s', payload.email, payload.nome, payload.tipo)
    # Verifica se email já existe
    existing_user = get_user_by_email(payload.email)
    if existing_user:
        logger.info('[auth.register] email already exists: %s', payload.email)
        raise HTTPException(status_code=400, detail='Email já cadastrado')
    
    # cria usuário usando create_user; usamos email (parte local) como username por conveniência
    username = payload.email.split('@')[0]
    tipo_map = {
        'online': UserType.online,
        'fisica': UserType.fisica,
        'admin': UserType.admin,
    }
    tipo = tipo_map.get((payload.tipo or 'online').lower(), UserType.online)
    user = create_user(username, payload.email, payload.nome, payload.password, tipo=tipo)
    
    if not user:
        logger.info('[auth.register] create_user returned falsy for: %s', payload.email)
        raise HTTPException(status_code=400, detail='Não foi possível criar o usuário')
    
    # Login automático após o registro - gerar JWT
    secret = os.environ.get('JWT_SECRET', 'devsecret')
    exp_minutes = int(os.environ.get('JWT_EXP_MINUTES', '1440'))  # 24 horas
    payload_jwt = {
        'sub': str(user.id),
        'email': user.email,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=exp_minutes)
    }
    token = jwt.encode(payload_jwt, secret, algorithm='HS256')
    
    response = JSONResponse(content={
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'nome': user.nome,
        'tipo': user.tipo.name if hasattr(user.tipo, 'name') else str(user.tipo)
    })
    response.set_cookie(key='access_token', value=token, httponly=True, samesite='lax', max_age=exp_minutes * 60)
    return response



def get_user_from_token(request: Request):
    """
    Função auxiliar para extrair e validar o token JWT do cookie ou header.
    Parâmetros:
        request: Request - requisição HTTP
    Retorno:
        Usuário autenticado ou None
    """
    from jwt import InvalidTokenError

    token = request.cookies.get('access_token') or request.headers.get('Authorization')
    if not token:
        return None
    # se token vier com "Bearer <token>"
    if token.startswith('Bearer '):
        token = token.split(' ', 1)[1]

    SECRET = os.environ.get('JWT_SECRET', 'devsecret')
    ALGORITHMS = ['HS256']

    try:
        payload = jwt.decode(token, SECRET, algorithms=ALGORITHMS)
    except InvalidTokenError:
        return None

    user_id = payload.get('sub') or payload.get('user_id')
    if not user_id:
        return None

    return get_user_by_id(int(user_id))


@app.get('/auth/me')
def api_me(request: Request):
    """
    Retorna os dados do usuário autenticado.
    Parâmetros:
        request: Request - requisição HTTP
    Retorno:
        Dados do usuário (id, username, email, nome, tipo, datas)
        Se não autenticado, retorna erro 401
    """
    u = get_user_from_token(request)
    if not u:
        raise HTTPException(status_code=401, detail='Not authenticated')
    return {
        'id': u.id,
        'username': u.username,
        'email': u.email,
        'nome': u.nome,
        'tipo': u.tipo.name if hasattr(u.tipo, 'name') else str(u.tipo),
        'created_at': u.created_at.isoformat() if hasattr(u, 'created_at') and u.created_at else None,
        'updated_at': u.updated_at.isoformat() if hasattr(u, 'updated_at') and u.updated_at else None
    }


@app.post('/auth/logout')
def api_logout(response: Response):
    """
    Efetua logout do usuário, removendo o cookie de autenticação.
    Parâmetros:
        response: Response - resposta HTTP
    Retorno:
        Mensagem de sucesso
    """
    # Clear cookie
    resp = JSONResponse(content={'detail': 'logged out'})
    resp.delete_cookie('access_token', path='/')
    return resp


# === ESTOQUE ===
class MovimentacaoEstoqueIn(BaseModel):
    produtoId: int
    produtoNome: str | None = None
    tipo: str  # 'entrada' ou 'saida'
    quantidade: int
    origem: str
    data: str | None = None
    observacoes: str | None = None
    referencia: str | None = None


class MovimentacaoEstoqueOut(BaseModel):
    id: int
    produtoId: int
    produtoNome: str
    tipo: str
    quantidade: int
    origem: str
    data: str
    observacoes: str | None = None
    referencia: str | None = None


@app.get('/estoque/movimentacoes', response_model=list[MovimentacaoEstoqueOut])
def api_list_movimentacoes(request: Request):
    """
    Lista todas as movimentações de estoque.
    """
    from backend.fisica_models import MovimentacaoEstoque
    
    try:
        with CoreSession(expire_on_commit=False) as s:
            movimentacoes = s.query(MovimentacaoEstoque).order_by(MovimentacaoEstoque.created_at.desc()).all()
            result = []
            for mov in movimentacoes:
                # Mapear origem do backend para frontend
                origem_map = {
                    'venda_fisica': 'venda_fisica',
                    'venda_online': 'venda_online',
                    'compra': 'produto_cadastro',
                    'ajuste_manual': 'produto_cadastro',
                    'reserva_mesa': 'venda_fisica'
                }
                origem_frontend = origem_map.get(mov.origem, mov.origem)
                
                result.append({
                    'id': mov.id,
                    'produtoId': mov.produto_id,
                    'produtoNome': mov.produto.nome if mov.produto else '',
                    'tipo': mov.tipo,
                    'quantidade': abs(mov.quantidade),
                    'origem': origem_frontend,
                    'data': mov.created_at.date().isoformat() if mov.created_at else '',
                    'observacoes': mov.observacao,
                    'referencia': str(mov.pedido_local_id) if mov.pedido_local_id else None
                })
            return result
    except Exception as e:
        logger.exception('[estoque] erro ao listar movimentações: %s', e)
        raise HTTPException(status_code=500, detail='Erro ao listar movimentações')


@app.post('/estoque/movimentacoes')
def api_add_movimentacao(payload: MovimentacaoEstoqueIn, request: Request):
    """
    Adiciona uma movimentação de estoque e atualiza o estoque do produto.
    """
    from backend.fisica_models import MovimentacaoEstoque
    
    try:
        # Obter usuário autenticado
        user = get_user_from_token(request)
        usuario_id = user.id if user else 1  # fallback para usuario 1 se não autenticado
        
        with CoreSession(expire_on_commit=False) as s:
            # Buscar produto
            produto = s.query(Produto).get(payload.produtoId)
            if not produto:
                raise HTTPException(status_code=404, detail='Produto não encontrado')
            
            # Calcular nova quantidade de estoque
            quantidade_anterior = produto.estoque
            if payload.tipo == 'entrada':
                quantidade_nova = quantidade_anterior + payload.quantidade
                quantidade_movimentacao = payload.quantidade
            elif payload.tipo == 'saida':
                quantidade_nova = max(0, quantidade_anterior - payload.quantidade)
                quantidade_movimentacao = -payload.quantidade
            else:
                raise HTTPException(status_code=400, detail='Tipo inválido (use entrada ou saida)')
            
            # Mapear origem frontend para backend
            origem_map = {
                'produto_cadastro': 'compra',
                'venda_online': 'venda_online',
                'venda_fisica': 'venda_fisica',
                'cancelamento_venda_online': 'venda_online',
                'cancelamento_venda_fisica': 'venda_fisica'
            }
            origem_backend = origem_map.get(payload.origem, 'ajuste_manual')
            
            # Criar movimentação
            mov = MovimentacaoEstoque(
                produto_id=payload.produtoId,
                tipo=payload.tipo if payload.tipo in ['entrada', 'saida'] else 'ajuste',
                origem=origem_backend,
                quantidade=quantidade_movimentacao,
                quantidade_anterior=quantidade_anterior,
                quantidade_nova=quantidade_nova,
                usuario_id=usuario_id,
                observacao=payload.observacoes or '',
                pedido_local_id=int(payload.referencia) if payload.referencia and payload.referencia.isdigit() else None
            )
            s.add(mov)
            
            # Atualizar estoque do produto
            produto.estoque = quantidade_nova
            s.add(produto)
            
            s.commit()
            
            logger.info('[estoque] movimentação criada: %s %sx %s (estoque: %s → %s)', mov.tipo, abs(mov.quantidade), produto.nome, quantidade_anterior, quantidade_nova)
            
            return {'id': mov.id, 'success': True}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.exception('[estoque] erro ao adicionar movimentação: %s', e)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=True)

