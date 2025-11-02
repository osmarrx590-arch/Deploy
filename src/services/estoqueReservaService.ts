import { produtoStorage } from '@/services/storageService';
import { Produto } from '@/data/produtos_locais';

import { EstoqueReservado } from '@/types/estoque';

const STORAGE_KEY = 'estoque_reservado';
const TIMEOUT_RESERVA = 30 * 60 * 1000;

// Obter estoque reservado
const getEstoqueReservado = (): EstoqueReservado[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Salvar estoque reservado
const salvarEstoqueReservado = (estoqueReservado: EstoqueReservado[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estoqueReservado));
};

// Limpar reservas expiradas
const limparReservasExpiradas = (): void => {
  const estoqueReservado = getEstoqueReservado();
  const agora = Date.now();
  
  const estoqueAtualizado = estoqueReservado.map(item => ({
    ...item,
    reservas: item.reservas.filter(reserva => 
      reserva.tipo === 'mesa' || reserva.venda_confirmada || (agora - reserva.timestamp) < TIMEOUT_RESERVA
    ),
  })).filter(item => item.reservas.length > 0);

  estoqueAtualizado.forEach(item => {
    item.quantidade_reservada = item.reservas.reduce((total, reserva) => 
      total + reserva.quantidade, 0
    );
  });

  salvarEstoqueReservado(estoqueAtualizado);
};

// Reservar estoque
export const reservarEstoque = (produtoId: number, quantidade: number, tipo: 'mesa' | 'carrinho', mesaId?: number): boolean => {
  limparReservasExpiradas();
  
  const produtos = produtoStorage.getAll();
  const produto = produtos.find(p => p.id === produtoId);
  if (!produto) return false;

  const estoqueReservado = getEstoqueReservado();
  const itemReservado = estoqueReservado.find(item => item.produtoId === produtoId);
  const quantidadeReservada = itemReservado?.quantidade_reservada || 0;
  const estoqueDisponivel = produto.estoque - quantidadeReservada;

  if (estoqueDisponivel < quantidade) {
    console.warn(`Estoque insuficiente para produto ${produtoId}. Disponível: ${estoqueDisponivel}, Solicitado: ${quantidade}`);
    return false;
  }

  const novaReserva = {
    id: Date.now(), // Usando timestamp como ID único
    quantidade,
    tipo,
    timestamp: Date.now(),
    mesaId,
    venda_confirmada: false // Inicialmente, a venda não está confirmada
  };

  if (itemReservado) {
    itemReservado.reservas.push(novaReserva);
    itemReservado.quantidade_reservada += quantidade;
  } else {
    estoqueReservado.push({
      produtoId,
      quantidade_reservada: quantidade,
      reservas: [novaReserva]
    });
  }

  salvarEstoqueReservado(estoqueReservado);
  console.log(`✅ Estoque reservado: ${quantidade}x produto ${produtoId}`);
  return true;
};

// Liberar reserva de estoque
export const liberarReservaEstoque = (produtoId: number, quantidade: number, tipo: 'mesa' | 'carrinho', mesaId?: number): void => {
  const estoqueReservado = getEstoqueReservado();
  const itemIndex = estoqueReservado.findIndex(item => item.produtoId === produtoId);
  
  if (itemIndex === -1) return;

  const item = estoqueReservado[itemIndex];
  let quantidadeALiberar = quantidade;

  item.reservas = item.reservas.filter(reserva => {
    if (quantidadeALiberar <= 0) return true;
    
    const match = reserva.tipo === tipo && (!mesaId || reserva.mesaId === mesaId);
    if (match && reserva.quantidade <= quantidadeALiberar) {
      quantidadeALiberar -= reserva.quantidade;
      return false; // Remove esta reserva
    }
    return true;
  });

  item.quantidade_reservada = item.reservas.reduce((total, reserva) => 
    total + reserva.quantidade, 0
  );

  if (item.quantidade_reservada === 0) {
    estoqueReservado.splice(itemIndex, 1);
  }

  salvarEstoqueReservado(estoqueReservado);
  console.log(`✅ Reserva liberada: ${quantidade}x produto ${produtoId}`);
};

// Confirmar consumo de estoque (converte reserva em consumo real)
export const confirmarConsumoEstoque = (produtoId: number, quantidade: number, mesaId?: number): void => {
  const produtos = produtoStorage.getAll();
  const produto = produtos.find(p => p.id === produtoId);
  if (!produto) return;

  // Marcar reserva como venda confirmada
  const estoqueReservado = getEstoqueReservado();
  const item = estoqueReservado.find(item => item.produtoId === produtoId);
  if (item) {
    item.reservas.forEach(reserva => {
      if (reserva.mesaId === mesaId) {
        reserva.venda_confirmada = true;
      }
    });
    salvarEstoqueReservado(estoqueReservado);
  }

  // Decrementa estoque real
  const novoEstoque = Math.max(0, produto.estoque - quantidade);
  produtoStorage.update(produtoId, {
    ...produto,
    estoque: novoEstoque
  });

  // Libera a reserva correspondente
  liberarReservaEstoque(produtoId, quantidade, 'mesa', mesaId);
  
  console.log(`✅ Estoque consumido: ${quantidade}x ${produto.nome} (${produto.estoque} → ${novoEstoque})`);
};

// Obter estoque disponível (real - reservado)
export const getEstoqueDisponivel = (produtoId: number): number => {
  limparReservasExpiradas();
  
  const produtos = produtoStorage.getAll();
  const produto = produtos.find(p => p.id === produtoId);
  if (!produto) return 0;

  const estoqueReservado = getEstoqueReservado();
  const itemReservado = estoqueReservado.find(item => item.produtoId === produtoId);
  const quantidadeReservada = itemReservado?.quantidade_reservada || 0;

  return Math.max(0, produto.estoque - quantidadeReservada);
};

// Cancelar reservas de mesa (sem venda confirmada)
export const cancelarReservasMesa = (mesaId: number): void => {
  const estoqueReservado = getEstoqueReservado();
  
  // Apenas libera reservas - NÃO registra cancelamento para pedidos não confirmados
  estoqueReservado.forEach(item => {
    const reservasDaMesa = item.reservas.filter(reserva => 
      reserva.mesaId === mesaId && !reserva.venda_confirmada
    );
    
    if (reservasDaMesa.length > 0) {
      const quantidadeLiberada = reservasDaMesa.reduce((total, reserva) => total + reserva.quantidade, 0);
      console.log(`🛒 Pedido de mesa ${mesaId} cancelado: ${quantidadeLiberada}x produto ${item.produtoId} - reserva liberada`);
    }
  });
  
  estoqueReservado.forEach(item => {
    item.reservas = item.reservas.filter(reserva => 
      reserva.mesaId !== mesaId || reserva.venda_confirmada
    );
    item.quantidade_reservada = item.reservas.reduce((total, reserva) => 
      total + reserva.quantidade, 0
    );
  });

  const estoqueAtualizado = estoqueReservado.filter(item => item.quantidade_reservada > 0);
  salvarEstoqueReservado(estoqueAtualizado);
  
  console.log(`✅ Reservas da mesa ${mesaId} canceladas (sem registro de cancelamento)`);
};

// Cancelar venda já confirmada (registra cancelamento e restaura estoque)
export const cancelarVendaConfirmada = (produtoId: number, quantidade: number, origem: 'mesa' | 'online', referencia?: string): void => {
  const origemCancelamento = origem === 'mesa' ? 'cancelamento_venda_fisica' : 'cancelamento_venda_online';
  
  console.log(`🚫 Cancelando venda confirmada: ${quantidade}x produto ${produtoId}`);
  
  // Importar registrarCancelamento dinamicamente para evitar imports circulares
  import('./movimentacaoEstoqueService').then(({ registrarCancelamento }) => {
    registrarCancelamento(produtoId, quantidade, origemCancelamento, referencia);
  });
};
