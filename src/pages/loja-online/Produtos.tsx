import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { produtosLocais } from '@/data/produtos_locais';
import { useCarrinho } from '@/hooks/useCarrinho';
import { useFavoritos } from '@/hooks/useFavoritos';
import { useAvaliacoes } from '@/hooks/useAvaliacoes';
import { Heart, Package } from 'lucide-react';
import ClassificacaoPorEstrelas from '@/components/loja-online/ClassificacaoPorEstrelas';
import { formataPreco } from '@/contexts/moeda';
import { Produto } from '@/types/produto';

const Produtos = () => {
  const [viewMode, setViewMode] = useState('grid'); // Estado para o modo de exibição
  const navigate = useNavigate();
  const { toast } = useToast();
  const { adicionarAoCarrinho, getEstoqueDisponivel } = useCarrinho();
  const { toggleFavorito, isFavorito } = useFavoritos();
  const { avaliarProduto, getAvaliacao } = useAvaliacoes();

  const handleAdicionarAoCarrinho = (produto: Produto) => {
    const sucesso = adicionarAoCarrinho(produto);
    if (sucesso) {
      toast({
        title: "Produto adicionado!",
        description: `${produto.nome} foi adicionado ao seu carrinho.`,
      });
    } else {
      toast({
        title: "Estoque insuficiente",
        description: `Não há estoque suficiente de ${produto.nome}.`,
        variant: "destructive",
      });
    }
  };

  const handleProdutoClick = (produtoId: number) => {
    navigate(`/loja-online/produto/${produtoId}`);
  };

  // Configurações do carrossel
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Produtos Disponíveis</h1>
      
      {/* Botões de Alternância */}
      <div className="mb-4">
        <Button 
          onClick={() => setViewMode('grid')} 
          className={`mr-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : ''}`}
        >
          Grid
        </Button>
        <Button 
          onClick={() => setViewMode('carousel')} 
          className={`${viewMode === 'carousel' ? 'bg-blue-500 text-white' : ''}`}
        >
          Carrossel
        </Button>
      </div>

      {/* Renderização Condicional */}
      {viewMode === 'carousel' ? (
        <Slider {...settings}>
          {produtosLocais.map((produto) => {
            const estoqueDisponivel = getEstoqueDisponivel(produto.id);
            const estoqueZerado = estoqueDisponivel === 0;
            const estoqueBaixo = estoqueDisponivel > 0 && estoqueDisponivel <= 5;

            return (
              <div key={produto.id}>
                <Card className={estoqueZerado ? 'opacity-50' : ''}>
                  <CardHeader>
                    <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                      <img
                        src={produto.imagem}
                        alt={produto.nome}
                        className="h-full w-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => handleProdutoClick(produto.id)}
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-background/50 backdrop-blur-sm hover:bg-background/80"
                        onClick={() => toggleFavorito(produto)}
                      >
                        <Heart className={isFavorito(produto.id) ? "fill-red-500 text-red-500" : ""} />
                      </Button>
                      
                      {/* Badge de estoque */}
                      <div className="absolute bottom-2 left-2">
                        {estoqueZerado ? (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            Esgotado
                          </Badge>
                        ) : estoqueBaixo ? (
                          <Badge variant="secondary" className="bg-yellow-500 text-white flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            Últimas {estoqueDisponivel} unidades
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-green-500 text-white flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {estoqueDisponivel} disponíveis
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle 
                      className="cursor-pointer hover:text-primary transition-colors truncate w-full"
                      onClick={() => handleProdutoClick(produto.id)}
                      title={produto.nome} // opcional: mostra o nome completo ao passar o mouse
                    >
                      {produto.nome}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-2xl font-bold">{formataPreco(produto.venda)}</p>
                    <div className="flex items-center justify-between">
                      <ClassificacaoPorEstrelas
                        rating={getAvaliacao(produto.id)}
                        onRate={(rating) => avaliarProduto(produto.id, rating)}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => handleAdicionarAoCarrinho(produto)}
                      disabled={estoqueZerado}
                    >
                      {estoqueZerado ? 'Produto Esgotado' : 'Adicionar ao Pedido'}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            );
          })}
        </Slider>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {produtosLocais.map((produto) => {
            const estoqueDisponivel = getEstoqueDisponivel(produto.id);
            const estoqueZerado = estoqueDisponivel === 0;
            const estoqueBaixo = estoqueDisponivel > 0 && estoqueDisponivel <= 5;

            return (
              <Card key={produto.id} className={estoqueZerado ? 'opacity-50' : ''}>
                <CardHeader>
                  <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                    <img
                      src={produto.imagem}
                      alt={produto.nome}
                      className="h-full w-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => handleProdutoClick(produto.id)}
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-background/50 backdrop-blur-sm hover:bg-background/80"
                      onClick={() => toggleFavorito(produto)}
                    >
                      <Heart className={isFavorito(produto.id) ? "fill-red-500 text-red-500" : ""} />
                    </Button>
                    
                    {/* Badge de estoque */}
                    <div className="absolute bottom-2 left-2">
                      {estoqueZerado ? (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          Esgotado
                        </Badge>
                      ) : estoqueBaixo ? (
                        <Badge variant="secondary" className="bg-yellow-500 text-white flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          Últimas {estoqueDisponivel} unidades
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-500 text-white flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {estoqueDisponivel} disponíveis
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle 
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleProdutoClick(produto.id)}
                  >
                    {produto.nome}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-2xl font-bold">{formataPreco(produto.venda)}</p>
                  <div className="flex items-center justify-between">
                    <ClassificacaoPorEstrelas
                      rating={getAvaliacao(produto.id)}
                      onRate={(rating) => avaliarProduto(produto.id, rating)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => handleAdicionarAoCarrinho(produto)}
                    disabled={estoqueZerado}
                  >
                    {estoqueZerado ? 'Produto Esgotado' : 'Adicionar ao Pedido'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Produtos;
