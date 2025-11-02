import { ItemBase } from './produto';

export interface PedidoLocal {
  id: number;
  // padronizado: numeroPedido é inteiro
  numeroPedido: number;
  mesaId: number;
  mesaNome: string;
  status: 'Pendente' | 'Em Preparo' | 'Pronto' | 'Entregue' | 'Cancelado';
  itens: ItemBase[];
  total: number;
  dataHora: string;
  atendente: string;
  observacoes?: string;
}

export interface CriarPedidoLocalData {
  mesaId: number;
  mesaNome: string;
  itens: ItemBase[];
  total: number;
  atendente: string;
  observacoes?: string;
}

// Histórico de pedidos (renomeado para evitar confusão)
export interface PedidoHistoricoStatus {
  id: number;
  pedidoId: number;
  statusAnterior: string;
  statusNovo: string;
  dataAlteracao: string;
  usuarioId: number;
  observacao?: string;
}

// Pedido Histórico (from services)
export interface PedidoHistorico {
  id: number;
  numero: number;
  data: string;
  status: 'Pendente' | 'Em preparo' | 'Pronto' | 'Entregue' | 'Cancelado';
  metodoPagamento: string;
  itens: {
    id: number;
    nome: string;
    quantidade: number;
    venda: number;
    subtotal: number;
  }[];
  subtotal: number;
  desconto: number;
  total: number;
  nome: string;
}

// Dados de entrada do pedido (from services)
export interface DadosPedidoInput {
  metodoPagamento: string;
  itens: ItemPedidoInput[];
  subtotal: number;
  desconto: number;
  total: number;
  nome: string;
}

// Dados de pagamento (from services)
export interface DadosPagamento {
  mesaId: number;
  mesaNome: string;
  pedidoNumero: number | string;
  metodoPagamento: string;
  itens: ItemMesa[];
  subtotal: number;
  desconto: number;
  total: number;
  valorRecebido?: number;
  troco?: number;
}

// Import dependencies
import { ItemPedidoInput } from './produto';
import { ItemMesa } from './mesa';