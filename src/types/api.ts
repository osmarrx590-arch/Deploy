
export interface NotaFiscal {
  id: number;
  serie: string;
  numero: string;
  descricao: string;
  data: string;
  empresaId: number;
}

export interface Empresa {
  id: number;
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
  cnpj: string;
  notasFiscais: NotaFiscal[];
}

export interface ApiContextType {
  getEmpresas: () => Promise<Empresa[]>;
  getEmpresaById: (id: number) => Promise<Empresa | null>;
  cadastrarEmpresa: (data: Omit<Empresa, 'id' | 'notasFiscais'> & { notaFiscal: Omit<NotaFiscal, 'id' | 'empresaId'> }) => Promise<Empresa>;
  deleteEmpresa: (id: number) => Promise<void>;
  getNotasFiscaisByEmpresa: (empresaId: number) => Promise<NotaFiscal[]>;
  createNotaFiscal: (data: Omit<NotaFiscal, 'id'>) => Promise<NotaFiscal>;
}
