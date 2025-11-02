import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, CheckCircle, Truck, ChefHat, Wine } from 'lucide-react';
import { pedidoLocalStorage } from '@/services/storageService';
import { PedidoLocal } from '@/types/pedido';
import { sincronizarPedidoParaMesa } from '@/services/sincronizacaoService';
import { getStatusColor } from '@/types/status';
import { useToast } from "@/hooks/use-toast";
import { formataPreco } from '@/contexts/moeda';

interface PedidoLocalCardProps {
  pedido: PedidoLocal;
  onStatusChange: () => void;
}

export const PedidoLocalCard = ({ pedido, onStatusChange }: PedidoLocalCardProps) => {
  const { toast } = useToast();

  const handleStatusChange = (novoStatus: PedidoLocal['status']) => {
    pedidoLocalStorage.updateStatus(pedido.id, novoStatus);
    sincronizarPedidoParaMesa(pedido.id, novoStatus);
    onStatusChange();

    const statusMessages = {
      'Em Preparo': 'Pedido em preparo',
      'Pronto': 'Pedido pronto para entrega',
      'Entregue': 'Pedido entregue com sucesso',
      'Cancelado': 'Pedido cancelado'
    };

    toast({
      title: statusMessages[novoStatus] || 'Status atualizado',
      description: `Pedido #${pedido.numeroPedido} - Mesa ${pedido.mesaNome}`
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pendente': return <Clock className="w-4 h-4" />;
      case 'Em Preparo': return <ChefHat className="w-4 h-4" />;
      case 'Pronto': return <CheckCircle className="w-4 h-4" />;
      case 'Entregue': return <Truck className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const { date, time } = formatDateTime(pedido.dataHora);

  // Cor do ícone da mesa conforme status
  const getMesaIconColor = (status: string) => {
    switch (status) {
      case 'Pendente': return 'text-yellow-600';
      case 'Em Preparo': return 'text-blue-600';
      case 'Pronto': return 'text-green-600';
      case 'Entregue': return 'text-gray-600';
      case 'Cancelado': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <Card className="w-full relative">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">
                Pedido #{pedido.numeroPedido}
              </CardTitle>
              <Badge className={`${getStatusColor(pedido.status)} text-white flex items-center gap-1`}>
                {getStatusIcon(pedido.status)}
                {pedido.status}
              </Badge>
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Wine className={`w-4 h-4 ${getMesaIconColor(pedido.status)}`} aria-hidden="true" />
                Mesa {pedido.mesaNome}
              </div>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {pedido.atendente}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {date} às {time}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Itens:</h4>
            <div className="space-y-1">
              {pedido.itens.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.quantidade}x {item.nome}</span>
                  <span>{formataPreco(item.total)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>{formataPreco(pedido.total)}</span>
              </div>
            </div>
          </div>

          {pedido.observacoes && (
            <div>
              <h4 className="font-medium mb-1">Observações:</h4>
              <p className="text-sm text-gray-600">{pedido.observacoes}</p>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex gap-2 pt-2">
            {pedido.status === 'Pendente' && (
              <>
                <Button 
                  onClick={() => handleStatusChange('Em Preparo')}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <ChefHat className="w-4 h-4 mr-1" />
                  Iniciar Preparo
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => handleStatusChange('Cancelado')}
                  size="sm"
                >
                  Cancelar
                </Button>
              </>
            )}
            
            {pedido.status === 'Em Preparo' && (
              <Button 
                onClick={() => handleStatusChange('Pronto')}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Marcar como Pronto
              </Button>
            )}
            
            {pedido.status === 'Pronto' && (
              <Button 
                onClick={() => handleStatusChange('Entregue')}
                className="bg-gray-600 hover:bg-gray-700"
                size="sm"
              >
                <Truck className="w-4 h-4 mr-1" />
                Marcar como Entregue
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
