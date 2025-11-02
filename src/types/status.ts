
// Tipos padronizados para status do sistema
export type StatusMesa = 'Livre' | 'Ocupada' | 'Preparando' | 'Pronto' | 'Finalizado';

export type StatusPedido = 'Pendente' | 'Em Preparo' | 'Pronto' | 'Entregue' | 'Cancelado';

// Mapeamento entre status de mesa e pedido
export const STATUS_MAPPING = {
  mesa_to_pedido: {
    'Livre': null,
    'Ocupada': 'Pendente',
    'Preparando': 'Em Preparo',
    'Pronto': 'Pronto',
    'Finalizado': 'Entregue'
  } as const,
  pedido_to_mesa: {
    'Pendente': 'Ocupada',
    'Em Preparo': 'Preparando',
    'Pronto': 'Pronto',
    'Entregue': 'Finalizado',
    'Cancelado': 'Livre'
  } as const
};

export const getStatusColor = (status: StatusMesa | StatusPedido): string => {
  switch (status) {
    case 'Livre': return 'bg-green-500';
    case 'Ocupada':
    case 'Pendente': return 'bg-yellow-500';
    case 'Preparando':
    case 'Em Preparo': return 'bg-blue-500';
    case 'Pronto': return 'bg-orange-500';
    case 'Finalizado':
    case 'Entregue': return 'bg-emerald-500';
    case 'Cancelado': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};
