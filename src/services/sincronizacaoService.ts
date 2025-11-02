
import { pedidoLocalStorage } from '@/services/storageService';
import * as mesaService from '@/services/mesaService';
import { PedidoLocal } from '@/types/pedido';
import { STATUS_MAPPING, StatusMesa, StatusPedido } from '@/types/status';
import { cancelarReservasMesa, confirmarConsumoEstoque } from './estoqueReservaService';

// Sincronizar status mesa -> pedido local
export const sincronizarMesaParaPedido = (mesaId: number, novoStatusMesa: StatusMesa): void => {
  const pedidos = pedidoLocalStorage.getAll();
  const pedidoDaMesa = pedidos.find(p => p.mesaId === mesaId);
  
  if (!pedidoDaMesa) return;

  const statusPedido = STATUS_MAPPING.mesa_to_pedido[novoStatusMesa];
  if (statusPedido && statusPedido !== pedidoDaMesa.status) {
    const pedidos = pedidoLocalStorage.getAll();
    const index = pedidos.findIndex(p => p.id === pedidoDaMesa.id);
    if (index !== -1) {
      pedidos[index].status = statusPedido;
      pedidoLocalStorage.save(pedidos);
    }
    console.log(`✅ Status sincronizado: Mesa ${mesaId} -> Pedido ${pedidoDaMesa.id} (${statusPedido})`);
  }
};

// Sincronizar status pedido local -> mesa
export const sincronizarPedidoParaMesa = (pedido_id: number, novoStatusPedido: StatusPedido): void => {
  const pedidos = pedidoLocalStorage.getAll();
  const pedido = pedidos.find(p => p.id === pedido_id);
  
  if (!pedido) return;

  const statusMesa = STATUS_MAPPING.pedido_to_mesa[novoStatusPedido];
  if (statusMesa) {
    mesaService.atualizarMesa(pedido.mesaId, {
      status: statusMesa === 'Livre' ? 'Livre' : 'Ocupada',
      statusPedido: statusMesa
    });

    // Se pedido foi entregue, confirma consumo do estoque
    if (novoStatusPedido === 'Entregue') {
      pedido.itens.forEach(item => {
        confirmarConsumoEstoque(item.produtoId, item.quantidade, pedido.mesaId);
      });
      
      // Limpa a mesa
      mesaService.atualizarMesa(pedido.mesaId, {
        status: 'Livre',
        pedido: 0,
        itens: [],
        usuarioId: undefined,
        statusPedido: undefined
      });
    }

    // Se pedido foi cancelado, cancela reservas
    if (novoStatusPedido === 'Cancelado') {
      cancelarReservasMesa(pedido.mesaId);
      
      // Limpa a mesa
      mesaService.atualizarMesa(pedido.mesaId, {
        status: 'Livre',
        pedido: 0,
        itens: [],
        usuarioId: undefined,
        statusPedido: undefined
      });
    }

    console.log(`✅ Status sincronizado: Pedido ${pedido_id} -> Mesa ${pedido.mesaId} (${statusMesa})`);
  }
};

// Cancelar pedido local quando mesa é cancelada
export const cancelarPedidoLocal = (mesaId: number): void => {
  const pedidos = pedidoLocalStorage.getAll();
  const pedidoDaMesa = pedidos.find(p => p.mesaId === mesaId && !['Entregue', 'Cancelado'].includes(p.status));
  
  if (pedidoDaMesa) {
    const pedidos = pedidoLocalStorage.getAll();
    const index = pedidos.findIndex(p => p.id === pedidoDaMesa.id);
    if (index !== -1) {
      pedidos[index].status = 'Cancelado';
      pedidoLocalStorage.save(pedidos);
    }
    cancelarReservasMesa(mesaId);
    console.log(`✅ Pedido local ${pedidoDaMesa.id} cancelado (mesa ${mesaId})`);
  }
};

// Verificar se mesa tem pedido ativo
export const mesaTemPedidoAtivo = (mesaId: number): boolean => {
  const pedidos = pedidoLocalStorage.getAll();
  return pedidos.some(p => 
    p.mesaId === mesaId && 
    !['Entregue', 'Cancelado'].includes(p.status)
  );
};
