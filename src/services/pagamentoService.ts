
import { salvarPedidoNoHistorico } from './pedidoHistoricoService';
import * as mesaService from '@/services/mesaService';
import apiServices from '@/services/apiServices';
import { ItemMesa } from '@/types/mesa';
import { confirmarConsumoEstoque } from './estoqueReservaService';
import { registrarSaida } from './movimentacaoEstoqueService';

import { DadosPagamento } from '@/types/pedido';

export const processarPagamento = async (dados: DadosPagamento): Promise<void> => {
  try {
    console.log('💳 Iniciando processamento de pagamento físico:', {
      mesa: dados.mesaNome,
      pedido: dados.pedidoNumero,
      total: dados.total,
      itens: dados.itens.length
    });

    // Confirmar consumo de estoque para todos os itens
    dados.itens.forEach(item => {
      confirmarConsumoEstoque(item.produtoId, item.quantidade, dados.mesaId);
      registrarSaida(
        item.produtoId, 
        item.quantidade, 
        'venda_fisica', 
        `mesa-${dados.mesaId}-pedido-${dados.pedidoNumero}`
      );
    });

    console.log('✅ Estoque consumido para venda física');

    // Tentar chamar backend para processar pagamento centralizado
    try {
      // Delegar chamada ao serviço centralizado (backend)
      const mesaAtualizada = await apiServices.mesaService.processarPagamento(dados.mesaId, {
        metodo: dados.metodoPagamento,
        itens: dados.itens,
        total: dados.total,
        pedidoNumero: Number(dados.pedidoNumero),
      });
      console.log('✅ Pagamento processado via backend, mesa atualizada:', mesaAtualizada);
      return;
    } catch (err) {
      console.warn('Backend indisponível para processar pagamento, usando fluxo local', err);

      // Salva o pedido no histórico (local)
      const pedidoHistorico = salvarPedidoNoHistorico({
        metodoPagamento: dados.metodoPagamento,
        itens: dados.itens.map(item => ({
          ...item,
          venda: item.venda
        })),
        subtotal: dados.subtotal,
        desconto: dados.desconto,
        total: dados.total,
        nome: dados.mesaNome
      });

      // Libera a mesa (volta ao status 'Livre') localmente
      mesaService.atualizarMesa(dados.mesaId, {
        status: 'livre',
        pedido: 0,
        itens: [],
        usuarioId: undefined,
        statusPedido: undefined
      });

      console.log('✅ Pagamento processado localmente (fallback):', {
        pedido_id: pedidoHistorico.id,
        mesaId: dados.mesaId,
        total: dados.total,
        estoque_atualizado: true
      });
      return;
    }

  } catch (error) {
    console.error('❌ Erro ao processar pagamento:', error);
    throw error;
  }
};
