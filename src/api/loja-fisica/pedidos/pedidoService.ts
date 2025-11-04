import * as mesaService from '@/services/mesaService';
import apiServices from '@/services/apiServices';

export const cancelarPedido = async (mesaId: number): Promise<void> => {
  try {
    await apiServices.pedidoService.cancelar(mesaId);

    return;
  } catch (error) {
    console.warn('[pedidoService] API de cancelar pedido indisponível, usando fallback local', error);
    try {
      mesaService.cancelarPedido(mesaId);
      return;
    } catch (inner) {
      console.error('[pedidoService] fallback local falhou ao cancelar pedido:', inner);
      throw inner;
    }
  }
};

