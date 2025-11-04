import { Produto } from '@/types/produto';
import { Mesa } from '@/types/mesa';
import { Empresa } from '@/types/empresa';
import { PedidoLocal } from '@/types/pedido';
import { MovimentacaoEstoque } from '@/types/estoque';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';

// Helper para fazer requisições autenticadas
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || 'Erro na requisição');
  }

  return response.json();
};

// Payload type for backend-shaped requests (avoids explicit `any`)
type BackendProdutoPayload = Record<string, unknown>;

// === PRODUTOS ===
// Serviço para gerenciar produtos
export const produtoService = {
  async getAll(): Promise<Produto[]> {
    return apiFetch('/produtos');
  },

  // Recupera um produto pelo ID
  async create(produto: BackendProdutoPayload): Promise<Produto> {
    return apiFetch('/produtos', {
      method: 'POST',
      body: JSON.stringify(produto),
    });
  },

  // Atualiza um produto existente
  async update(id: number, produto: BackendProdutoPayload): Promise<void> {
    await apiFetch(`/produtos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(produto),
    });
  },

  // Deleta um produto pelo ID
  async delete(id: number): Promise<void> {
    await apiFetch(`/produtos/${id}`, {
      method: 'DELETE',
    });
  },
};

// === MESAS ===
export const mesaService = {
  async getAll(): Promise<Mesa[]> {
    return apiFetch('/mesas');
  },

  // Recupera uma mesa pelo ID
  async getById(id: number): Promise<Mesa | null> {
    try {
      return await apiFetch(`/mesas/${id}`);
    } catch {
      return null;
    }
  },

  // Recupera uma mesa pelo slug
  async getBySlug(slug: string): Promise<Mesa | null> {
    try {
      return await apiFetch(`/mesas/slug/${encodeURIComponent(slug)}`);
    } catch {
      return null;
    }
  },

  // Cria uma nova mesa
  async create(mesa: Omit<Mesa, 'id'>): Promise<Mesa> {
    return apiFetch('/mesas', {
      method: 'POST',
      body: JSON.stringify(mesa),
    });
  },

  // Atualiza uma mesa existente
  async update(id: number, mesaData: Partial<Mesa>): Promise<void> {
    await apiFetch(`/mesas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mesaData),
    });
  },

  //
  async delete(id: number): Promise<void> {
    await apiFetch(`/mesas/${id}`, {
      method: 'DELETE',
    });
  },
  
  // Adiciona item à mesa (delegando ao backend)
  async adicionarItem(mesaId: number, data: { produtoId: number; quantidade: number; nome?: string; precoUnitario?: number; usuarioId?: number; numero?: number }) {
    return apiFetch(`/mesas/${mesaId}/itens`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Remove um item da mesa
  async removerItem(mesaId: number, itemId: number) {
    return apiFetch(`/mesas/${mesaId}/itens/${itemId}`, {
      method: 'DELETE',
    });
  },
  
  // Processa pagamento para uma mesa via backend
  async processarPagamento(mesaId: number, payload: { metodo: string; itens: unknown[]; total: number; pedidoNumero?: number }) {
    return apiFetch(`/mesas/${mesaId}/pagamento`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// === EMPRESAS ===
export const empresaService = {
  async getAll(): Promise<Empresa[]> {
    return apiFetch('/empresas');
  },

  async create(empresa: Omit<Empresa, 'id'>): Promise<Empresa> {
    return apiFetch('/empresas', {
      method: 'POST',
      body: JSON.stringify(empresa),
    });
  },
};

// === CATEGORIAS ===
export const categoriaService = {
  async getAll(): Promise<{ id: number; nome: string; descricao?: string }[]> {
    return apiFetch('/categorias/');
  },
  async create(payload: { nome: string; descricao?: string }) {
    return apiFetch('/categorias/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async update(id: number, payload: { nome: string; descricao?: string }) {
    return apiFetch(`/categorias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  async delete(id: number) {
    return apiFetch(`/categorias/${id}`, {
      method: 'DELETE',
    });
  }
};


// === PEDIDOS ===
export const pedidoService = {
  async getAll(): Promise<PedidoLocal[]> {
    return apiFetch('/pedidos');
  },

  async create(pedido: Omit<PedidoLocal, 'id'>): Promise<PedidoLocal> {
    return apiFetch('/pedidos', {
      method: 'POST',
      body: JSON.stringify(pedido),
    });
  },

  async cancelar(pedidoId: number) {
    return apiFetch(`/pedidos/${pedidoId}/cancelar`, {
      method: 'POST'
    });
  },

  async updateStatus(id: number, status: PedidoLocal['status']): Promise<void> {
    await apiFetch(`/pedidos/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};

// === AVALIACOES ===
export const avaliacaoService = {
  async getByProduto(produtoId: number) {
    return apiFetch(`/avaliacoes/${produtoId}`);
  },
  async create(payload: { produtoId: number; rating: number; comentario?: string }) {
    return apiFetch('/avaliacoes/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async remove(produtoId: number) {
    return apiFetch(`/avaliacoes/${produtoId}`, {
      method: 'DELETE',
    });
  }
};

// === ESTOQUE ===
export const estoqueService = {
  async getMovimentacoes(): Promise<MovimentacaoEstoque[]> {
    return apiFetch('/estoque/movimentacoes');
  },

  async addMovimentacao(movimentacao: Omit<MovimentacaoEstoque, 'id'>): Promise<void> {
    await apiFetch('/estoque/movimentacoes', {
      method: 'POST',
      body: JSON.stringify(movimentacao),
    });
  },
};

export default {
  produtoService,
  mesaService,
  empresaService,
  pedidoService,
  estoqueService,
  categoriaService,
  avaliacaoService,
};
// === CHECKOUT / PAGAMENTOS ===
export const checkoutService = {
  async createSession(pedidoId: number, tipoPagamento = 'pix', retorno: Record<string, string> = {}) {
    return apiFetch('/checkout/create-session', {
      method: 'POST',
      body: JSON.stringify({ pedido_id: pedidoId, tipoPagamento, retorno }),
    });
  },
};

