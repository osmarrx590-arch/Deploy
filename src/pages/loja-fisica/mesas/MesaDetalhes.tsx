import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMesaNotifications } from '@/hooks/useMesaNotifications';
import { produtoStorage } from '@/services/storageService';
import * as mesaServiceLocal from '@/services/mesaService';
import * as mesaServiceApi from '@/api/loja-fisica/mesas/mesaService';
import { getEstoqueDisponivel, reservarEstoque } from '@/services/estoqueReservaService';
import { ItemMesa, Mesa, Produto } from '@/types';
import * as itemApi from '@/api/loja-fisica/mesas/itemService';
import { MesaInfoCard } from '@/components/loja-fisica/mesa/MesaInfoCard';
import { ComandaCard } from '@/components/loja-fisica/mesa/ComandaCard';
import { useAuth } from '@/contexts/AuthContext';
import { formataPreco } from '@/contexts/moeda';
import { Package } from 'lucide-react';

// Helper functions
const getAllProdutos = async (): Promise<Produto[]> => {
  return produtoStorage.getAll();
};

const MesaDetalhes = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  // Converter o usuário/profile vindo do backend (string ids) para o formato minimal esperado
  const userForNotifications = user ? { id: Number((user as unknown as { id?: string | number }).id || 0), nome: (user as unknown as { nome?: string }).nome } : null;
  const profileForInfoCard = profile ? { id: Number((profile as { id: string }).id || 0), nome: profile.nome } : null;
  const { notifyMesaChange } = useMesaNotifications(userForNotifications);
  const [isAddProdutoOpen, setIsAddProdutoOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const mesaSlug = id || '';
  const shouldFetchMesa = mesaSlug.length > 0;

  // Logar o slug atual para depuração de roteamento
  useEffect(() => {
    console.log('[MesaDetalhes] mesaSlug changed', { mesaSlug });
  }, [mesaSlug]);

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos'],
    queryFn: getAllProdutos,
  });

  const { data: mesa, refetch: refetchMesa, isLoading: isMesaLoading, isError: isMesaError, error: mesaError } = useQuery({
    queryKey: ["mesa", mesaSlug],
    queryFn: async () => {
      if (!shouldFetchMesa) return null;
      console.log('[MesaDetalhes] Buscando mesa via API', { mesaSlug });
      try {
        const result = await mesaServiceApi.getMesaBySlug(mesaSlug);
        console.log('[MesaDetalhes] Resultado da API', { mesaSlug, result });
        // se a API retornar null (por ex. 404), tentar fallback local
        if (result) return result;
        console.warn('[MesaDetalhes] API retornou null para a mesa, usando fallback local', { mesaSlug });
      } catch (err) {
        console.error('[MesaDetalhes] erro ao chamar API de mesa, usando fallback local', err);
      }

      // Fallback local (localStorage) quando backend indisponível
      try {
        const local = mesaServiceLocal.getMesaBySlug(mesaSlug);
        console.log('[MesaDetalhes] Resultado fallback local', { mesaSlug, local });
        return local || null;
      } catch (localErr) {
        console.error('[MesaDetalhes] erro ao obter mesa do storage local', localErr);
        return null;
      }
    },
    enabled: shouldFetchMesa,
    refetchInterval: 3000, // Atualiza a cada 3 segundos para mudanças em tempo real
  });

  useEffect(() => {
    console.log('[MesaDetalhes] query state', { mesaSlug, isMesaLoading, isMesaError, mesaError });
  }, [mesaSlug, isMesaLoading, isMesaError, mesaError]);

  // Log quando a mesa é carregada para ajudar na depuração
  useEffect(() => {
    if (mesa) {
      console.log('[MesaDetalhes] mesa loaded', { mesaSlug, mesa });
    }
  }, [mesa, mesaSlug]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAddProduto = async (produtoId: number, quantidade: number) => {
    let lastApiResult: Record<string, unknown> | undefined = undefined;
    // marca produto como em adição (para desabilitar UI)
    setAddingProdutoIds(prev => new Set(prev).add(produtoId));
    console.log('[MesaDetalhes] handleAddProduto start', { produtoId, quantidade, mesaId: mesa?.id });
    // Proteção: garantir que mesa e usuário estejam carregados antes de prosseguir
    if (!mesa) {
      console.warn('[MesaDetalhes] mesa ainda não carregada — abortando adicionar produto', { produtoId, quantidade });
      toast({
        title: 'Mesa não carregada',
        description: 'Aguarde a mesa ser carregada e tente novamente.',
        variant: 'destructive'
      });
      return;
    }
    if (!user) {
      console.warn('[MesaDetalhes] usuário não autenticado — abortando adicionar produto');
      toast({
        title: 'Usuário não autenticado',
        description: 'Faça login para adicionar produtos à mesa.',
        variant: 'destructive'
      });
      return;
    }

    const produto = produtos.find(p => p.id === produtoId);
    if (produto && mesa && user) {
      // Verificar se há estoque disponível e reservar
      const estoqueDisponivel = getEstoqueDisponivel(produtoId);
      if (estoqueDisponivel < quantidade) {
        toast({
          title: "Estoque insuficiente",
          description: `Só há ${estoqueDisponivel} unidades disponíveis de ${produto.nome}.`,
          variant: "destructive"
        });
        return;
      }

      // Reservar o estoque
      const reservaEfetuada = reservarEstoque(produtoId, quantidade, 'mesa', mesa.id);
      if (!reservaEfetuada) {
        toast({
          title: "Erro ao reservar estoque",
          description: `Não foi possível reservar ${quantidade}x ${produto.nome}.`,
          variant: "destructive"
        });
        return;
      }

      const itemExistente = mesa.itens?.find(item => item.produtoId === produtoId);
      
      if (itemExistente) {
        console.log('[MesaDetalhes] itemExistente encontrado, atualizando quantidade', { itemExistente, quantidade });
        // gravar quantidade anterior para possível rollback
        const prevQuantidade = itemExistente.quantidade;
        const itensAtualizados = mesa.itens?.map(item => {
          if (item.produtoId === produtoId) {
            const novaQuantidade = item.quantidade + quantidade;
            return {
              ...item,
              quantidade: novaQuantidade,
              total: produto.venda * novaQuantidade
            };
          }
          return item;
        }) || [];

        // Atualiza localmente de forma otimista o localStorage
        mesaServiceLocal.atualizarMesa(mesa.id, { itens: itensAtualizados });
        console.log('[MesaDetalhes] chamado mesaServiceLocal.atualizarMesa', { mesaId: mesa.id, itensAtualizados });

        // Também persistir no backend: chamar API para incrementar a quantidade
        try {
          await itemApi.adicionarItemMesa(mesa.id, {
            id: Date.now(),
            nome: produto.nome,
            quantidade,
            venda: produto.venda,
            total: produto.venda * quantidade,
            produtoId: produtoId,
            mesaId: mesa.id,
            precoUnitario: produto.venda,
            status: 'ativo'
          }, parseInt(profile?.user_id || '0'));
          toast({
            title: "Quantidade atualizada",
            description: `${quantidade}x ${produto.nome} adicionado. Total: ${prevQuantidade + quantidade}x`
          });
        } catch (err) {
          console.error('[MesaDetalhes] erro ao atualizar quantidade via API, fazendo rollback local', err);
          // rollback local simples: restaurar quantidade anterior
          const rollbackItems = mesa.itens?.map(item => {
            if (item.produtoId === produtoId) {
              return {
                ...item,
                quantidade: prevQuantidade,
                total: produto.venda * prevQuantidade
              };
            }
            return item;
          }) || [];
          mesaServiceLocal.atualizarMesa(mesa.id, { itens: rollbackItems });
          toast({ title: 'Erro', description: 'Não foi possível atualizar a quantidade no servidor. Operação revertida.', variant: 'destructive' });
        }
        finally {
          // remover flag de adição
          setAddingProdutoIds(prev => {
            const copy = new Set(prev);
            copy.delete(produtoId);
            return copy;
          });
        }
      } else {
        console.log('[MesaDetalhes] item não existe, criando novoItem', { produtoId, quantidade });
        const novoItem: ItemMesa = {
          id: Date.now(),
          nome: produto.nome,
          quantidade,
          venda: produto.venda,
          total: produto.venda * quantidade,
          produtoId: produtoId,
          mesaId: mesa.id,
          precoUnitario: produto.venda,
          status: 'ativo'
        };
        
        console.log('[MesaDetalhes] chamando itemApi.adicionarItemMesa (API) para adicionar item', { novoItem });
        try {
          // Captura o resultado do servidor (pode conter mesa atualizada / número do pedido)
          const apiResult = await itemApi.adicionarItemMesa(mesa.id, novoItem, parseInt(profile?.user_id || '0'));
          // Se o backend retornou dados úteis, guardamos para usar ao atualizar local
          lastApiResult = apiResult as Record<string, unknown> | undefined;
        } catch (err) {
          console.error('[MesaDetalhes] erro ao adicionar item via API', err);
          toast({ title: 'Erro', description: 'Não foi possível adicionar o produto. Tente novamente.', variant: 'destructive' });
          return;
        }
        finally {
          setAddingProdutoIds(prev => {
            const copy = new Set(prev);
            copy.delete(produtoId);
            return copy;
          });
        }
        // Garantir que o estado local também seja atualizado para refletir o novo pedido
        try {
          // Atualiza localStorage (gera numero de pedido se necessário)
          // Tentar extrair o número do retorno da API (vários formatos possíveis)
          const apiResultLocal = lastApiResult;
          const extractNumeroFromApi = (obj?: Record<string, unknown>): number | string | undefined => {
            if (!obj) return undefined;
            const mesaField = obj['mesa'];
            if (mesaField && typeof mesaField === 'object' && (mesaField as Record<string, unknown>)['pedido']) {
              return (mesaField as Record<string, unknown>)['pedido'] as number | string | undefined;
            }
            if (obj['numero']) return obj['numero'] as number | string;
            if (obj['pedido']) return obj['pedido'] as number | string;
            return undefined;
          };

          const numeroRetornado = extractNumeroFromApi(apiResultLocal);
          mesaServiceLocal.adicionarItemMesa(mesa.id, novoItem, parseInt(profile?.user_id || '0'), numeroRetornado);
          // Forçar recarregamento imediato da query para refletir o pedido gerado
          try { refetchMesa(); } catch (rfErr) { console.warn('[MesaDetalhes] refetchMesa falhou após atualização local', rfErr); }
        } catch (localErr) {
          console.warn('[MesaDetalhes] falha ao atualizar mesa local após adicionar item via API', localErr);
        }

        // Notificar se a mesa estava livre e agora foi ocupada
        if (mesa.status === 'livre') {
          notifyMesaChange('occupied', { ...mesa, status: 'ocupada', usuarioId: parseInt(profile?.user_id || '0') });
        }
        
        toast({
          title: "Produto adicionado",
          description: `${quantidade}x ${produto.nome} adicionado à mesa.`
        });
      }

      refetchMesa();
      console.log('[MesaDetalhes] handleAddProduto end');
    }
  };

  // control state to disable add buttons per product while request in progress
  const [addingProdutoIds, setAddingProdutoIds] = useState<Set<number>>(new Set());

  const handleDeleteItem = (itemId: number) => {
    if (mesa && user) {
      (async () => {
        try {
          await itemApi.removerItemMesa(mesa.id!, itemId);
          toast({ title: 'Item removido', description: 'Item removido com sucesso.' });
          refetchMesa();
        } catch (err) {
          console.error('Erro ao remover item via API', err);
          toast({ title: 'Erro', description: 'Não foi possível remover o item.', variant: 'destructive' });
        }
      })();
    }
  };

  const handleCancelPedido = () => {
    if (!mesa) {
      toast({ title: 'Erro', description: 'Mesa não carregada.', variant: 'destructive' });
      return;
    }

    try {
      // Executa cancelamento local (limpa itens, libera estoque, atualiza status)
      mesaServiceLocal.cancelarPedido(mesa.id);
      // Notificar mudança — usuário pode ser undefined em modos offline/dev
  notifyMesaChange('freed', { ...mesa, status: 'livre', usuarioId: undefined });
      // Forçar recarregamento da mesa
      refetchMesa();
      console.log('[MesaDetalhes] pedido cancelado localmente', { mesaId: mesa.id });
    } catch (err) {
      console.error('[MesaDetalhes] erro ao cancelar pedido localmente', err);
      toast({ title: 'Erro', description: 'Não foi possível cancelar o pedido.', variant: 'destructive' });
    }
  };

  const handlePagamentoRealizado = () => {
    if (mesa && user) {
      notifyMesaChange('freed', { ...mesa, status: 'livre', usuarioId: undefined });
    }
    refetchMesa();
    toast({
      title: "Pagamento realizado com sucesso!",
      description: "A mesa foi liberada e o pedido foi finalizado."
    });
  };

  const handlePedidoFinalizado = () => {
    refetchMesa();
  };

  const totalGeral = mesa?.itens?.reduce((acc, item) => acc + item.total, 0) || 0;

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MesaInfoCard 
          mesa={mesa}
          currentTime={currentTime}
          user={profileForInfoCard}
          onPagamentoRealizado={handlePagamentoRealizado}
          onMesaAtualizada={refetchMesa}
        />

        <ComandaCard 
          mesaId={mesa?.id}
          mesaNome={mesa?.nome}
          mesaPedido={mesa?.pedido}
          itensMesa={mesa?.itens || []}
          statusPedido={mesa?.statusPedido}
          onAddProduto={() => setIsAddProdutoOpen(true)}
          onDeleteItem={handleDeleteItem}
          onCancelPedido={handleCancelPedido}
          onPedidoFinalizado={handlePedidoFinalizado}
          totalGeral={totalGeral}
        />
      </div>

      <Dialog open={isAddProdutoOpen} onOpenChange={setIsAddProdutoOpen}>
        <DialogContent aria-describedby="add-produto-desc" className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Adicionar Produto à Mesa: {mesa?.nome}</DialogTitle>
          </DialogHeader>
          {/* Descrição para acessibilidade - escondida visualmente */}
          <div id="add-produto-desc" className="sr-only">Selecione um produto e quantidade para adicionar à mesa atual.</div>
          
          <ScrollArea className="h-[60vh] w-full rounded-md">
            <Tabs defaultValue="table" className="w-full">
              <TabsList>
                <TabsTrigger value="table">Tabela</TabsTrigger>
                <TabsTrigger value="grid">Grade</TabsTrigger>
              </TabsList>

              <TabsContent value="table">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Categoria</th>
                      <th>Preço</th>
                      <th>Quantidade</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                      {produtos.map((produto) => (
                        <ProdutoTableRow 
                          key={produto.id}
                          produto={produto}
                          onAddProduto={handleAddProduto}
                          addingProdutoIds={addingProdutoIds}
                        />
                      ))}
                  </tbody>
                </table>
              </TabsContent>

              <TabsContent value="grid">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {produtos.map((produto) => (
                    <ProdutoGridCard
                      key={produto.id}
                      produto={produto}
                      onAddProduto={handleAddProduto}
                      addingProdutoIds={addingProdutoIds}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ProdutoTableRow = ({ produto, onAddProduto, addingProdutoIds }: { 
  produto: Produto; 
  onAddProduto: (id: number, quantidade: number) => void; 
  addingProdutoIds: Set<number>;
}) => {
  const [quantidade, setQuantidade] = useState(1);
  const isAdding = addingProdutoIds.has(produto.id);

  return (
    <tr>
      <td>{produto.nome}</td>
      <td>{produto.categoria}</td>
      <td>{formataPreco(produto.venda)}</td>
      <td>
        <Input
          type="number"
          min="1"
          value={quantidade}
          onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
          className="w-20"
        />
      </td>
      <td>
        <Button 
          onClick={() => onAddProduto(produto.id, quantidade)}
          className="bg-green-600 hover:bg-green-700"
          disabled={isAdding}
        >
          {isAdding ? 'Adicionando...' : 'Adicionar'}
        </Button>
      </td>
    </tr>
  );
};

const ProdutoGridCard = ({ produto, onAddProduto, addingProdutoIds }: { 
  produto: Produto; 
  onAddProduto: (id: number, quantidade: number) => void; 
  addingProdutoIds: Set<number>;
}) => {
  const [quantidade, setQuantidade] = useState(1);
  const isAdding = addingProdutoIds.has(produto.id);

  // Usar o serviço de estoque disponível
  const estoqueDisponivel = getEstoqueDisponivel(produto.id);
  const estoqueZerado = estoqueDisponivel === 0;
  const estoqueBaixo = estoqueDisponivel > 0 && estoqueDisponivel <= 5;

  return (
    <Card className={estoqueZerado ? 'opacity-50' : ''}>
      {produto.imagem && (
        <div className="relative">
          <img
            src={produto.imagem}
            alt={produto.nome}
            className="w-full h-48 object-cover"
          />
          {/* Badge de estoque */}
          <div className="absolute bottom-2 left-2">
            {estoqueZerado ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                Esgotado
              </Badge>
            ) : estoqueBaixo ? (
              <Badge variant="secondary" className="bg-yellow-500 text-white flex items-center gap-1">
                <Package className="w-3 h-3" />
                Últimas {estoqueDisponivel} unidades
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-green-500 text-white flex items-center gap-1">
                <Package className="w-3 h-3" />
                {estoqueDisponivel} disponíveis
              </Badge>
            )}
          </div>
        </div>
      )}
      <CardContent className="p-4">
        <h3 className="font-bold">{produto.nome}</h3>
        <p>{produto.categoria}</p>
        <p className="text-sm text-muted-foreground">
          {estoqueDisponivel} disponíveis
        </p>
        <p className="font-bold">{formataPreco(produto.venda)}</p>
        <div className="flex items-center gap-2 mt-2">
          <Input
            type="number"
            min="1"
            max={estoqueDisponivel}
            value={quantidade}
            onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
            className="w-20"
            disabled={estoqueZerado}
          />
          <Button 
            onClick={() => onAddProduto(produto.id, quantidade)}
            className="bg-green-600 hover:bg-green-700"
            disabled={estoqueZerado || isAdding}
          >
            {isAdding ? 'Adicionando...' : (estoqueZerado ? 'Esgotado' : 'Adicionar')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MesaDetalhes;
