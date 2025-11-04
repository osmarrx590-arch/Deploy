import { User } from '@/types/auth';
import { Produto } from '@/types/produto';
import { Mesa } from '@/types/mesa';
import { Empresa } from '@/types/empresa';
import { PedidoLocal } from '@/types/pedido';
import { MovimentacaoEstoque } from '@/types/estoque';
import { Avaliacao } from '@/types/avaliacoes';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';

// Tipo genérico para payloads enviados ao backend
type BackendPayload<T> = Omit<T, 'id' | 'created_at'>;

// Helper para fazer requisições autenticadas
const apiFetch = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
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

// Services
export const userService = {
  async login(username: string, password: string) {
    return apiFetch<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async register(data: { username?: string; email: string; nome?: string; password: string; tipo?: string }) {
    return apiFetch<User>('/users/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async me() {
    return apiFetch<User>('/auth/me');
  },

  async logout() {
    return apiFetch('/auth/logout', { method: 'POST' });
  }
};

export const produtoService = {
  getAll: () => apiFetch<Produto[]>('/produtos/'),
  getById: (id: number) => apiFetch<Produto>(`/produtos/${id}`),
  create: (data: BackendPayload<Produto>) => apiFetch<Produto>('/produtos/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: BackendPayload<Produto>) => apiFetch<Produto>(`/produtos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiFetch<void>(`/produtos/${id}`, { method: 'DELETE' }),
};

export const mesaService = {
  getAll: () => apiFetch<Mesa[]>('/mesas/'),
  getById: (id: number) => apiFetch<Mesa>(`/mesas/${id}`),
  create: (data: BackendPayload<Mesa>) => apiFetch<Mesa>('/mesas/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: Partial<Mesa>) => apiFetch<Mesa>(`/mesas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiFetch<void>(`/mesas/${id}`, { method: 'DELETE' }),
  
  // Endpoints específicos para mesas
  getPedidoPendente: (mesaId: number) => apiFetch<PedidoLocal>(`/mesas/${mesaId}/pedido-pendente`),
  adicionarItem: (mesaId: number, data: { produto_id: number; quantidade: number }) => 
    apiFetch<Mesa>(`/mesas/${mesaId}/itens`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const pedidoService = {
  getAll: () => apiFetch<PedidoLocal[]>('/pedidos/'),
  getById: (id: number) => apiFetch<PedidoLocal>(`/pedidos/${id}`),
  create: (data: BackendPayload<PedidoLocal>) => apiFetch<PedidoLocal>('/pedidos/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: Partial<PedidoLocal>) => apiFetch<PedidoLocal>(`/pedidos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  updateStatus: (id: number, status: string) => apiFetch<PedidoLocal>(`/pedidos/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
};

export const avaliacaoService = {
  getByProduto: (produtoId: number) => apiFetch<Avaliacao[]>(`/produtos/${produtoId}/avaliacoes/`),
  create: (produtoId: number, data: { rating: number; comentario?: string; usuario_id: number }) => 
    apiFetch<Avaliacao>(`/produtos/${produtoId}/avaliacoes/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const favoritoService = {
  getByUsuario: (usuarioId: number) => apiFetch<Produto[]>(`/usuarios/${usuarioId}/favoritos/`),
  adicionar: (produtoId: number, usuarioId: number) => 
    apiFetch<Produto>(`/produtos/${produtoId}/favoritos/${usuarioId}`, { method: 'POST' }),
  remover: (produtoId: number, usuarioId: number) => 
    apiFetch<void>(`/produtos/${produtoId}/favoritos/${usuarioId}`, { method: 'DELETE' }),
};

export const empresaService = {
  getAll: () => apiFetch<Empresa[]>('/empresas/'),
  getById: (id: number) => apiFetch<Empresa>(`/empresas/${id}`),
  create: (data: BackendPayload<Empresa>) => apiFetch<Empresa>('/empresas/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: BackendPayload<Empresa>) => apiFetch<Empresa>(`/empresas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiFetch<void>(`/empresas/${id}`, { method: 'DELETE' }),
};

export const estoqueService = {
  getMovimentacoes: () => apiFetch<MovimentacaoEstoque[]>('/estoque/movimentacoes'),
  criarMovimentacao: (data: BackendPayload<MovimentacaoEstoque>) => 
    apiFetch<MovimentacaoEstoque>('/estoque/movimentacoes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};