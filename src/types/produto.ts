
import { Categoria } from './categoria';
import { EmpresaData } from './empresa';

// Interface principal unificada para produtos
export interface Produto {
  id: number;
  nome: string;
  categoria: string;
  descricao: string;
  custo: number;
  venda: number;
  codigo: string;
  estoque: number;
  empresaId: number;
  disponivel: boolean;
  imagem: string;
  slug: string;
  // Propriedades opcionais para Beer compatibility
  style?: string;
  abv?: number;
  ibu?: number;
  price?: number;
  rating?: number;
}

// Interface para items no carrinho (extends Produto)
export interface ItemCarrinho extends Produto {
  quantidade: number;
}

// Interface base para itens de produto em diferentes contextos
export interface ItemBase {
  id: number;
  nome: string;
  quantidade: number;
  venda: number;
  total: number;
  produtoId: number;
}

// Interface para input de pedidos (simplificada)
export interface ItemPedidoInput {
  id: number;
  nome: string;
  quantidade: number;
  venda: number;
}

// Interface unificada para tabelas de produtos
export interface ProdutoTableData {
  id: number;
  nome: string;
  categoria: string;
  descricao: string;
  custo: number;
  venda: number;
  codigo: string;
  estoque: number;
  disponivel: boolean;
  empresaId: number;
  empresa: string; 
  imagem: string;
  slug?: string; // Optional for table display
}

// Form interface for product creation/editing
export interface ProdutoFormData {
  nome: string;
  categoria: string;
  descricao: string;
  custo: number;
  venda: number;
  codigo: string;
  estoque: number;
  empresaId: number;
  disponivel: boolean;
  imagem?: string;
}

// Re-export ProdutoFormData as ProdutoFormSubmitData for backward compatibility
export type ProdutoFormSubmitData = ProdutoFormData;

// Produto Dialog Props
export interface ProdutoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // onSubmit receives form-like data (ProdutoFormSubmitData) rather than a full Produto with id
  onSubmit: (data: ProdutoFormSubmitData) => void;
  empresas: EmpresaData[];
  categorias: Categoria[];
  initialData?: Produto;
  slug?: string;
}

// Produto Table Props
export interface ProdutoTableProps {
  produtos: ProdutoTableData[];
  onEdit: (produto: ProdutoTableData) => void;
  onDelete: (id: number) => void;
  sortConfig?: { key: string | null; direction: 'ascending' | 'descending'; };
  onRequestSort?: (key: string) => void;
}

// Beer interface (unificado com Produto)
export interface Beer {
  id: number;
  name: string;
  style: string;
  description: string;
  abv: number;
  ibu: number;
  image: string;
  price: number;
  rating: number;
}
