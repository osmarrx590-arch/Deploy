import React from 'react';
import { useAvaliacoes } from '@/hooks/useAvaliacoes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ClassificacaoPorEstrelas from '@/components/loja-online/ClassificacaoPorEstrelas';
import { produtosLocais } from '@/data/produtos_locais';
import { formataPreco } from '@/contexts/moeda';

const Avaliacoes = () => {
  const { avaliacoes } = useAvaliacoes();

  // Corrigindo a comparação: convertendo produtoId para string para comparar com produto.id
  const produtosAvaliados = produtosLocais.filter(produto => 
    avaliacoes.some(avaliacao => avaliacao.produtoId === produto.id)
  );

  if (produtosAvaliados.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Minhas Avaliações</h1>
        <p className="text-muted-foreground">Você ainda não avaliou nenhum produto.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Minhas Avaliações</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {produtosAvaliados.map((produto) => (
          <Card key={produto.id}>
            <CardHeader>
              <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                <img
                  src={produto.imagem}
                  alt={produto.nome}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
              <CardTitle>{produto.nome}</CardTitle>
              <CardDescription>{produto.descricao}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-2xl font-bold">
                {formataPreco(produto.venda) || 'R$ 0,00'}
              </p>
              <ClassificacaoPorEstrelas
                rating={avaliacoes.find(a => a.produtoId === produto.id)?.rating || 0}
                readonly
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Avaliacoes;