
// Tipos padronizados para status do sistema
export type StatusMesa = 'livre' | 'ocupada' | 'preparando' | 'pronto' | 'finalizado';

export type StatusPedido = 'Pendente' | 'Em Preparo' | 'Pronto' | 'Entregue' | 'Cancelado';

// Mapeamento entre status de mesa e pedido
export const STATUS_MAPPING = {
  mesa_to_pedido: {
    'livre': null,
    'ocupada': 'Pendente',
    'preparando': 'Em Preparo',
    'pronto': 'Pronto',
    'finalizado': 'Entregue'
  } as const,
  pedido_to_mesa: {
    'Pendente': 'ocupada',
    'Em Preparo': 'preparando',
    'Pronto': 'pronto',
    'Entregue': 'finalizado',
    'Cancelado': 'livre'
  } as const
};

export const getStatusColor = (status: StatusMesa | StatusPedido): string => {
  switch (status) {
    case 'livre': return 'bg-green-500';
    case 'ocupada':
    case 'Pendente': return 'bg-yellow-500';
    case 'preparando':
    case 'Em Preparo': return 'bg-blue-500';
    case 'pronto': return 'bg-orange-500';
    case 'finalizado':
    case 'Entregue': return 'bg-emerald-500';
    case 'Cancelado': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};
