import { produtoService, estoqueService } from '@/services/apiServices';
import { Produto } from '@/types/produto';
  
export const getProdutos = async (): Promise<Produto[]> => {
    try {
      return await produtoService.getAll();
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }
};
  
export const decrementarEstoque = async (id: number, quantidade: number): Promise<void> => {
    try {
      await estoqueService.addMovimentacao({
        produtoId: id,
        produtoNome: '',
        quantidade,
        tipo: 'saida',
        origem: 'venda_fisica',
        data: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Erro ao decrementar estoque:', error);
      throw error;
    }
};
  
export const incrementarEstoque = async (id: number, quantidade: number): Promise<void> => {
    try {
      await estoqueService.addMovimentacao({
        produtoId: id,
        produtoNome: '',
        quantidade,
        tipo: 'entrada',
        origem: 'produto_cadastro',
        data: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Erro ao incrementar estoque:', error);
      throw error;
    }
};
