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

  async updateStatus(id: number, status: PedidoLocal['status']): Promise<void> {
    await apiFetch(`/pedidos/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
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

