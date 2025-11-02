import { produtosLocais } from './produtos_locais';
import { MovimentacaoEstoque } from '@/types/estoque';

// Re-export types for backward compatibility
export type { MovimentacaoEstoque };

// Gera movimentações de estoque para os últimos 30 dias
const gerarMovimentacoesEstoque = () => {
  const movimentacoes: MovimentacaoEstoque[] = [];
  const hoje = new Date();
  
  produtosLocais.forEach(produto => {
    // Gera entre 1 e 3 movimentações para cada produto
    const numMovimentacoes = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numMovimentacoes; i++) {
      const diasAtras = Math.floor(Math.random() * 30);
      const data = new Date(hoje);
      data.setDate(data.getDate() - diasAtras);
      
      movimentacoes.push({
        id: movimentacoes.length + 1,
        produtoId: produto.id,
        produtoNome: produto.nome,
        quantidade: Math.floor(Math.random() * 50) + 1,
        tipo: Math.random() > 0.3 ? 'entrada' : 'saida',
        origem: 'produto_cadastro',
        data: data.toISOString().split('T')[0],
      });
    }
  });

  // Ordena por data, mais recente primeiro
  return movimentacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
};

export const estoqueLocal = gerarMovimentacoesEstoque();