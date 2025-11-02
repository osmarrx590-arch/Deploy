// Movimentação de estoque
export interface MovimentacaoEstoque {
  id: number;
  produtoId: number;
  produtoNome: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  origem: 'produto_cadastro' | 'venda_online' | 'venda_fisica' | 'cancelamento_venda_online' | 'cancelamento_venda_fisica';
  data: string;
  observacoes?: string;
  referencia?: string;
}

// Reserva de estoque
export interface EstoqueReserva {
  id: number;
  produtoId: number;
  quantidade: number;
  tipo: 'carrinho' | 'mesa';
  timestamp: number;
  mesaId?: number;
}

// Estoque Reservado (for services)
export interface EstoqueReservado {
  produtoId: number;
  quantidade_reservada: number;
  reservas: Array<{
    id: number;
    quantidade: number;
    tipo: 'mesa' | 'carrinho';
    timestamp: number;
    mesaId?: number;
    venda_confirmada?: boolean;
  }>;
}