// pedidos/PedidosLocais.tsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Clock, ChefHat, CheckCircle, Truck } from 'lucide-react';
import { PedidoLocalCard } from '@/components/loja-fisica/pedidos/PedidoLocalCard';
import { pedidoLocalStorage } from '@/services/storageService';
import { PedidoLocal } from '@/types/pedido';

const PedidosLocais = () => {
  const [activeTab, setActiveTab] = useState('todos');

  const { data: pedidos = [], refetch } = useQuery({
    queryKey: ['pedidos-locais'],
    queryFn: () => pedidoLocalStorage.getAll(),
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleStatusChange = () => {
    refetch();
  };

  // Escuta eventos de atualização de pedidos locais emitidos pelo storage
  useEffect(() => {
    const onUpdated = () => refetch();
    try {
      window.addEventListener('pedidos_locais_updated', onUpdated);
    } catch (e) {
      // ambiente sem window ou listener não disponível
    }
    return () => {
      try {
        window.removeEventListener('pedidos_locais_updated', onUpdated);
      } catch (e) {
        // ignore
      }
    };
  }, [refetch]);

  // Função para teste - limpar pedidos
  const handleLimparPedidos = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os pedidos? Esta ação não pode ser desfeita.')) {
      pedidoLocalStorage.clear();
      refetch();
    }
  };

  const pedidosPendentes = pedidos.filter(p => p.status === 'Pendente');
  const pedidosEmPreparo = pedidos.filter(p => p.status === 'Em Preparo');
  const pedidosProntos = pedidos.filter(p => p.status === 'Pronto');
  const pedidosEntregues = pedidos.filter(p => p.status === 'Entregue');

  const getTabContent = (status?: string) => {
    let filteredPedidos = pedidos;
    
    if (status) {
      filteredPedidos = pedidos.filter(p => p.status === status);
    }

    if (filteredPedidos.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhum pedido encontrado.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {filteredPedidos.map((pedido) => (
          <div key={pedido.id} className="self-start">
            <PedidoLocalCard
              pedido={pedido}
              onStatusChange={handleStatusChange}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-amber-900">Pedidos Locais</h1>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleLimparPedidos} variant="destructive" size="sm">
            Limpar Tudo
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-yellow-600">{pedidosPendentes.length}</span>
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Em Preparo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600">{pedidosEmPreparo.length}</span>
              <ChefHat className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Prontos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-600">{pedidosProntos.length}</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Entregues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-600">{pedidosEntregues.length}</span>
              <Truck className="w-5 h-5 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para filtrar pedidos */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="todos">
            Todos ({pedidos.length})
          </TabsTrigger>
          <TabsTrigger value="Pendente">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Pendentes ({pedidosPendentes.length})
            </div>
          </TabsTrigger>
          <TabsTrigger value="Em Preparo">
            <div className="flex items-center gap-1">
              <ChefHat className="w-4 h-4" />
              Em Preparo ({pedidosEmPreparo.length})
            </div>
          </TabsTrigger>
          <TabsTrigger value="Pronto">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Prontos ({pedidosProntos.length})
            </div>
          </TabsTrigger>
          <TabsTrigger value="Entregue">
            <div className="flex items-center gap-1">
              <Truck className="w-4 h-4" />
              Entregues ({pedidosEntregues.length})
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="mt-6">
          {getTabContent()}
        </TabsContent>
        
        <TabsContent value="Pendente" className="mt-6">
          {getTabContent('Pendente')}
        </TabsContent>
        
        <TabsContent value="Em Preparo" className="mt-6">
          {getTabContent('Em Preparo')}
        </TabsContent>
        
        <TabsContent value="Pronto" className="mt-6">
          {getTabContent('Pronto')}
        </TabsContent>
        
        <TabsContent value="Entregue" className="mt-6">
          {getTabContent('Entregue')}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PedidosLocais;


