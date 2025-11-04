import { Mesa } from '@/types/mesa';
import { mesaService } from '@/services/apiServices';
// Fallback local service that persists no localStorage
import { getAllMesas as getAllMesasLocal } from '@/services/mesaService';

export const getAllMesas = async (): Promise<Mesa[]> => {
  try {
    return await mesaService.getAll();
  } catch (error) {
    // Se o backend não estiver disponível, fazer fallback para o storage local
    try {
      console.warn('[api/mesas] backend indisponível, usando fallback local de mesas', error);
      const local = getAllMesasLocal();
      return local;
    } catch (localErr) {
      console.error('[api/mesas] fallback local falhou:', localErr);
      // Re-throw o erro original para que o caller saiba que tudo falhou
      throw error;
    }
  }
};

export const getMesaById = async (id: number): Promise<Mesa | null> => {
  try {
    return await mesaService.getById(id);
  } catch (error) {
    console.error('Erro ao buscar mesa:', error);
    throw error;
  }
};

export const getMesaBySlug = async (slug: string): Promise<Mesa | null> => {
  try {
    // Helper para normalizar qualquer objeto de mesa vindo do backend/local
    const normalizeMesaObj = (mesaObj: Record<string, unknown>): Mesa => {
      const usuarioIdVal = (mesaObj['usuario_responsavel_id'] ?? mesaObj['usuarioId']) as number | undefined;
      const pedidoRaw = mesaObj['pedido'];
      let pedidoVal: number | string = 0;
      if (typeof pedidoRaw === 'number') {
        pedidoVal = pedidoRaw as number;
      } else if (typeof pedidoRaw === 'string' && pedidoRaw.trim().length > 0) {
        pedidoVal = pedidoRaw;
      }

      const itensRaw = (mesaObj['itens'] ?? mesaObj['items']) as unknown[] | undefined;
      const itensNorm = Array.isArray(itensRaw) ? itensRaw.map(it => {
        const item = it as Record<string, unknown>;
        const id = Number(item['id'] ?? Date.now());
        const nome = String(item['nome'] ?? item['nome_produto'] ?? '');
        const quantidade = Number(item['quantidade'] ?? item['qtd'] ?? 0);
        const produtoId = Number(item['produtoId'] ?? item['produto_id'] ?? item['produto'] ?? 0);
        const venda = Number(item['venda'] ?? item['precoUnitario'] ?? item['preco_unitario'] ?? 0);
        let total = Number(item['total'] ?? (quantidade * venda));
        if (!Number.isFinite(total)) total = 0;
        const mesaId = Number(item['mesaId'] ?? item['mesa_id'] ?? mesaObj['id'] ?? 0);
        const precoUnitario = Number(item['precoUnitario'] ?? item['preco_unitario'] ?? venda ?? 0);
        const status = String(item['status'] ?? 'ativo');
        return {
          id,
          nome,
          quantidade,
          venda,
          total,
          produtoId,
          mesaId,
          precoUnitario,
          status
        };
      }) : [];

      return {
        id: Number(mesaObj['id'] ?? 0),
        nome: String(mesaObj['nome'] ?? ''),
        status: String(mesaObj['status'] ?? 'livre'),
        pedido: pedidoVal,
        itens: itensNorm,
        slug: String(mesaObj['slug'] ?? ''),
        usuarioId: usuarioIdVal,
        statusPedido: mesaObj['statusPedido'] ?? mesaObj['status_pedido'] ?? undefined,
      } as unknown as Mesa;
    };

    // Tentar endpoint dedicado por slug primeiro
    try {
      const mesaDirect = await mesaService.getBySlug(slug);
      console.log('[mesaService.getMesaBySlug] getBySlug direct result:', { slug, mesaDirect });
      if (mesaDirect) {
        return normalizeMesaObj(mesaDirect as unknown as Record<string, unknown>);
      }
    } catch (err) {
      console.error('[mesaService.getMesaBySlug] erro ao chamar getBySlug:', err);
    }

    let mesas: Mesa[] | undefined;
    try {
      mesas = await mesaService.getAll();
    } catch (fetchErr) {
      console.error('[mesaService.getMesaBySlug] erro ao chamar mesaService.getAll():', fetchErr);
      // Retorna null para que o front consiga tratar; os logs acima ajudarão a diagnosticar
      return null;
    }

    // Debug: mostrar o slug solicitado e resumo das mesas recebidas
    try {
      console.log('[mesaService.getMesaBySlug] requested slug:', slug);
      console.log('[mesaService.getMesaBySlug] mesas count:', Array.isArray(mesas) ? mesas.length : 0);
      console.log('[mesaService.getMesaBySlug] mesas sample (id, slug, nome):', (Array.isArray(mesas) ? mesas : []).map((m: Mesa) => ({ id: m.id, slug: m.slug, nome: m.nome })));
    } catch (e) {
      // ignore logging errors
    }

    // Normalizar para comparação case-insensitive
    const normalize = (s?: string) => (s || '').toString().trim().toLowerCase();
    const slugNorm = normalize(slug);

    // Tenta encontrar por slug (case-insensitive)
    let found = mesas.find((mesa: Mesa) => normalize(mesa.slug) === slugNorm);
    if (found) {
      console.log('[mesaService.getMesaBySlug] found by slug (normalize):', { id: found.id, slug: found.slug, nome: found.nome });
      return normalizeMesaObj(found as unknown as Record<string, unknown>);
    }

    // Tenta encontrar por nome (case-insensitive)
    found = mesas.find((mesa: Mesa) => normalize(String(mesa.nome)) === slugNorm);
    if (found) {
      console.log('[mesaService.getMesaBySlug] found by nome (normalize):', { id: found.id, slug: found.slug, nome: found.nome });
      return normalizeMesaObj(found as unknown as Record<string, unknown>);
    }

    // Gera um slug simples localmente e compara (caso backend use formato diferente como 'Mesa-04')
    const gerarSlugLocal = (nome: string) => {
      if (!nome) return '';
      const trimmed = String(nome).trim();
      const onlyDigits = trimmed.replace(/\D/g, '');
      if (onlyDigits && onlyDigits === trimmed.replace(/\s/g, '')) {
        return `mesa-${String(onlyDigits).padStart(2, '0')}`.toLowerCase();
      }
      const parts = trimmed.split(/[-_\s]+/).filter(Boolean).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
      return parts.join('-').toLowerCase();
    };

    // Debug: mostrar slug normalizado e alguns slugs/nomes normalizados das mesas
    try {
      console.log('[mesaService.getMesaBySlug] slugNorm:', slugNorm);
      console.log('[mesaService.getMesaBySlug] mesas normalized sample:', (mesas || []).slice(0, 20).map((m: Mesa) => ({ id: m.id, slug: normalize(m.slug), nome: normalize(m.nome), genSlug: gerarSlugLocal(String(m.slug || m.nome)) })));
    } catch (e) {
      // ignore
    }

    found = mesas.find((mesa: Mesa) => normalize(gerarSlugLocal(String(mesa.slug || mesa.nome))) === slugNorm || normalize(mesa.slug) === slugNorm || normalize(String(mesa.nome)) === slugNorm);
    if (found) {
      console.log('[mesaService.getMesaBySlug] found by gerarSlugLocal/other:', { id: found.id, slug: found.slug, nome: found.nome });
      return normalizeMesaObj(found as unknown as Record<string, unknown>);
    } else {
      console.log('[mesaService.getMesaBySlug] not found for slug:', slug);
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar mesa por slug:', error);
    throw error;
  }
};

export const salvarMesa = async (mesa: Omit<Mesa, 'id'>): Promise<Mesa> => {
  try {
    return await mesaService.create(mesa);
  } catch (error) {
    console.error('Erro ao salvar mesa:', error);
    throw error;
  }
};

export const atualizarMesa = async (id: number, mesaData: Partial<Mesa>): Promise<Mesa> => {
  try {
    await mesaService.update(id, mesaData);
    const mesa = await mesaService.getById(id);
    if (!mesa) {
      throw new Error(`Mesa with id ${id} not found`);
    }
    return mesa;
  } catch (error) {
    console.error('Erro ao atualizar mesa:', error);
    throw error;
  }
};

export const deleteMesa = async (id: number): Promise<void> => {
  try {
    await mesaService.delete(id);
  } catch (error) {
    console.error('Erro ao deletar mesa:', error);
    throw error;
  }
};
