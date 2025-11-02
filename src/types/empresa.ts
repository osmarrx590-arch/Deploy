import { NotaFiscalData } from './common';

export interface NotaFiscal extends NotaFiscalData {
  id: number;
  empresaId: number;
  serie: string;
  numero: string;
  descricao: string;
  data: string;
}

export interface Empresa {
  id: number;
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
  cnpj: string;
  notasFiscais?: NotaFiscal[];
  slug: string;
  status: string;
}

// Empresa Data (for components)
export interface EmpresaData {
  id: number;
  nome: string;
}

// Form Data types for Empresa
export interface EmpresaFormData {
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
  cnpj: string;
  status?: string; // Optional status field
  notaFiscal?: {
    serie: string;
    numero: string;
    descricao: string;
    data: string;
  };
}

// Nota Fiscal Form Data
export interface NotaFiscalFormData {
  serie: string;
  numero: string;
  data: string;
  descricao: string;
}

// Criar Nota Fiscal Data interface
export interface CriarNotaFiscalData {
  empresaId: number;
  numero: string;
  serie?: string;
  data: string;
  descricao?: string;
}

// Context interface
export interface EmpresasContextType {
  empresas: Empresa[];
  getEmpresas: () => Promise<Empresa[]>;
  addEmpresa: (empresa: Omit<Empresa, 'id' | 'slug'>) => Promise<void>;
  updateEmpresa: (id: number, empresa: Omit<Empresa, 'id' | 'slug' | 'notasFiscais'>) => Promise<void>;
  removeEmpresa: (id: number) => Promise<void>;
  addNotaFiscal: (empresaId: number, notaFiscal: Omit<NotaFiscal, 'id' | 'empresaId'>) => Promise<void>;
  getNotasFiscais: (empresaId: number) => Promise<NotaFiscal[]>;
  removeNotaFiscal: (empresaId: number, notaFiscalId: number) => Promise<void>;
  cadastrarEmpresa: (data: EmpresaFormData) => Promise<void>;
  getEmpresaById: (id: number) => Promise<Empresa | null>;
  getNotasFiscaisByEmpresa: (empresaId: number) => Promise<NotaFiscal[]>;
  createNotaFiscal: (data: CriarNotaFiscalData) => Promise<void>;
  deleteEmpresa: (id: number) => Promise<void>;
}


