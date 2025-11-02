import { useEffect, useState } from 'react';
import * as localMesaService from '@/services/mesaService';
import * as pedidoHistoricoService from '@/services/pedidoHistoricoService';
import { produtoService as apiProdutoService } from '@/services/apiServices';
import { produtosLocais } from '@/data/produtos_locais';

type Metrics = {
  mesasAtivas: number;
  produtosCount: number;
  pedidosHoje: number;
  faturamentoHoje: number;
  pedidosOntem?: number;
  faturamentoOntem?: number;
  isLoading: boolean;
  error?: string | null;
};

const formatDateKey = (d: Date) => d.toISOString().slice(0, 10);

export const useDashboardMetrics = (): Metrics => {
  const [mesasAtivas, setMesasAtivas] = useState<number>(0);
  const [produtosCount, setProdutosCount] = useState<number>(0);
  const [pedidosHoje, setPedidosHoje] = useState<number>(0);
  const [faturamentoHoje, setFaturamentoHoje] = useState<number>(0);
  const [pedidosOntem, setPedidosOntem] = useState<number | undefined>(undefined);
  const [faturamentoOntem, setFaturamentoOntem] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Mesas: usar storage local (disponível via localMesaService)
        try {
          const mesas = localMesaService.getAllMesas();
          const ocupadas = mesas.filter(m => (m.status && m.status !== 'Livre') || (Array.isArray(m.itens) && m.itens.length > 0) || (m.pedido && m.pedido > 0));
          if (mounted) setMesasAtivas(ocupadas.length);
        } catch (e) {
          // Em caso de erro, assume 0
          if (mounted) setMesasAtivas(0);
        }

        // Produtos: tenta backend via apiProdutoService, senão fallback para produtosLocais
        try {
          const produtos = await apiProdutoService.getAll();
          if (mounted) setProdutosCount(Array.isArray(produtos) ? produtos.length : produtosLocais.length);
        } catch (e) {
          if (mounted) setProdutosCount(produtosLocais.length);
        }

        // Pedidos / Faturamento: combinar histórico (pedidoHistoricoService) + pedidos_locais
        const historico = pedidoHistoricoService.obterHistoricoPedidos();

        const pedidosLocaisRaw = (typeof window !== 'undefined') ? JSON.parse(localStorage.getItem('pedidos_locais') || '[]') : [];

        const allPedidos = Array.isArray(historico) ? [...historico] : [];
        // normalizar formato: historico tem `data` e `total`; pedidos_locais tem `dataHora` e `total`
        const pedidosLocais = Array.isArray(pedidosLocaisRaw) ? pedidosLocaisRaw : [];

        const todayKey = formatDateKey(new Date());
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = formatDateKey(yesterday);

        let todayCount = 0;
        let todayTotal = 0;
        let yCount = 0;
        let yTotal = 0;

        // processar historico
        allPedidos.forEach(p => {
          const pDate = p.data ? String(p.data).slice(0, 10) : undefined;
          if (pDate === todayKey) {
            todayCount += 1;
            todayTotal += Number(p.total || 0);
          } else if (pDate === yesterdayKey) {
            yCount += 1;
            yTotal += Number(p.total || 0);
          }
        });

        // processar pedidos_locais
        interface PedidoLocalLike { dataHora?: string; data?: string; total?: number | string }
        (pedidosLocais as PedidoLocalLike[]).forEach((p) => {
          const pDate = p.dataHora ? String(p.dataHora).slice(0, 10) : (p.data ? String(p.data).slice(0,10) : undefined);
          if (pDate === todayKey) {
            todayCount += 1;
            todayTotal += Number(p.total || 0);
          } else if (pDate === yesterdayKey) {
            yCount += 1;
            yTotal += Number(p.total || 0);
          }
        });

        if (mounted) {
          setPedidosHoje(todayCount);
          setFaturamentoHoje(todayTotal);
          setPedidosOntem(yCount);
          setFaturamentoOntem(yTotal);
        }

      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (mounted) setError(msg);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();

    // opcional: atualizar periodicamente (ex: a cada 15s)
    const interval = setInterval(load, 15000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return {
    mesasAtivas,
    produtosCount,
    pedidosHoje,
    faturamentoHoje,
    pedidosOntem,
    faturamentoOntem,
    isLoading,
    error,
  };
};

export default useDashboardMetrics;
