
import { Produto, ItemCarrinho } from './produto';

export interface CarrinhoContextData {
  carrinho: ItemCarrinho[];
  adicionarAoCarrinho: (produto: Produto) => boolean;
  removerDoCarrinho: (produtoId: number) => void;
  atualizarQuantidade: (produtoId: number, quantidade: number) => boolean;
  limparCarrinho: () => void;
  totalCarrinho: number;
  subtotalCarrinho: number;
  quantidadeItens: number;
  descontoCupom: number;
  cupom: { nome: string; desconto: number } | null;
  aplicarCupom: (codigo: string) => void;
  removerCupom: () => void;
  getEstoqueDisponivel: (produtoId: number) => number;
}
