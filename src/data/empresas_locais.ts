import { Empresa } from "../types/empresa";

// Initial companies data
export const empresasLocais: Empresa[] = [
  {
    id: 1,
    nome: "Restaurante Sabor Brasileiro",
    endereco: "Av. Paulista, 1000, São Paulo - SP",
    telefone: "(11) 3456-7890",
    cnpj: "12.345.678/0001-90",
    email: "contato@saborbrasileiro.com",
    slug: "restaurante-sabor-brasileiro",
    status: "ativo",
    notasFiscais: [
      {
        id: 101,
        serie: "A1",
        numero: "000123",
        descricao: "Venda de almoço executivo",
        data: "2024-06-01",
        empresaId: 1
      }
    ]
  },
  {
    id: 2,
    nome: "Cantina Bella Italia",
    endereco: "Rua Augusta, 500, São Paulo - SP",
    telefone: "(11) 2345-6789",
    cnpj: "23.456.789/0001-01",
    email: "contato@bellaitalia.com",
    slug: "cantina-bella-italia",
    status: "ativo",
    notasFiscais: [
      {
        id: 201,
        serie: "B2",
        numero: "000456",
        descricao: "Venda de jantar italiano",
        data: "2024-06-02",
        empresaId: 2
      }
    ]
  }
];
