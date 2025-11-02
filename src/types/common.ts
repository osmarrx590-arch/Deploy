// Interfaces comuns para substituir tipos 'any' em toda a aplicação
// Somente interfaces verdadeiramente genéricas que não pertencem a domínios específicos
export interface CategoriaData {
  id: number;
  nome: string;
  descricao?: string;
}

export interface NotaFiscalData {
  id?: number;
  empresaId: number;
  serie: string;
  numero: string;
  descricao: string;
  data: string;
}

export interface MesaFormData {
  nome: string;
  status: 'Ocupada' | 'Livre';
  pedido: number | string;
}

// Generic interfaces for system-wide usage
export interface EnderecoEntrega {
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface FormularioContato {
  nome: string;
  email: string;
  telefone?: string;
  assunto: string;
  mensagem: string;
}

export interface ParametrosConsulta {
  [key: string]: string | number | boolean | undefined;
}

export interface RespostaAPI<T = unknown> {
  sucesso: boolean;
  dados?: T;
  erro?: string;
  mensagem?: string;
}

export interface ConfiguracaoApp {
  nome: string;
  versao: string;
  ambiente: 'desenvolvimento' | 'producao' | 'teste';
  configuracoes: Record<string, string | number | boolean>;
}

// UI Component Props
export interface ClassificacaoPorEstrelasProps {
  rating: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
}

// Re-export User types from auth for backward compatibility
export type { User, StoredUser } from './auth';

// Item Mesa Interface for PrintService (simplified ItemBase)
export interface ItemMesaPrint {
  nome: string;
  quantidade: number;
  venda: number;
  total: number;
}

