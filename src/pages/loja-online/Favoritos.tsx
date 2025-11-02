import React from 'react';
import { useFavoritos } from '@/hooks/useFavoritos';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from 'lucide-react';
import ClassificacaoPorEstrelas from '@/components/loja-online/ClassificacaoPorEstrelas';
import { useAvaliacoes } from '@/hooks/useAvaliacoes';
import { formataPreco } from '@/contexts/moeda';

const Favoritos = () => {
  const { favoritos, removerFavorito } = useFavoritos();
  const { getAvaliacao } = useAvaliacoes();

  if (favoritos.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Favoritos</h1>
        <p className="text-muted-foreground">Você ainda não tem produtos favoritos.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Favoritos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {favoritos.map((produto) => (
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
                rating={getAvaliacao(produto.id)}
                readonly
              />
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => removerFavorito(produto.id)}
              >
                <Heart className="fill-red-500 text-red-500" />
                Remover dos Favoritos
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Favoritos;
