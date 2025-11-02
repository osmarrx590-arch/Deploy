import { StatusMesa } from './status';
import { User } from './auth';

import { ItemBase } from './produto';

export interface ItemMesa extends ItemBase {
  mesaId: number;
  precoUnitario: number;
  status: string;
}

export interface Mesa {
  id: number;
  nome: string;
  status: StatusMesa;
  // padronizado: pedido é inteiro
  pedido: number;
  itens?: ItemMesa[];
  slug?: string;
  usuarioId?: number;
  statusPedido?: StatusMesa;
}

// Mesa Actions Props
export interface MesaActionsProps {
  isNovaMesaDialogOpen: boolean;
  setIsNovaMesaDialogOpen: (open: boolean) => void;
  isBalcaoDialogOpen: boolean;
  setIsBalcaoDialogOpen: (open: boolean) => void;
  nomeBalcao: string;
  setNomeBalcao: (nome: string) => void;
  handleCreateMesa: (numero: string) => void;
  handleCreateMesaBalcao: (event: React.FormEvent) => void;
  mesasDisponiveis: string[];
}

// Mesa Card Props
export interface MesaCardProps {
  mesa: Mesa;
  mesaPedido?: number | string;
  itensMesa?: ItemMesa[];
  onOpen: () => void;
  onDelete: () => void;
  isOpen?: boolean;
}

// Mesa Dashboard Props
export interface MesaDashboardProps {
  mesas: Mesa[];
}

// Mesa Info Card Props
export interface MesaInfoCardProps {
  mesa: Mesa | undefined;
  currentTime: Date;
  user: User | { id: number; nome?: string } | null;
  onPagamentoRealizado?: () => void;
  onMesaAtualizada?: () => void;
}

// Pagamento Dialog Props
export interface PagamentoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mesaNome: string;
  pedidoNumero: number | string;
  itensMesa: ItemMesa[];
  totalGeral: number;
  onPagamentoConfirmado: () => void;
}

// Comanda Card Props
export interface ComandaCardProps {
  mesaId?: number;
  mesaNome?: string;
  mesaPedido?: number | string;
  itensMesa: ItemMesa[];
  statusPedido?: string;
  onAddProduto: () => void;
  onDeleteItem: (itemId: number) => void;
  onCancelPedido: () => void;
  onPedidoFinalizado?: () => void;
  totalGeral: number;
}

// Mesa Event for notifications
export interface MesaEvent {
  type: 'occupied' | 'freed' | 'transferred' | 'updated';
  mesa: Mesa;
  // Event user may come from different contexts (full User or a minimal profile)
  user: User | { id: number; nome?: string };
  timestamp: number;
}