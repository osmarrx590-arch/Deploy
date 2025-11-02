
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, ShoppingBag, CreditCard, Trash2, User } from 'lucide-react';
import { obterHistoricoPedidos, atualizarStatusPedido, limparHistorico } from '@/services/pedidoHistoricoService';
import { PedidoHistorico } from '@/types/pedido';
import { useToast } from '@/hooks/use-toast';
import { formataPreco } from '@/contexts/moeda'; // Importa função de formatação de preço

const Historico = () => {
  const [pedidos, setPedidos] = useState<PedidoHistorico[]>([]);
  const { toast } = useToast();

  // Carregar pedidos do localStorage ao montar o componente
  useEffect(() => {
    const pedidosCarregados = obterHistoricoPedidos();
    setPedidos(pedidosCarregados);
    console.log('📋 Pedidos carregados do histórico:', pedidosCarregados);
  }, []);

  // Função para formatar data
  const formatarData = (dataISO: string): string => {
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
      case 'Pendente': return 'bg-yellow-500';
      case 'Em preparo': return 'bg-blue-500';
      case 'Pronto': return 'bg-green-500';
      case 'Entregue': return 'bg-emerald-600';
      case 'Cancelado': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Função para atualizar status do pedido
  const handleAtualizarStatus = (pedido_id: number, novoStatus: PedidoHistorico['status']) => {
    atualizarStatusPedido(pedido_id, novoStatus);
    setPedidos(obterHistoricoPedidos()); // Recarregar lista
    toast({
      title: "Status atualizado",
      description: `Status do pedido alterado para: ${novoStatus}`,
      duration: 2000,
    });
  };

  // Função para limpar histórico completo
  const handleLimparHistorico = () => {
    limparHistorico();
    setPedidos([]);
    toast({
      title: "Histórico limpo",
      description: "Todos os pedidos foram removidos do histórico.",
      duration: 2000,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Cabeçalho da página */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShoppingBag className="h-8 w-8" />
          Histórico de Pedidos
        </h1>
        {pedidos.length > 0 && (
          <Button variant="outline" onClick={handleLimparHistorico}>
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar Histórico
          </Button>
        )}
      </div>

      {/* Lista de pedidos ou mensagem vazia */}
      {pedidos.length === 0 ? (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-muted-foreground">
              Nenhum pedido encontrado
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Você ainda não fez nenhum pedido. Que tal começar agora?
            </p>
            <Button onClick={() => window.location.href = '/loja-online/produtos'}>
              Ver Produtos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pedidos.map((pedido) => (
            <Card key={pedido.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Pedido #{pedido.numero}</CardTitle>
                    {/* Visualizador de usuário */}
                    <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                      <User className="w-4 h-4" />
                      {pedido.nome}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      {formatarData(pedido.data)}
                    </div>
                  </div>
                  <Badge className={`${obterCorStatus(pedido.status)} text-white`}>
                    {pedido.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Informações do pagamento */}
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm capitalize">{pedido.metodoPagamento}</span>
                </div>

                {/* Lista de itens do pedido */}
                <div className="space-y-2 mb-4">
                  <h4 className="font-medium text-sm">Itens:</h4>
                  {pedido.itens.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantidade}x {item.nome}</span>
                      <span>{formataPreco(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                <Separator className="my-3" />

                {/* Resumo financeiro */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formataPreco(pedido.subtotal)}</span>
                  </div>
                  {pedido.desconto > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto:</span>
                      <span>- {formataPreco(pedido.desconto)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>{formataPreco(pedido.total)}</span>
                  </div>
                </div>

                {/* Botões de ação do status (simulação) */}
                {pedido.status === 'Pendente' && (
                  <div className="mt-4 flex gap-2">                
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleAtualizarStatus(pedido.id, 'Cancelado')}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
                
                {pedido.status === 'Em preparo' && (
                  <Button 
                    size="sm" 
                    className="mt-4 w-full"
                    onClick={() => handleAtualizarStatus(pedido.id, 'Pronto')}
                  >
                    Marcar como Pronto
                  </Button>
                )}
                
                {pedido.status === 'Pronto' && (
                  <Button 
                    size="sm" 
                    className="mt-4 w-full"
                    onClick={() => handleAtualizarStatus(pedido.id, 'Entregue')}
                  >
                    Marcar como Entregue
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Historico;


