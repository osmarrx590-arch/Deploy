from fastapi import FastAPI, Depends, HTTPException, Response, Cookie, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from backend import crud, models, schemas
from .database import engine, get_db
import os
import requests
from pydantic import BaseModel
from typing import Dict, Any

# Criar tabelas no banco de dados
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Choperia API")

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
        from backend import models  # noqa: F401 (import for side-effects)

    except Exception:
        pass

    # Agora criar todas as tabelas registradas na metadata compartilhada
    try:
        # Usar o engine já importado no módulo para garantir criação de tabelas.
        models.Base.metadata.create_all(bind=engine)
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

# Configurar CORS
# Configurar CORS para permitir origens locais e Lovable
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.(lovable\.app|lovableproject\.com)|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# User endpoints
@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)


# Auth endpoints (login / me / logout) - cookie-based dev helpers
@app.post('/auth/login')
def auth_login(payload: dict, response: Response, db: Session = Depends(get_db)):
    username = payload.get('username') or payload.get('email')
    password = payload.get('password')
    if not username or not password:
        raise HTTPException(status_code=400, detail='username and password required')

    user = crud.get_user_by_username(db, username=username) or crud.get_user_by_email(db, email=username)
    if not user or not user.check_password(password):
        raise HTTPException(status_code=401, detail='Invalid credentials')

    # Salva cookie de sessão (httpOnly) e retorna payload serializável
    response.set_cookie(key='session', value=str(user.id), httponly=True, samesite='lax')
    try:
        # Usa o schema Pydantic para garantir serialização correta do usuário
        user_data = schemas.User.from_orm(user).dict()
    except Exception:
        # Fallback: construir dicionário manualmente
        user_data = {
            'id': user.id,
            'username': getattr(user, 'username', None),
            'email': getattr(user, 'email', None),
            'nome': getattr(user, 'nome', None),
            'tipo': getattr(user, 'tipo', None),
            'created_at': getattr(user, 'created_at', None)
        }

    return {'access_token': '', 'user': user_data}


@app.get('/auth/me', response_model=schemas.User)
def auth_me(session: str | None = Cookie(None), db: Session = Depends(get_db)):
    if not session:
        raise HTTPException(status_code=401, detail='Not authenticated')
    try:
        user_id = int(session)
    except Exception:
        raise HTTPException(status_code=401, detail='Invalid session')
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    return user


@app.post('/auth/logout')
def auth_logout(response: Response):
    response.delete_cookie('session')
    return {'status': 'ok'}

@app.get("/users/", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

@app.get("/users/{user_id}", response_model=schemas.User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

# Categoria endpoints
@app.post("/categorias/", response_model=schemas.Categoria)
def create_categoria(categoria: schemas.CategoriaCreate, db: Session = Depends(get_db)):
    return crud.create_categoria(db=db, categoria=categoria)

@app.get("/categorias/", response_model=List[schemas.Categoria])
def read_categorias(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    categorias = crud.get_categorias(db, skip=skip, limit=limit)
    return categorias

# Produto endpoints
@app.post("/produtos/", response_model=schemas.Produto)
def create_produto(produto: schemas.ProdutoCreate, db: Session = Depends(get_db)):
    return crud.create_produto(db=db, produto=produto)

@app.get("/produtos/", response_model=List[schemas.Produto])
def read_produtos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    produtos = crud.get_produtos(db, skip=skip, limit=limit)
    return produtos

@app.get("/produtos/{produto_id}", response_model=schemas.Produto)
def read_produto(produto_id: int, db: Session = Depends(get_db)):
    db_produto = crud.get_produto(db, produto_id=produto_id)
    if db_produto is None:
        raise HTTPException(status_code=404, detail="Produto not found")
    return db_produto

@app.put("/produtos/{produto_id}", response_model=schemas.Produto)
def update_produto(produto_id: int, produto: schemas.ProdutoCreate, db: Session = Depends(get_db)):
    db_produto = crud.get_produto(db, produto_id=produto_id)
    if db_produto is None:
        raise HTTPException(status_code=404, detail="Produto not found")
    for key, value in produto.dict().items():
        setattr(db_produto, key, value)
    db.commit()
    db.refresh(db_produto)
    return db_produto

@app.delete("/produtos/{produto_id}")
def delete_produto(produto_id: int, db: Session = Depends(get_db)):
    db_produto = crud.get_produto(db, produto_id=produto_id)
    if db_produto is None:
        raise HTTPException(status_code=404, detail="Produto not found")
    db.delete(db_produto)
    db.commit()
    return {"status": "success"}

# Mesa endpoints
@app.post("/mesas/", response_model=schemas.Mesa)
def create_mesa(mesa: schemas.MesaCreate, db: Session = Depends(get_db)):
    return crud.create_mesa(db=db, mesa=mesa)

@app.get("/mesas/", response_model=List[schemas.Mesa])
def read_mesas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    mesas = crud.get_mesas(db, skip=skip, limit=limit)
    result = []
    for db_mesa in mesas:
        # Anexar itens do pedido pendente para cada mesa
        pedido_pendente = crud.get_pedido_pendente_por_mesa(db, mesa_id=db_mesa.id)
        itens = []
        pedido_numero: Optional[str] = None
        if pedido_pendente:
            pedido_numero = getattr(pedido_pendente, 'numero', None)
            for it in pedido_pendente.itens:
                try:
                    produto = it.produto
                    itens.append({
                        'id': it.id,
                        'nome': produto.nome if produto else '',
                        'quantidade': int(it.quantidade),
                        'venda': float(it.preco_unitario),
                        'total': float(it.subtotal),
                        'produtoId': int(it.produto_id),
                        'mesaId': db_mesa.id,
                        'precoUnitario': float(it.preco_unitario),
                        'status': 'ativo'
                    })
                except Exception:
                    continue

        result.append({
            'id': db_mesa.id,
            'nome': db_mesa.nome,
            'status': db_mesa.status,
            'capacidade': db_mesa.capacidade,
            'observacoes': db_mesa.observacoes,
            'slug': db_mesa.slug,
            'pedido': pedido_numero or None,
            'itens': itens,
            'usuario_responsavel_id': db_mesa.usuario_responsavel_id,
            'statusPedido': getattr(db_mesa, 'statusPedido', None)
        })
    return result

@app.get("/mesas/slug/{slug}", response_model=schemas.Mesa)
def read_mesa_by_slug(slug: str, db: Session = Depends(get_db)):
    db_mesa = crud.get_mesa_by_slug(db, slug=slug)
    if db_mesa is None:
        raise HTTPException(status_code=404, detail="Mesa not found")

    # Tentar anexar itens do pedido pendente (se houver) para compatibilidade com frontend
    pedido_pendente = crud.get_pedido_pendente_por_mesa(db, mesa_id=db_mesa.id)
    itens = []
    pedido_numero: Optional[str] = None
    if pedido_pendente:
        pedido_numero = getattr(pedido_pendente, 'numero', None)
        # Mapear itens do pedido para formato esperado pelo frontend (ItemMesa / ItemBase)
        for it in pedido_pendente.itens:
            try:
                produto = it.produto
                itens.append({
                    'id': it.id,
                    'nome': produto.nome if produto else '',
                    'quantidade': int(it.quantidade),
                    'venda': float(it.preco_unitario),
                    'total': float(it.subtotal),
                    'produtoId': int(it.produto_id),
                    'mesaId': db_mesa.id,
                    'precoUnitario': float(it.preco_unitario),
                    'status': 'ativo'
                })
            except Exception:
                continue

    # Construir resposta combinada (mesa + pedido itens)
    # Atenção: usar chaves que correspondam ao schema `schemas.Mesa` para
    # evitar ResponseValidationError ao serializar a resposta.
    resp = {
        'id': db_mesa.id,
        'nome': db_mesa.nome,
        'status': db_mesa.status,
        'pedido': pedido_numero or None,
        'itens': itens,
        'slug': db_mesa.slug,
        # campo esperado pelo schema Mesa
        'usuario_responsavel_id': db_mesa.usuario_responsavel_id,
        'statusPedido': getattr(db_mesa, 'statusPedido', None)
    }
    return resp

@app.get("/mesas/{mesa_id}", response_model=schemas.Mesa)
def read_mesa(mesa_id: int, db: Session = Depends(get_db)):
    db_mesa = crud.get_mesa(db, mesa_id=mesa_id)
    if db_mesa is None:
        raise HTTPException(status_code=404, detail="Mesa not found")

    # Anexar itens do pedido pendente (mesma lógica do endpoint by slug)
    pedido_pendente = crud.get_pedido_pendente_por_mesa(db, mesa_id=db_mesa.id)
    itens = []
    pedido_numero: Optional[str] = None
    if pedido_pendente:
        pedido_numero = getattr(pedido_pendente, 'numero', None)
        for it in pedido_pendente.itens:
            try:
                produto = it.produto
                itens.append({
                    'id': it.id,
                    'nome': produto.nome if produto else '',
                    'quantidade': int(it.quantidade),
                    'venda': float(it.preco_unitario),
                    'total': float(it.subtotal),
                    'produtoId': int(it.produto_id),
                    'mesaId': db_mesa.id,
                    'precoUnitario': float(it.preco_unitario),
                    'status': 'ativo'
                })
            except Exception:
                continue

    resp = {
        'id': db_mesa.id,
        'nome': db_mesa.nome,
        'status': db_mesa.status,
        'pedido': pedido_numero or None,
        'itens': itens,
        'slug': db_mesa.slug,
        'usuario_responsavel_id': db_mesa.usuario_responsavel_id,
        'statusPedido': getattr(db_mesa, 'statusPedido', None)
    }
    return resp

@app.put("/mesas/{mesa_id}", response_model=schemas.Mesa)
def update_mesa(mesa_id: int, mesa: schemas.MesaBase, db: Session = Depends(get_db)):
    db_mesa = crud.update_mesa_status(db, mesa_id=mesa_id, status=mesa.status)
    if db_mesa is None:
        raise HTTPException(status_code=404, detail="Mesa not found")
    return db_mesa

@app.delete("/mesas/{mesa_id}")
def delete_mesa(mesa_id: int, db: Session = Depends(get_db)):
    db_mesa = crud.get_mesa(db, mesa_id=mesa_id)
    if db_mesa is None:
        raise HTTPException(status_code=404, detail="Mesa not found")
    db.delete(db_mesa)
    db.commit()
    return {"status": "success"}

# Pedido endpoints
@app.post("/pedidos/", response_model=schemas.Pedido)
def create_pedido(payload: dict, db: Session = Depends(get_db)):
    """Cria um pedido.

    Aceita JSON no corpo com a estrutura do pedido. Exemplos esperados:
    - { "itens": [...], "tipo": "online", "status": "...", "usuarioId": 1 }
    - ou { "pedido": { ... }, "usuarioId": 1 }
    """
    # Suportar envelope { "pedido": {...}, "usuarioId": X } ou corpo direto
    pedido_data = payload.get('pedido') if isinstance(payload, dict) and payload.get('pedido') else payload
    usuario_id = None
    if isinstance(payload, dict):
        usuario_id = payload.get('usuarioId') or payload.get('usuario_id')
        # também tentar dentro de pedido_data (caso envelope)
        if not usuario_id and isinstance(pedido_data, dict):
            usuario_id = pedido_data.get('usuarioId') or pedido_data.get('usuario_id')

    if usuario_id is None:
        raise HTTPException(status_code=400, detail='usuarioId is required in request body')

    # Construir pydantic model para validação/compatibilidade com crud.create_pedido
    try:
        pedido_obj = schemas.PedidoCreate(**pedido_data) if isinstance(pedido_data, dict) else schemas.PedidoCreate(**{ 'itens': [] })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f'Invalid pedido payload: {e}')

    return crud.create_pedido(db=db, pedido=pedido_obj, usuario_id=int(usuario_id))

@app.get("/pedidos/", response_model=List[schemas.Pedido])
def read_pedidos(
    skip: int = 0,
    limit: int = 100,
    tipo: Optional[str] = None,
    db: Session = Depends(get_db)
):
    pedidos = crud.get_pedidos(db, skip=skip, limit=limit, tipo=tipo)
    return pedidos

@app.get("/pedidos/{pedido_id}", response_model=schemas.Pedido)
def read_pedido(pedido_id: int, db: Session = Depends(get_db)):
    db_pedido = crud.get_pedido(db, pedido_id=pedido_id)
    if db_pedido is None:
        raise HTTPException(status_code=404, detail="Pedido not found")
    return db_pedido

@app.put("/pedidos/{pedido_id}/status")
def update_pedido_status(pedido_id: int, payload: dict, db: Session = Depends(get_db)):
    status = payload.get("status")
    if not status:
        raise HTTPException(status_code=400, detail="Status is required")
    db_pedido = crud.get_pedido(db, pedido_id=pedido_id)
    if db_pedido is None:
        raise HTTPException(status_code=404, detail="Pedido not found")
    db_pedido.status = status
    db.commit()
    db.refresh(db_pedido)
    return db_pedido

@app.get("/mesas/{mesa_id}/pedido-pendente", response_model=Optional[schemas.Pedido])
def read_pedido_pendente_mesa(mesa_id: int, db: Session = Depends(get_db)):
    return crud.get_pedido_pendente_por_mesa(db, mesa_id=mesa_id)


# Endpoints para adicionar/remover itens em mesa
@app.post('/mesas/{mesa_id}/itens')
def add_item_mesa(mesa_id: int, payload: dict, db: Session = Depends(get_db)):
    produto_id = payload.get('produtoId') or payload.get('produto_id')
    quantidade = payload.get('quantidade')
    usuario_id = payload.get('usuarioId') or payload.get('usuario_id')
    preco = payload.get('precoUnitario') or payload.get('preco_unitario')
    numero = payload.get('numero')

    if not produto_id or quantidade is None:
        raise HTTPException(status_code=400, detail='produtoId e quantidade são obrigatórios')

    try:
        pedido = crud.add_item_to_pedido(db=db, mesa_id=mesa_id, produto_id=int(produto_id), quantidade=int(quantidade), usuario_id=usuario_id, preco_unitario=preco, numero_sugerido=numero)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Erro ao adicionar item: {e}')

    return { 'pedido': pedido.id, 'pedidoNumero': pedido.numero, 'pedidoId': pedido.id, 'mesa': mesa_id }


@app.delete('/mesas/{mesa_id}/itens/{item_id}')
def delete_item_mesa(mesa_id: int, item_id: int, db: Session = Depends(get_db)):
    try:
        pedido = crud.remove_item_from_pedido(db=db, item_id=item_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Erro ao remover item: {e}')

    if pedido is None:
        raise HTTPException(status_code=404, detail='Item não encontrado')

    return { 'pedido': pedido.id, 'pedidoNumero': pedido.numero, 'pedidoId': pedido.id, 'mesa': mesa_id }

# Avaliacoes endpoints
@app.post("/produtos/{produto_id}/avaliacoes/")
def create_produto_avaliacao(produto_id: int, payload: dict = {}, db: Session = Depends(get_db)):
    """Cria uma avaliação para um produto. Aceita JSON no body com keys: rating, usuarioId/usuario_id, comentario."""
    # aceitar tanto camelCase quanto snake_case
    rating = None
    usuario_id = None
    comentario = None
    if isinstance(payload, dict):
        rating = payload.get('rating') or payload.get('nota')
        usuario_id = payload.get('usuarioId') or payload.get('usuario_id')
        comentario = payload.get('comentario') or payload.get('comentario')

    # fallback para query params se frontend enviar assim (compatibilidade)
    if rating is None:
        raise HTTPException(status_code=400, detail='rating is required')
    if usuario_id is None:
        raise HTTPException(status_code=400, detail='usuarioId is required')

    return crud.create_avaliacao(
        db=db,
        usuario_id=int(usuario_id),
        produto_id=int(produto_id),
        rating=int(rating),
        comentario=comentario
    )

@app.get("/produtos/{produto_id}/avaliacoes/")
def read_produto_avaliacoes(produto_id: int, db: Session = Depends(get_db)):
    return crud.get_avaliacoes_produto(db, produto_id=produto_id)


# Rotas compatíveis com frontend (root)
@app.post("/avaliacoes/")
def create_avaliacao_root(payload: dict, session: str | None = Cookie(None), db: Session = Depends(get_db)):
    """Cria avaliação aceitando payload { produtoId, rating, comentario } e usando usuarioId do cookie de sessão quando disponível."""
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail='Invalid payload')
    produto_id = payload.get('produtoId') or payload.get('produto_id')
    rating = payload.get('rating')
    comentario = payload.get('comentario')
    usuario_id = payload.get('usuarioId') or payload.get('usuario_id')
    if usuario_id is None and session:
        try:
            usuario_id = int(session)
        except Exception:
            usuario_id = None
    if produto_id is None or rating is None:
        raise HTTPException(status_code=400, detail='produtoId and rating are required')
    if usuario_id is None:
        raise HTTPException(status_code=401, detail='Not authenticated')
    return crud.create_avaliacao(db=db, usuario_id=int(usuario_id), produto_id=int(produto_id), rating=int(rating), comentario=comentario)


@app.get("/avaliacoes/{produto_id}")
def read_avaliacoes_root(produto_id: int, db: Session = Depends(get_db)):
    return crud.get_avaliacoes_produto(db, produto_id=produto_id)

# Favoritos endpoints
@app.post("/produtos/{produto_id}/favoritos/{usuario_id}")
def create_produto_favorito(produto_id: int, usuario_id: int, db: Session = Depends(get_db)):
    return crud.create_favorito(db=db, usuario_id=usuario_id, produto_id=produto_id)


@app.post("/produtos/{produto_id}/favoritos/")
def create_produto_favorito_body(produto_id: int, payload: dict = {}, db: Session = Depends(get_db)):
    """Cria favorito aceitando JSON no body: { "usuarioId": 1 }"""
    usuario_id = None
    if isinstance(payload, dict):
        usuario_id = payload.get('usuarioId') or payload.get('usuario_id')
    if usuario_id is None:
        raise HTTPException(status_code=400, detail='usuarioId is required in body')
    return crud.create_favorito(db=db, usuario_id=int(usuario_id), produto_id=int(produto_id))

@app.get("/usuarios/{usuario_id}/favoritos/")
def read_usuario_favoritos(usuario_id: int, db: Session = Depends(get_db)):
    return crud.get_favoritos_usuario(db, usuario_id=usuario_id)

@app.delete("/produtos/{produto_id}/favoritos/{usuario_id}")
def delete_produto_favorito(produto_id: int, usuario_id: int, db: Session = Depends(get_db)):
    success = crud.remove_favorito(db=db, usuario_id=usuario_id, produto_id=produto_id)
    if not success:
        raise HTTPException(status_code=404, detail="Favorito not found")
    return {"status": "success"}


# Rotas compatíveis com frontend (root /favoritos)
@app.post('/favoritos/')
def create_favorito_root(payload: dict, session: str | None = Cookie(None), db: Session = Depends(get_db)):
    """Cria favorito a partir de { produtoId } no body. Usa cookie de sessão para identificar usuário quando presente."""
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail='Invalid payload')
    produto_id = payload.get('produtoId') or payload.get('produto_id')
    usuario_id = payload.get('usuarioId') or payload.get('usuario_id')
    if usuario_id is None and session:
        try:
            usuario_id = int(session)
        except Exception:
            usuario_id = None
    if produto_id is None:
        raise HTTPException(status_code=400, detail='produtoId is required')
    if usuario_id is None:
        raise HTTPException(status_code=401, detail='Not authenticated')
    return crud.create_favorito(db=db, usuario_id=int(usuario_id), produto_id=int(produto_id))


@app.delete('/favoritos/{produto_id}')
def delete_favorito_root(produto_id: int, session: str | None = Cookie(None), db: Session = Depends(get_db)):
    usuario_id = None
    if session:
        try:
            usuario_id = int(session)
        except Exception:
            usuario_id = None
    if usuario_id is None:
        raise HTTPException(status_code=401, detail='Not authenticated')
    success = crud.remove_favorito(db=db, usuario_id=int(usuario_id), produto_id=produto_id)
    if not success:
        raise HTTPException(status_code=404, detail='Favorito not found')
    return { 'status': 'success' }


@app.get('/favoritos/')
def read_favoritos_root(session: str | None = Cookie(None), db: Session = Depends(get_db)):
    usuario_id = None
    if session:
        try:
            usuario_id = int(session)
        except Exception:
            usuario_id = None
    if usuario_id is None:
        raise HTTPException(status_code=401, detail='Not authenticated')
    return crud.get_favoritos_usuario(db=db, usuario_id=int(usuario_id))

# Empresa endpoints
@app.post("/empresas/", response_model=schemas.Empresa)
def create_empresa(empresa: schemas.EmpresaCreate, db: Session = Depends(get_db)):
    return crud.create_empresa(db=db, empresa=empresa)

@app.get("/empresas/", response_model=List[schemas.Empresa])
def read_empresas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    empresas = crud.get_empresas(db, skip=skip, limit=limit)
    return empresas

@app.get("/empresas/{empresa_id}", response_model=schemas.Empresa)
def read_empresa(empresa_id: int, db: Session = Depends(get_db)):
    db_empresa = crud.get_empresa(db, empresa_id=empresa_id)
    if db_empresa is None:
        raise HTTPException(status_code=404, detail="Empresa not found")
    return db_empresa

@app.put("/empresas/{empresa_id}", response_model=schemas.Empresa)
def update_empresa(empresa_id: int, empresa: schemas.EmpresaCreate, db: Session = Depends(get_db)):
    db_empresa = crud.get_empresa(db, empresa_id=empresa_id)
    if db_empresa is None:
        raise HTTPException(status_code=404, detail="Empresa not found")
    for key, value in empresa.dict().items():
        setattr(db_empresa, key, value)
    db.commit()
    db.refresh(db_empresa)
    return db_empresa

@app.delete("/empresas/{empresa_id}")
def delete_empresa(empresa_id: int, db: Session = Depends(get_db)):
    db_empresa = crud.get_empresa(db, empresa_id=empresa_id)
    if db_empresa is None:
        raise HTTPException(status_code=404, detail="Empresa not found")
    db.delete(db_empresa)
    db.commit()
    return {"status": "success"}


# === Estoque / Movimentações de Estoque ===


# Endpoints para carrinho (compatibilidade com frontend)
@app.get('/carrinho/')
def read_carrinho(session: str | None = Cookie(None), db: Session = Depends(get_db)):
    """Retorna o carrinho do usuário autenticado (cookie session) ou 401 se não autenticado."""
    usuario_id = None
    if session:
        try:
            usuario_id = int(session)
        except Exception:
            usuario_id = None
    if usuario_id is None:
        raise HTTPException(status_code=401, detail='Not authenticated')
    cart = crud.get_carrinho_por_usuario(db, usuario_id=usuario_id)
    if not cart:
        return { 'id': None, 'usuarioId': usuario_id, 'itens': [] }
    # mapear itens
    itens = []
    for it in cart.itens:
        produto = None
        try:
            produto = it.produto
        except Exception:
            produto = None
        itens.append({
            'id': it.id,
            'produtoId': it.produto_id,
            'nome': produto.nome if produto else None,
            'quantidade': int(it.quantidade or 0),
            'precoUnitario': float(it.preco_unitario) if it.preco_unitario is not None else None,
            'created_at': it.created_at.isoformat() if it.created_at else None
        })
    return { 'id': cart.id, 'usuarioId': cart.usuario_id, 'itens': itens }


@app.post('/carrinho/')
def replace_carrinho(payload: dict, session: str | None = Cookie(None), db: Session = Depends(get_db)):
    """Substitui todo o carrinho do usuário (body: { itens: [...] })."""
    usuario_id = None
    if session:
        try:
            usuario_id = int(session)
        except Exception:
            usuario_id = None
    # aceitar também usuarioId no body para dev
    if usuario_id is None:
        usuario_id = payload.get('usuarioId') or payload.get('usuario_id')
    if usuario_id is None:
        raise HTTPException(status_code=401, detail='Not authenticated')
    itens = payload.get('itens') or payload.get('carrinho') or []
    try:
        cart = crud.replace_carrinho_items(db, usuario_id=int(usuario_id), items=itens)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Erro ao salvar carrinho: {e}')
    # retornar carrinho atualizado
    return read_carrinho(session=str(usuario_id), db=db)


@app.post('/carrinho/items')
def add_item_carrinho(payload: dict, session: str | None = Cookie(None), db: Session = Depends(get_db)):
    usuario_id = None
    if session:
        try:
            usuario_id = int(session)
        except Exception:
            usuario_id = None
    if usuario_id is None:
        usuario_id = payload.get('usuarioId') or payload.get('usuario_id')
    if usuario_id is None:
        raise HTTPException(status_code=401, detail='Not authenticated')
    produto_id = payload.get('produtoId') or payload.get('id')
    quantidade = payload.get('quantidade') or payload.get('qtd') or 1
    if produto_id is None:
        raise HTTPException(status_code=400, detail='produtoId is required')
    try:
        cart = crud.add_item_to_carrinho(db, usuario_id=int(usuario_id), produto_id=int(produto_id), quantidade=int(quantidade))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Erro ao adicionar item: {e}')
    return { 'status': 'ok', 'carrinhoId': cart.id }


@app.delete('/carrinho/items/{produto_id}')
def delete_item_carrinho(produto_id: int, session: str | None = Cookie(None), db: Session = Depends(get_db)):
    usuario_id = None
    if session:
        try:
            usuario_id = int(session)
        except Exception:
            usuario_id = None
    if usuario_id is None:
        raise HTTPException(status_code=401, detail='Not authenticated')
    ok = crud.remove_item_from_carrinho(db, usuario_id=int(usuario_id), produto_id=produto_id)
    if not ok:
        raise HTTPException(status_code=404, detail='Item not found')
    return { 'status': 'success' }

@app.get("/estoque/movimentacoes", response_model=List[schemas.MovimentacaoEstoque])
def read_movimentacoes(db: Session = Depends(get_db)):
    """Retorna movimentações de estoque no formato esperado pelo frontend (schemas.MovimentacaoEstoque).
    """
    movs = db.query(models.MovimentacaoEstoque).order_by(models.MovimentacaoEstoque.created_at.desc()).all()
    result = []
    for m in movs:
        produto_nome = None
        try:
            produto_nome = m.produto.nome if m.produto else None
        except Exception:
            produto_nome = None

        result.append({
            'id': m.id,
            'produtoId': m.produto_id,
            'produtoNome': produto_nome,
            'tipo': m.tipo,
            'quantidade': m.quantidade,
            'origem': m.origem,
            'data': m.created_at.isoformat() if m.created_at else None,
            'observacoes': m.observacoes,
            'referencia': None,
            'usuarioId': m.usuario_id,
            'quantidadeAnterior': m.quantidade_anterior,
            'quantidadeNova': m.quantidade_nova
        })
    return result


@app.post("/estoque/movimentacoes", response_model=schemas.MovimentacaoEstoque)
def create_movimentacao(mov: schemas.MovimentacaoEstoqueCreate, db: Session = Depends(get_db)):
    """Cria uma movimentação de estoque usando schema `MovimentacaoEstoqueCreate`.
    Campos esperados (camelCase): produtoId, quantidade, tipo, origem, observacoes, referencia, usuarioId
    """
    try:
        db_mov = crud.create_movimentacao_estoque(
            db=db,
            produto_id=int(mov.produtoId),
            quantidade=int(mov.quantidade),
            tipo=str(mov.tipo),
            origem=str(mov.origem),
            observacoes=mov.observacoes,
            usuario_id=mov.usuarioId
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Erro ao criar movimentação: {e}')

    produto_nome = None
    try:
        produto_nome = db_mov.produto.nome if db_mov.produto else None
    except Exception:
        produto_nome = None

    return {
        'id': db_mov.id,
        'produtoId': db_mov.produto_id,
        'produtoNome': produto_nome,
        'tipo': db_mov.tipo,
        'quantidade': db_mov.quantidade,
        'origem': db_mov.origem,
        'data': db_mov.created_at.isoformat() if db_mov.created_at else None,
        'observacoes': db_mov.observacoes,
        'referencia': None,
        'usuarioId': db_mov.usuario_id,
        'quantidadeAnterior': db_mov.quantidade_anterior,
        'quantidadeNova': db_mov.quantidade_nova
    }


# Mercado Pago Integration
class MPPreferenceIn(BaseModel):
    items: Any
    back_urls: Dict[str, str]
    auto_return: Optional[str] = None
    external_reference: Optional[str] = None

@app.post("/mp/create_preference/", tags=["MercadoPago"])
def create_mp_preference(pref: MPPreferenceIn):
    """Cria uma preferência de pagamento no Mercado Pago"""
    token = os.getenv("MERCADO_PAGO_ACCESS_TOKEN")
    if not token:
        raise HTTPException(status_code=500, detail="MERCADO_PAGO_ACCESS_TOKEN not configured on the server")

    url = "https://api.mercadopago.com/checkout/preferences"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    try:
        resp = requests.post(url, headers=headers, json=pref.dict(exclude_none=True))
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Erro ao conectar ao Mercado Pago: {str(e)}")

    if not resp.ok:
        raise HTTPException(status_code=502, detail=f"Mercado Pago error: {resp.status_code} - {resp.text}")

    return resp.json()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)