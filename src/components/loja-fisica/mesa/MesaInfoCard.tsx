import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mesa, User } from '@/types';
import { PagamentoDialog } from './PagamentoDialog';
import { processarPagamento } from '@/services/pagamentoService';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, User as UserIcon } from 'lucide-react';
import { formataPreco } from '@/contexts/moeda';

import { MesaInfoCardProps } from '@/types/mesa';

export const MesaInfoCard = ({ 
  mesa, 
  currentTime, 
  user, 
  onPagamentoRealizado,
  onMesaAtualizada 
}: MesaInfoCardProps) => {
  const [isPagamentoDialogOpen, setIsPagamentoDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleRealizarPagamento = () => {
    if (mesa && mesa.itens && mesa.itens.length > 0) {
      setIsPagamentoDialogOpen(true);
    }
  };

  const handlePagamentoConfirmado = async () => {
    if (!mesa || !mesa.itens || mesa.itens.length === 0) return;

    const totalGeral = mesa.itens.reduce((acc, item) => acc + item.total, 0);

    await processarPagamento({
      mesaId: mesa.id,
      mesaNome: mesa.nome,
      pedidoNumero: mesa.pedido,
      metodoPagamento: 'processado',
      itens: mesa.itens,
      subtotal: totalGeral,
      desconto: 0,
      total: totalGeral,
      
    });

    if (onPagamentoRealizado) {
      onPagamentoRealizado();
    }
  };

  const totalGeral = mesa?.itens?.reduce((acc, item) => acc + item.total, 0) || 0;
  const temItens = mesa?.itens && mesa.itens.length > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600 font-bold">
            Mesa: {mesa?.nome}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-bold">Pedido: {mesa?.pedido ?? '-'}</p>
              <p className="bg-green-600 text-white px-2 py-1 rounded inline-block">
                Em aberto
              </p>
            </div>
            
            <div className="space-y-2 text-gray-600">
              <p>Data: {currentTime.toLocaleDateString()}</p>
              <p>Hora: {currentTime.toLocaleTimeString()}</p>   
              {temItens && (
                <p className="font-semibold text-green-600">
                  Total: {formataPreco(totalGeral)}
                </p>
              )}
            </div>  
        
            <div className="space-x-2">
              <Button 
                variant="default" 
                className="bg-green-600 hover:bg-green-700"
                onClick={handleRealizarPagamento}
                disabled={!temItens}
              >
                Realizar Pagamento
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <PagamentoDialog
        isOpen={isPagamentoDialogOpen}
        onClose={() => setIsPagamentoDialogOpen(false)}
        mesaNome={mesa?.nome || ''}
        pedidoNumero={mesa?.pedido ?? ''}
        itensMesa={mesa?.itens || []}
        totalGeral={totalGeral}
        onPagamentoConfirmado={handlePagamentoConfirmado}
      />
    </>
  );
};
