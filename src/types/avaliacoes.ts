
export interface Avaliacao {
  produtoId: number;
  rating: number;
  comentario?: string;
  dataAvaliacao?: string;
}

export interface AvaliacoesContextType {
  avaliacoes: Avaliacao[];
  avaliarProduto: (produtoId: number, rating: number, comentario?: string) => void;
  getAvaliacao: (produtoId: number) => number;
  getComentario: (produtoId: number) => string;
  getAvaliacaoCompleta: (produtoId: number) => Avaliacao | undefined;
}
