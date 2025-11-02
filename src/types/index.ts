// Core entities
export type { Produto, ProdutoFormData, ItemCarrinho, ItemPedidoInput, ProdutoTableData, Beer, ProdutoFormSubmitData } from './produto';
export type { Mesa, ItemMesa } from './mesa';
export type { User, AuthState, LoginCredentials, RegisterData, AuthContextType, StoredUser } from './auth';
export type { Empresa, NotaFiscal, EmpresaData, EmpresaFormData } from './empresa';
export type { Categoria } from './categoria';
export type { MovimentacaoEstoque, EstoqueReserva } from './estoque';
export type { PedidoLocal, CriarPedidoLocalData, PedidoHistorico, DadosPedidoInput, DadosPagamento } from './pedido';

// Context types
export type { CarrinhoContextData } from './carrinho';
export type { FavoritosContextType } from './favoritos';
export type { AvaliacoesContextType, Avaliacao } from './avaliacoes';
export type { EmpresasContextType } from './empresa';

// Status types
export type { StatusMesa, StatusPedido } from './status';
export { STATUS_MAPPING, getStatusColor } from './status';

// Common interfaces (keep only truly generic ones)
export type { 
  CategoriaData,
  NotaFiscalData,
  MesaFormData,
  EnderecoEntrega,
  FormularioContato,
  ParametrosConsulta,
  RespostaAPI,
  ConfiguracaoApp
} from './common';
