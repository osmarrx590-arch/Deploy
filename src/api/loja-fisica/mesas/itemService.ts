
//src\api\mesas\itemService.ts

import { ItemMesa } from '@/types/mesa';
import { decrementarEstoque } from './produtoService';
import apiServices from '@/services/apiServices';
import { getNextPedidoNumber } from '@/services/mesaService';

// Adiciona item à mesa via backend API
export const adicionarItemMesa = async (mesaId: number, item: ItemMesa, usuarioId?: number): Promise<Record<string, unknown>> => {
  console.log('[itemService] adicionando item à mesa via API', { mesaId, item, usuarioId });
  try {
    // Primeiro decrementar o estoque. Se falhar, não adicionamos o item à mesa
    await decrementarEstoque(item.produtoId, item.quantidade);

    // Chamar endpoint /mesas/{mesaId}/itens para adicionar o item na mesa
    // Quando estamos online, delegar a geração do número ao backend (servidor retorna número sequencial).
    // Apenas quando estivermos offline enviamos um número sugerido localmente para melhor UX.
    const isOnline = (typeof navigator !== 'undefined') ? Boolean(navigator.onLine) : true;
    const bodyObj: Record<string, unknown> = {
      produtoId: item.produtoId,
      quantidade: item.quantidade,
      nome: item.nome,
      precoUnitario: item.precoUnitario,
      usuarioId: usuarioId
    };
    if (!isOnline) {
      // gerar numero localmente apenas em fallback offline
      try {
        bodyObj.numero = getNextPedidoNumber();
      } catch (e) {
        // se falhar ao gerar numero local, não impedir a operação offline — simplesmente não enviar
        console.warn('[itemService] falha ao gerar numero sugerido localmente, continuando sem numero', e);
      }
    }

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'}/mesas/${mesaId}/itens`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyObj)
    });

  if (!res.ok) {
      // tentar restaurar o estoque se a API de adicionar item falhar
      try {
        await fetch(`${import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'}/estoque/movimentacoes`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ produtoId: item.produtoId, produtoNome: item.nome || '', quantidade: item.quantidade, tipo: 'entrada', origem: 'cancelamento_venda_fisica', data: new Date().toISOString().split('T')[0], observacoes: 'Rollback: falha ao adicionar item à mesa' })
        });
      } catch (rbErr) {
        console.error('[itemService] rollback falhou ao restaurar estoque:', rbErr);
      }

      throw new Error('Erro ao adicionar item na mesa (servidor)');
    }

    // Ler e retornar o body do servidor se houver (p.ex. mesa atualizada com número)
    try {
      const data = await res.json();
      // Se o backend retornou o número do pedido (campo 'pedido'), sincronizar o contador local
      try {
        const responseBody = data as unknown;
        let servidorPedidoRaw: unknown = undefined;
        if (responseBody && typeof responseBody === 'object') {
          const rb = responseBody as Record<string, unknown>;
          servidorPedidoRaw = rb['pedido'];
        }
        const servidorPedido = typeof servidorPedidoRaw === 'number' ? servidorPedidoRaw : parseInt(String(servidorPedidoRaw ?? ''), 10);
        if (!isNaN(servidorPedido)) {
          const key = 'highestPedido';
          const atualRaw = localStorage.getItem(key);
          const atual = atualRaw ? parseInt(atualRaw, 10) : 0;
          if (isNaN(atual) || servidorPedido > atual) {
            try {
              localStorage.setItem(key, String(servidorPedido));
              console.log('[itemService] sincronizou highestPedido com servidor:', servidorPedido);
            } catch (e) {
              // ignore problema ao gravar no localStorage
            }
          }
        }
      } catch (e) {
        // não bloquear fluxo caso parsing falhe
      }
      return data;
    } catch (parseErr) {
      return {};
    }
  } catch (error) {
    console.error('[itemService] erro ao adicionar item à mesa via API:', error);
    throw error;
  }
};

export const removerItemMesa = async (mesaId: number, itemId: number): Promise<void> => {
  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'}/mesas/${mesaId}/itens/${itemId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) {
      throw new Error('Erro ao remover item no servidor');
    }
  } catch (error) {
    console.error('[itemService] erro ao remover item via API:', error);
    throw error;
  }
};


