import * as mesaService from '@/services/mesaService';

export const cancelarPedido = async (mesaId: number): Promise<void> => {
  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'}/pedidos/${mesaId}/cancelar`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!res.ok) {
      throw new Error('API retornou erro');
    }

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

