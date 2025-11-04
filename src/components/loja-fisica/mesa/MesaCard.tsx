import React, { useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, User, Clock, AlertTriangle, UserCheck } from "lucide-react";
import { Mesa, User as UserType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { authStorage } from '@/services/storageService';
import { formataPreco } from '@/contexts/moeda';

import { MesaCardProps } from '@/types/mesa';

const MesaCard = ({ mesa, mesaPedido, itensMesa, onOpen, onDelete, isOpen }: MesaCardProps) => {
  const { user } = useAuth();
  const effectiveItems = itensMesa ?? mesa.itens ?? [];
  const total = effectiveItems.reduce((acc, item) => acc + item.total, 0) || 0;
  const totalQuantidade = effectiveItems.reduce((acc, item) => acc + (item.quantidade || 0), 0) || 0;
  
  
  // Cores baseadas no status e permissões
  const getCardStyle = () => {
    if (mesa.status === 'livre') {
      return 'bg-green-600 hover:bg-green-700 border-green-500';
    }
    return 'bg-gray-600 hover:bg-gray-700 border-gray-500';
  };

  // Buscar dados do usuário responsável
  const getUsuarioResponsavel = (): UserType | null => {
    if (!mesa.usuarioId) return null;
    const allUsers = authStorage.getAllUsers();
    const found = allUsers.find(u => u.id === mesa.usuarioId) || null;
    return found as UserType | null;
  };

  const usuarioResponsavel = getUsuarioResponsavel();
  
  const renderPedidoValue = (value?: number | string) => {
    const raw = value;
    const isEmpty = raw === undefined || raw === null || Number(raw) === 0;
    return isEmpty ? '-' : String(raw);
  };

  useEffect(() => {
    console.log('[MesaCard] totalQuantidade:', totalQuantidade, 'mesa:', mesa);
  }, [totalQuantidade, mesa]);
  

  return (
    <Card className={`${getCardStyle()} text-white relative min-h-[200px] p-4 flex flex-col border-2 transition-all duration-200`}>
      {/* Status Badge */}
      <div className="absolute top-2 right-2">
        {mesa.status === 'livre' ? (
          <Badge variant="secondary" className="bg-green-100 text-green-800">Livre</Badge>
        ) : (
          <Badge variant="secondary" className="bg-white text-gray-800">Pedido #{renderPedidoValue(mesaPedido ?? mesa.pedido)}</Badge>
        )}
      </div>

      <div className="flex justify-between mb-2 mt-6">
        <Button
          variant="link"
          className="text-white hover:text-gray-100 p-0"
          onClick={onOpen}
        >
          {isOpen ? `Ver pedido #${renderPedidoValue(mesaPedido ?? mesa.pedido)}` : 'Abrir'}
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <h5 className="text-xl font-bold mb-2">{mesa.nome}</h5>

        <div className="text-sm mb-2">
          {totalQuantidade > 0 && (            
            <span className="text-xs opacity-80 ml-2">• {totalQuantidade} {totalQuantidade > 1 ? 'itens' : 'item'}</span>
          )}
        </div>

        {/* Total do pedido */}
        {total > 0 && (
          <div className="text-sm font-medium">{formataPreco(total)}</div>
        )}

        {/* Tempo de ocupação */}
        {mesa.status === 'ocupada' && (
          <div className="flex items-center gap-1 text-xs opacity-75 mt-1">
            <Clock className="h-3 w-3" />
            <span>Ativo</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MesaCard;
