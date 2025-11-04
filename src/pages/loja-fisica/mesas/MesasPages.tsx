import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { getAllMesas, getMesaById, salvarMesa, deleteMesa } from '@/api/loja-fisica/mesas/mesaService';
import { backfillPedidosFromItens } from '@/services/mesaService';
import { useMesaNotifications } from '@/hooks/useMesaNotifications';
import { useAuth } from '@/contexts/AuthContext';
import MesaCard from '@/components/loja-fisica/mesa/MesaCard';
import MesaActions from '@/components/loja-fisica/mesa/MesaActions';
import MesaDashboard from '@/components/loja-fisica/mesa/MesaDashboard';

const MesasPages = () => {
  const [isNovaMesaDialogOpen, setIsNovaMesaDialogOpen] = useState(false);
  const [isBalcaoDialogOpen, setIsBalcaoDialogOpen] = useState(false);
  const [nomeBalcao, setNomeBalcao] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  // Converter profile para o formato minimal { id: number, nome?: string } que useMesaNotifications espera
  const profileForNotifications = profile ? { id: Number((profile as { id?: string | number }).id || 0), nome: (profile as { nome?: string }).nome } : null;
  const { notifyMesaChange } = useMesaNotifications(profileForNotifications);

  const { data: mesas = [], refetch } = useQuery({
    queryKey: ['mesas'],
    queryFn: getAllMesas,
    initialData: [],
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  });

  // Estado local para uma versão "enriquecida" das mesas com itens carregados
  const [mesasEnriched, setMesasEnriched] = useState<typeof mesas | null>(null);

  // Debug: logar resumo das mesas para confirmar presença do campo `pedido`
  useEffect(() => {
    try {
      const src = mesasEnriched ?? mesas;
      console.log('[MesasPages] mesas summary:', (src || []).map(m => ({ id: m.id, nome: m.nome, pedido: m.pedido, itensLen: Array.isArray(m.itens) ? m.itens.length : 0 })));
      console.log('[MesasPages] tipos de pedido:', (src || []).map(m => ({ id: m.id, tipo: typeof m.pedido })));
    } catch (e) {
      console.warn('[MesasPages] erro ao logar mesas', e);
    }
  }, [mesas, mesasEnriched]);

  // Quando a lista de mesas muda, tentar enriquecer mesas que tenham pedido definido mas itens vazios
  useEffect(() => {
    let mounted = true;
    const enrich = async () => {
      try {
        if (!Array.isArray(mesas) || mesas.length === 0) return;
        // Identificar mesas que parecem ter pedido (pedido > 0) mas sem itens carregados
        const needFetch = mesas.filter(m => (m.pedido && m.pedido !== 0) && (!Array.isArray(m.itens) || m.itens.length === 0));
        if (needFetch.length === 0) {
          // não há necessidade de enrich
          setMesasEnriched(null);
          return;
        }

        const promises = mesas.map(async (m) => {
          if ((m.pedido && m.pedido !== 0) && (!Array.isArray(m.itens) || m.itens.length === 0)) {
            try {
              const detailed = await getMesaById(m.id);
              return detailed || m;
            } catch (e) {
              // se falhar, retorna a mesa original
              return m;
            }
          }
          return m;
        });

        const enriched = await Promise.all(promises);
        if (mounted) setMesasEnriched(enriched as typeof mesas);
      } catch (e) {
        console.warn('[MesasPages] erro ao enriquecer mesas com itens', e);
      }
    };
    enrich();
    return () => { mounted = false; };
  }, [mesas]);

  // Backfill: se existirem mesas com itens mas pedido==0, gerar números e refetch
  useEffect(() => {
    try {
      const changed = backfillPedidosFromItens();
      if (changed) {
        console.log('[MesasPages] backfillPedidosFromItens fez alterações, forçando refetch');
        refetch();
      }
    } catch (e) {
      console.warn('[MesasPages] erro ao executar backfillPedidosFromItens', e);
    }
  }, [refetch]);

  // Escutar eventos de mesa via BroadcastChannel para refetch imediato quando outra aba alterou mesas
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('mesa_events');
        bc.onmessage = (ev: MessageEvent) => {
          try {
            const data = ev.data;
            if (data?.type === 'mesa_event') {
              console.log('[MesasPages] received mesa_event via BroadcastChannel, refetching');
              refetch();
            }
          } catch (e) {
            // ignore
          }
        };
      }
    } catch (e) {
      // ambiente sem window/BC — ok
      bc = null;
    }

      return () => { if (bc) { try { bc.close(); } catch (e) { /* ignore */ } } };
  }, [refetch]);

  const handleDeleteMesa = (mesaId: number) => {
    try {
      deleteMesa(mesaId);
      refetch();
      toast({
        title: "Mesa excluída",
        description: "A mesa foi excluída com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir mesa",
        description: "Não foi possível excluir a mesa.",
      });
    }
  };

  useEffect(() => {
    // Verificar se há mesas no storage para forçar refetch se necessário
    refetch();
  }, [refetch]);

  const sourceMesas = mesasEnriched ?? mesas;

  const mesasOcupadas = sourceMesas
    .filter(mesa => mesa.status === 'ocupada')
    .sort((a, b) => {
      // Normalizar pedido para número quando possível para ordenação correta
      const aPedidoNum = typeof a.pedido === 'number' ? a.pedido : parseInt(String(a.pedido || ''), 10);
      const bPedidoNum = typeof b.pedido === 'number' ? b.pedido : parseInt(String(b.pedido || ''), 10);
      if (!isNaN(aPedidoNum) && !isNaN(bPedidoNum)) {
        if (aPedidoNum !== bPedidoNum) return aPedidoNum - bPedidoNum;
      } else {
        // Fallback para comparar como string
        if (String(a.pedido) !== String(b.pedido)) return String(a.pedido).localeCompare(String(b.pedido));
      }
      return a.nome.localeCompare(b.nome);
    });

  const mesasLivres = sourceMesas
    .filter(mesa => mesa.status === 'livre')
    .sort((a, b) => {
      const numA = parseInt(a.nome);
      const numB = parseInt(b.nome);
      
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      
      return a.nome.localeCompare(b.nome);
    });

  const mesasDisponiveis = Array.from({ length: 20 }, (_, i) => {
    const num = (i + 1).toString().padStart(2, '0');
    return !mesas.some(m => m.nome === num) ? num : null;
  }).filter(Boolean) as string[];

  useEffect(() => {
    console.log('[MesasPages] counts -> total:', sourceMesas.length, 'livres:', mesasLivres.length, 'ocupadas:', mesasOcupadas.length);
  }, [sourceMesas, mesasLivres, mesasOcupadas]);

  const handleCreateMesa = async (numero: string) => {
    try {
      const novaMesa = await salvarMesa({
        nome: numero,
        status: 'livre',
        pedido: 0
      });
      
      refetch();
      setIsNovaMesaDialogOpen(false);
      toast({
        title: "Mesa criada",
        description: `A mesa ${numero} foi criada com sucesso.`
      });

      if (user) {
        notifyMesaChange('updated', novaMesa);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar mesa",
        description: "Não foi possível criar a mesa.",
      });
    }
  };

  const handleCreateMesaBalcao = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!nomeBalcao.trim()) return;
    
    try {
      const novaMesa = await salvarMesa({
        nome: nomeBalcao,
        status: 'livre',
        pedido: 0
      });
      
      refetch();
      setIsBalcaoDialogOpen(false);
      setNomeBalcao('');
      toast({
        title: "Mesa de balcão criada",
        description: `A mesa para ${nomeBalcao} foi criada com sucesso.`
      });

      if (user) {
        notifyMesaChange('updated', novaMesa);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar mesa de balcão",
        description: "Não foi possível criar a mesa.",
      });
    }
  };

  const handleOpenMesa = (mesaSlug: string) => {
    navigate(`/loja-fisica/mesas/${mesaSlug}`);
  };

  return (
    <div className="container mx-auto py-8">
      {/* Dashboard de monitoramento */}
      <MesaDashboard mesas={mesas} />

      <MesaActions
        isNovaMesaDialogOpen={isNovaMesaDialogOpen}
        setIsNovaMesaDialogOpen={setIsNovaMesaDialogOpen}
        isBalcaoDialogOpen={isBalcaoDialogOpen}
        setIsBalcaoDialogOpen={setIsBalcaoDialogOpen}
        nomeBalcao={nomeBalcao}
        setNomeBalcao={setNomeBalcao}
        handleCreateMesa={handleCreateMesa}
        handleCreateMesaBalcao={handleCreateMesaBalcao}
        mesasDisponiveis={mesasDisponiveis}
      />

      {mesasOcupadas.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-green-600 mb-4">
            Pedido(s) em andamento ({mesasOcupadas.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mesasOcupadas.map((mesa) => (
              <MesaCard
                /* { chave  } */
                key={mesa.nome || mesa.slug || mesa.id}
                mesa={mesa}
                mesaPedido={mesa.pedido}
                itensMesa={mesa.itens}
                onOpen={() => handleOpenMesa(mesa.slug || mesa.nome || String(mesa.id))}
                onDelete={() => handleDeleteMesa(mesa.id)}
                isOpen={true}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-2xl font-bold text-blue-600 mb-4">
          Mesas disponíveis ({mesasLivres.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mesasLivres.map((mesa) => (
            <MesaCard
              key={mesa.nome || mesa.slug || mesa.id}
              mesa={mesa}
              mesaPedido={mesa.pedido}
              itensMesa={mesa.itens}
              onOpen={() => handleOpenMesa(mesa.slug || mesa.nome || String(mesa.id))}
              onDelete={() => handleDeleteMesa(mesa.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MesasPages;
