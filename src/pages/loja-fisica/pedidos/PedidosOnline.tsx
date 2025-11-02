// pedidos/PedidosOnline.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Clock, User, CreditCard, Package, CheckCircle } from 'lucide-react';
import { obterHistoricoPedidos, atualizarStatusPedido } from '@/services/pedidoHistoricoService';
import { PedidoHistorico } from '@/types/pedido';
import { registrarSaida, registrarCancelamento } from '@/services/movimentacaoEstoqueService';
import { useToast } from '@/hooks/use-toast';
import { formataPreco } from '@/contexts/moeda';

const PedidosOnline = () => {
  const [pedidos, setPedidos] = useState<PedidoHistorico[]>([]);
  const { toast } = useToast();

  // Carregar pedidos online do localStorage
  useEffect(() => {
    const pedidosCarregados = obterHistoricoPedidos();
    setPedidos(pedidosCarregados);
    console.log('📋 Pedidos online carregados para loja física:', pedidosCarregados);
  }, []);

  // Função para formatar data e hora
  const formatarDataHora = (dataISO: string): string => {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Função para obter cor do status
  const obterCorStatus = (status: PedidoHistorico['status']): string => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'Em preparo': return 'bg-blue-500 hover:bg-blue-600';
      case 'Pronto': return 'bg-green-500 hover:bg-green-600';
      case 'Entregue': return 'bg-emerald-600 hover:bg-emerald-700';
      case 'Cancelado': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Função para atualizar status do pedido com controle de estoque
  const handleAtualizarStatus = (pedido_id: number, novoStatus: PedidoHistorico['status']) => {
    const pedido = pedidos.find(p => p.id === pedido_id);
    if (!pedido) return;

    const statusAnterior = pedido.status;

    // Registrar movimentações de estoque baseadas na mudança de status
    if (statusAnterior === 'Pendente' && novoStatus === 'Em preparo') {
      // Quando inicia preparo: registrar saída de estoque
      pedido.itens.forEach(item => {
        registrarSaida(
          item.id, // produtoId
          item.quantidade,
          'venda_online',
          `pedido-${pedido.numero}`,
          `Pedido online #${pedido.numero} - Iniciado preparo`
        );
      });
      console.log(`📦 Estoque reduzido para pedido #${pedido.numero} (Em preparo)`);
    }

    if (statusAnterior === 'Em preparo' && novoStatus === 'Cancelado') {
      // Quando cancela pedido em preparo: restaurar estoque
      pedido.itens.forEach(item => {
        registrarCancelamento(
          item.id, // produtoId
          item.quantidade,
          'cancelamento_venda_online',
          `pedido-${pedido.numero}`
        );
      });
      console.log(`↩️ Estoque restaurado para pedido cancelado #${pedido.numero}`);
    }

    if (statusAnterior === 'Pronto' && novoStatus === 'Cancelado') {
      // Quando cancela pedido pronto: restaurar estoque
      pedido.itens.forEach(item => {
        registrarCancelamento(
          item.id, // produtoId
          item.quantidade,
          'cancelamento_venda_online',
          `pedido-${pedido.numero}`
        );
      });
      console.log(`↩️ Estoque restaurado para pedido cancelado #${pedido.numero}`);
    }

    // Atualizar status do pedido
    atualizarStatusPedido(pedido_id, novoStatus);
    setPedidos(obterHistoricoPedidos()); // Recarregar lista
    
    toast({
      title: "Status atualizado",
      description: `Pedido #${pedido.numero} - ${novoStatus}`,
      duration: 3000,
    });
  };

  const pedidosPendentes = pedidos.filter(p => p.status === 'Pendente');
  const pedidosEmPreparo = pedidos.filter(p => p.status === 'Em preparo');
  const pedidosProntos = pedidos.filter(p => p.status === 'Pronto');
  const pedidosFinalizados = pedidos.filter(p => ['Entregue', 'Cancelado'].includes(p.status));

  const renderizarPedido = (pedido: PedidoHistorico) => (
    <Card key={pedido.id} className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="text-lg">Pedido #{pedido.numero}</CardTitle>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {pedido.nome} {/* Nome do usuário que fez o pedido */}
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatarDataHora(pedido.data)}
              </div>
            </div>
          </div>
          <Badge className={`${obterCorStatus(pedido.status)} text-white flex items-center gap-1`}>
            <ShoppingCart className="h-4 w-4" />
            {pedido.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Informações do pagamento */}
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm capitalize font-medium">{pedido.metodoPagamento}</span>
        </div>

        {/* Lista de itens para preparo */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-amber-600" />
            <h4 className="font-medium text-sm">Itens para preparo:</h4>
          </div>
          {pedido.itens.map((item) => (
            <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
              <div>
                <span className="font-medium">{item.nome}</span>
                <div className="text-sm text-muted-foreground">
                  Quantidade: {item.quantidade} | Preço unit: {formataPreco(item.venda)}
                </div>
              </div>
              <span className="font-bold text-amber-600">
                {formataPreco(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        <Separator className="my-3" />

        {/* Total do pedido */}
        <div className="flex justify-between items-center font-bold text-lg mb-4">
          <span>Total do Pedido:</span>
          <span className="text-amber-600">{formataPreco(pedido.total)}</span>
        </div>

        {/* Botões de ação baseados no status */}
        <div className="flex gap-2">
          {pedido.status === 'Pendente' && (
            <>
              <Button 
                onClick={() => handleAtualizarStatus(pedido.id, 'Em preparo')}
                className="bg-blue-600 hover:bg-blue-700 flex-1"
              >
                Iniciar Preparo
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleAtualizarStatus(pedido.id, 'Cancelado')}
              >
                Cancelar
              </Button>
            </>
          )}
          
          {pedido.status === 'Em preparo' && (
            <>
              <Button 
                onClick={() => handleAtualizarStatus(pedido.id, 'Pronto')}
                className="bg-green-600 hover:bg-green-700 flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Marcar como Pronto
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleAtualizarStatus(pedido.id, 'Cancelado')}
                size="sm"
              >
                Cancelar
              </Button>
            </>
          )}
          
          {pedido.status === 'Pronto' && (
            <>
              <Button 
                onClick={() => handleAtualizarStatus(pedido.id, 'Entregue')}
                className="bg-emerald-600 hover:bg-emerald-700 flex-1"
              >
                Marcar como Entregue
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleAtualizarStatus(pedido.id, 'Cancelado')}
                size="sm"
              >
                Cancelar
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="h-8 w-8 text-amber-600" />
        <h1 className="text-3xl font-bold text-amber-900">Pedidos Online</h1>
      </div>

      {pedidos.length === 0 ? (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-muted-foreground">
              Nenhum pedido online encontrado
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Os pedidos da loja online aparecerão aqui para preparo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Pedidos Pendentes */}
          {pedidosPendentes.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-yellow-700 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pedidos Pendentes ({pedidosPendentes.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pedidosPendentes.map(renderizarPedido)}
              </div>
            </div>
          )}

          {/* Pedidos Em Preparo */}
          {pedidosEmPreparo.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Em Preparo ({pedidosEmPreparo.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pedidosEmPreparo.map(renderizarPedido)}
              </div>
            </div>
          )}

          {/* Pedidos Prontos */}
          {pedidosProntos.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Prontos para Entrega ({pedidosProntos.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pedidosProntos.map(renderizarPedido)}
              </div>
            </div>
          )}

          {/* Pedidos Finalizados */}
          {pedidosFinalizados.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-700 mb-4">
                Finalizados ({pedidosFinalizados.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pedidosFinalizados.map(renderizarPedido)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Função para formatar data e hora
const formatarDataHora = (dataISO: string): string => {
  const data = new Date(dataISO);
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default PedidosOnline;

