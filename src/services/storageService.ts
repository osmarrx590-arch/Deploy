// src\services\storageService.ts
// Serviço centralizado para todas as operações de localStorage
// Facilita manutenção, padroniza tratamento de erros e melhora tipagem

import { User } from '@/types/auth';
import { Produto, ItemCarrinho } from '@/types/produto';
import { Mesa } from '@/types/mesa';
import { PedidoLocal, CriarPedidoLocalData } from '@/types/pedido';
import { PedidoHistorico, DadosPedidoInput } from '@/types/pedido';
import { Empresa } from '@/types/empresa';
import { Categoria } from '@/types/categoria';
import { MovimentacaoEstoque } from '@/types/estoque';
import { Avaliacao } from '@/types/avaliacoes';
import { produtosLocais } from '@/data/produtos_locais';
import { empresasLocais } from '@/data/empresas_locais';


// Enum para padronizar chaves do localStorage
export const STORAGE_KEYS = {
  // Auth
  AUTH_USER: 'usuario_logado',
  USERS: 'users',
  
  // Produtos e Estoque
  PRODUTOS: 'produtos_cadastrados',
  MOVIMENTACOES_ESTOQUE: 'movimentacoes_estoque',
  
  // Categorias
  CATEGORIAS: 'categorias_cadastradas',
  
  // Mesas
  MESAS: 'mesas_salvas',
  MESA_EVENTS: 'mesa_events',
  
  // Pedidos
  PEDIDOS_LOCAIS: 'pedidos_locais',
  PEDIDOS_HISTORICO: 'pedidos_historico',
  CONTADOR_PEDIDOS: 'contador_pedidos',
  DATA_CONTADOR_PEDIDOS: 'data_contador_pedidos',
  
  // Empresas
  EMPRESAS: 'empresas_salvas',
  
  // Loja Online
  CARRINHO: 'carrinho_items',
  CUPOM: 'cupom',
  FAVORITOS: 'favoritos_items',
  AVALIACOES: 'avaliacoes_items'
} as const;

// Tipos para melhor IntelliSense
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

// Interface base para operações de storage
interface StorageOptions {
  errorCallback?: (error: Error) => void;
}

// Classe base para operações seguras no localStorage
class SafeStorage {
  static get<T>(key: StorageKey, defaultValue: T, options?: StorageOptions): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Erro ao ler ${key} do localStorage:`, error);
      options?.errorCallback?.(error as Error);
      return defaultValue;
    }
  }

  static set<T>(key: StorageKey, value: T, options?: StorageOptions): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Erro ao salvar ${key} no localStorage:`, error);
      options?.errorCallback?.(error as Error);
    }
  }

  static remove(key: StorageKey, options?: StorageOptions): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Erro ao remover ${key} do localStorage:`, error);
      options?.errorCallback?.(error as Error);
    }
  }

  static clear(options?: StorageOptions): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
      options?.errorCallback?.(error as Error);
    }
  }
}

// === SERVIÇOS POR DOMÍNIO ===

// Autenticação
export const authStorage = {
  getUser: (): User | null => SafeStorage.get(STORAGE_KEYS.AUTH_USER, null),
  setUser: (user: User): void => {
    SafeStorage.set(STORAGE_KEYS.AUTH_USER, user);
  try { window.dispatchEvent(new Event('usuario_logado_updated')); } catch (e) { console.debug(e); }
  },
  removeUser: (): void => {
    SafeStorage.remove(STORAGE_KEYS.AUTH_USER);
  try { window.dispatchEvent(new Event('usuario_logado_updated')); } catch (e) { console.debug(e); }
  },
  isLoggedIn: (): boolean => SafeStorage.get(STORAGE_KEYS.AUTH_USER, null) !== null,
  getAllUsers: (): User[] => SafeStorage.get(STORAGE_KEYS.USERS, []),
  addUser: (user: User): void => {
    const users = authStorage.getAllUsers();
    users.push(user);
    SafeStorage.set(STORAGE_KEYS.USERS, users);
  try { window.dispatchEvent(new Event('usuarios_atualizados')); } catch (e) { console.debug(e); }
  },
  removeUserById: (userId: number): void => {
    const users = authStorage.getAllUsers();
    const updatedUsers = users.filter(user => user.id !== userId);
    SafeStorage.set(STORAGE_KEYS.USERS, updatedUsers);
  try { window.dispatchEvent(new Event('usuarios_atualizados')); } catch (e) { console.debug(e); }
  }
};

// Produtos
export const produtoStorage = {
  getAll: (): Produto[] => {
    const produtos = SafeStorage.get(STORAGE_KEYS.PRODUTOS, []);
    // Se não há produtos salvos, inicializar com dados padrão
    if (produtos.length === 0) {
      produtoStorage.save(produtosLocais);
      return produtosLocais;
    }
    return produtos;
  },
  save: (produtos: Produto[]): void => SafeStorage.set(STORAGE_KEYS.PRODUTOS, produtos),
  add: (produto: Produto): void => {
    const produtos = produtoStorage.getAll();
    produtos.push(produto);
    produtoStorage.save(produtos);
  },
  update: (id: number, produto: Produto): void => {
    const produtos = produtoStorage.getAll();
    const index = produtos.findIndex(p => p.id === id);
    if (index !== -1) {
      produtos[index] = produto;
      produtoStorage.save(produtos);
    }
  },
  remove: (id: number): void => {
    const produtos = produtoStorage.getAll().filter(p => p.id !== id);
    produtoStorage.save(produtos);
  }
};

// Categorias
export const categoriaStorage = {
  getAll: (): Categoria[] => SafeStorage.get(STORAGE_KEYS.CATEGORIAS, []),
  save: (categorias: Categoria[]): void => SafeStorage.set(STORAGE_KEYS.CATEGORIAS, categorias),
  add: (categoria: Categoria): void => {
    const categorias = categoriaStorage.getAll();
    categorias.push(categoria);
    categoriaStorage.save(categorias);
  }
};

// Mesas
export const mesaStorage = {
  getEvents: (): import('@/types/mesa').MesaEvent[] => SafeStorage.get(STORAGE_KEYS.MESA_EVENTS, []),
  addEvent: (event: import('@/types/mesa').MesaEvent): void => {
    const events = mesaStorage.getEvents();
    events.push(event);
    
    // Mantém apenas os últimos 50 eventos
    if (events.length > 50) {
      events.splice(0, events.length - 50);
    }
    
    SafeStorage.set(STORAGE_KEYS.MESA_EVENTS, events);
    // Notifica outras abas/janelas via BroadcastChannel (se disponível)
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('mesa_events');
          bc.postMessage({ type: 'mesa_event', event });
          bc.close();
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ambiente sem window — ignore
    }
  },
  clearEvents: (): void => SafeStorage.remove(STORAGE_KEYS.MESA_EVENTS)
};

// Pedidos Locais
export const pedidoLocalStorage = {
  getAll: (): PedidoLocal[] => SafeStorage.get(STORAGE_KEYS.PEDIDOS_LOCAIS, []),
  save: (pedidos: PedidoLocal[]): void => SafeStorage.set(STORAGE_KEYS.PEDIDOS_LOCAIS, pedidos),
  add: (pedido: PedidoLocal): void => {
    const pedidos = pedidoLocalStorage.getAll();
    pedidos.unshift(pedido);
    pedidoLocalStorage.save(pedidos);
    try {
      window.dispatchEvent(new Event('pedidos_locais_updated'));
    } catch (e) {
      console.debug(e);
    }
  },
  updateStatus: (id: number, status: PedidoLocal['status']): void => {
    const pedidos = pedidoLocalStorage.getAll();
    const index = pedidos.findIndex(p => p.id === id);
    if (index !== -1) {
      pedidos[index].status = status;
      pedidoLocalStorage.save(pedidos);
      try {
        window.dispatchEvent(new Event('pedidos_locais_updated'));
      } catch (e) {
        console.debug(e);
      }
    }
  },
  clear: (): void => {
    SafeStorage.remove(STORAGE_KEYS.PEDIDOS_LOCAIS);
    try {
      window.dispatchEvent(new Event('pedidos_locais_updated'));
    } catch (e) {
      console.debug(e);
    }
  }
};

// Pedidos Histórico
export const pedidoHistoricoStorage = {
  getAll: (): PedidoHistorico[] => SafeStorage.get(STORAGE_KEYS.PEDIDOS_HISTORICO, []),
  save: (pedidos: PedidoHistorico[]): void => SafeStorage.set(STORAGE_KEYS.PEDIDOS_HISTORICO, pedidos),
  add: (pedido: PedidoHistorico): void => {
    const pedidos = pedidoHistoricoStorage.getAll();
    pedidos.unshift(pedido);
    pedidoHistoricoStorage.save(pedidos);
  },
  updateStatus: (id: number, status: PedidoHistorico['status']): void => {
    const pedidos = pedidoHistoricoStorage.getAll();
    const index = pedidos.findIndex(p => p.id === id);
    if (index !== -1) {
      pedidos[index].status = status;
      pedidoHistoricoStorage.save(pedidos);
    }
  },
  clear: (): void => SafeStorage.remove(STORAGE_KEYS.PEDIDOS_HISTORICO)
};

// Contador de Pedidos
export const contadorPedidosStorage = {
  getContador: (): number => SafeStorage.get(STORAGE_KEYS.CONTADOR_PEDIDOS, 0),
  setContador: (contador: number): void => SafeStorage.set(STORAGE_KEYS.CONTADOR_PEDIDOS, contador),
  getData: (): string => SafeStorage.get(STORAGE_KEYS.DATA_CONTADOR_PEDIDOS, ''),
  setData: (data: string): void => SafeStorage.set(STORAGE_KEYS.DATA_CONTADOR_PEDIDOS, data),
  reset: (): void => {
    contadorPedidosStorage.setContador(0);
    contadorPedidosStorage.setData(new Date().toISOString().slice(0, 10));
  }
};

// Empresas
export const empresaStorage = {
  getAll: (): Empresa[] => {
    const empresas = SafeStorage.get(STORAGE_KEYS.EMPRESAS, []);
    // Se não há empresas salvas, inicializar com dados padrão
    if (empresas.length === 0) {
      empresaStorage.save(empresasLocais);
      return empresasLocais;
    }
    return empresas;
  },
  save: (empresas: Empresa[]): void => SafeStorage.set(STORAGE_KEYS.EMPRESAS, empresas),
  add: (empresa: Empresa): void => {
    const empresas = empresaStorage.getAll();
    empresas.push(empresa);
    empresaStorage.save(empresas);
  }
};

// Movimentações de Estoque
export const estoqueStorage = {
  getMovimentacoes: (): MovimentacaoEstoque[] => SafeStorage.get(STORAGE_KEYS.MOVIMENTACOES_ESTOQUE, []),
  saveMovimentacoes: (movimentacoes: MovimentacaoEstoque[]): void => SafeStorage.set(STORAGE_KEYS.MOVIMENTACOES_ESTOQUE, movimentacoes),
  addMovimentacao: (movimentacao: MovimentacaoEstoque): void => {
    const movimentacoes = estoqueStorage.getMovimentacoes();
    movimentacoes.unshift(movimentacao);
    estoqueStorage.saveMovimentacoes(movimentacoes);
  }
};

// === LOJA ONLINE ===

// Carrinho
export const carrinhoStorage = {
  getItens: (): ItemCarrinho[] => SafeStorage.get(STORAGE_KEYS.CARRINHO, []),
  saveItens: (itens: ItemCarrinho[]): void => SafeStorage.set(STORAGE_KEYS.CARRINHO, itens),
  clear: (): void => SafeStorage.remove(STORAGE_KEYS.CARRINHO),
  getCupom: (): { nome: string; desconto: number } | null => SafeStorage.get(STORAGE_KEYS.CUPOM, null),
  saveCupom: (cupom: { nome: string; desconto: number } | null): void => SafeStorage.set(STORAGE_KEYS.CUPOM, cupom)
};

// Favoritos
export const favoritosStorage = {
  getItens: (): Produto[] => SafeStorage.get(STORAGE_KEYS.FAVORITOS, []),
  saveItens: (itens: Produto[]): void => SafeStorage.set(STORAGE_KEYS.FAVORITOS, itens),
  clear: (): void => SafeStorage.remove(STORAGE_KEYS.FAVORITOS)
};

// Avaliações
export const avaliacoesStorage = {
  getItens: (): Avaliacao[] => SafeStorage.get(STORAGE_KEYS.AVALIACOES, []),
  saveItens: (itens: Avaliacao[]): void => SafeStorage.set(STORAGE_KEYS.AVALIACOES, itens),
  clear: (): void => SafeStorage.remove(STORAGE_KEYS.AVALIACOES)
};

// Função utilitária para limpar todo o storage (para testes)
export const clearAllStorage = (): void => {
  SafeStorage.clear();
  console.log('🧹 Todo o localStorage foi limpo');
};

export default {
  authStorage,
  produtoStorage,
  categoriaStorage,
  mesaStorage,
  pedidoLocalStorage,
  pedidoHistoricoStorage,
  contadorPedidosStorage,
  empresaStorage,
  estoqueStorage,
  carrinhoStorage,
  favoritosStorage,
  avaliacoesStorage,
  clearAllStorage
};