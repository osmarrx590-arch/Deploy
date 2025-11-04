from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

# Schemas Base
class UserBase(BaseModel):
    username: str
    email: EmailStr
    nome: str
    tipo: str = "online"

class ProdutoBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    preco_compra: Decimal
    preco_venda: Decimal
    codigo: str
    categoria_id: int
    estoque: int = 0

class PedidoBase(BaseModel):
    status: str
    tipo: str  # "online" ou "fisica"
    observacoes: Optional[str] = None
    mesa_id: Optional[int] = None  # Apenas para pedidos físicos

# Schemas Create
class UserCreate(UserBase):
    password: str

class ProdutoCreate(ProdutoBase):
    pass

class PedidoCreate(PedidoBase):
    itens: List[dict]

# Schemas Response
class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

# Outros schemas necessários (moved above Produto so Produto can reference Categoria type)
class CategoriaBase(BaseModel):
    nome: str
    descricao: Optional[str] = None

class CategoriaCreate(CategoriaBase):
    pass

class Categoria(CategoriaBase):
    id: int
    
    class Config:
        orm_mode = True


class Produto(ProdutoBase):
    id: int
    estoque: int
    categoria: Categoria
    created_at: datetime
    
    class Config:
        orm_mode = True

class PedidoItem(BaseModel):
    id: int
    pedido_id: int
    produto_id: int
    quantidade: int
    preco_unitario: Decimal
    subtotal: Decimal
    
    class Config:
        orm_mode = True

class Pedido(PedidoBase):
    id: int
    numero: str
    total: Decimal
    created_at: datetime
    itens: List[PedidoItem]
    
    class Config:
        orm_mode = True

# Outros schemas necessários
class EmpresaBase(BaseModel):
    nome: str
    cnpj: str
    email: EmailStr
    telefone: str
    endereco: str

class EmpresaCreate(EmpresaBase):
    pass

class Empresa(EmpresaBase):
    id: int
    
    class Config:
        orm_mode = True

class MesaBase(BaseModel):
    nome: str
    capacidade: int = 4
    status: str = "livre"
    observacoes: Optional[str] = None
    slug: Optional[str] = None

class MesaCreate(MesaBase):
    pass

class Mesa(MesaBase):
    id: int
    usuario_responsavel_id: Optional[int]
    pedido: Optional[str] = None
    itens: Optional[List[dict]] = []
    statusPedido: Optional[str] = None
    
    class Config:
        orm_mode = True


# Movimentação de Estoque (Pydantic schemas)
class MovimentacaoEstoqueBase(BaseModel):
    produtoId: int
    quantidade: int
    tipo: str  # 'entrada' | 'saida'
    origem: str
    observacoes: Optional[str] = None
    referencia: Optional[str] = None
    usuarioId: Optional[int] = None


class MovimentacaoEstoqueCreate(MovimentacaoEstoqueBase):
    pass


class MovimentacaoEstoque(MovimentacaoEstoqueBase):
    id: int
    produtoNome: Optional[str] = None
    quantidadeAnterior: Optional[int] = None
    quantidadeNova: Optional[int] = None
    data: datetime

    class Config:
        orm_mode = True