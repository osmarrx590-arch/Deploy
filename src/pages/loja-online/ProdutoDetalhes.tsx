
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { produtosLocais } from '@/data/produtos_locais';
import { useCarrinho } from '@/hooks/useCarrinho';
import { useFavoritos } from '@/hooks/useFavoritos';
import { useAvaliacoes } from '@/hooks/useAvaliacoes';
import { ArrowLeft, Heart, Package, MessageSquare } from 'lucide-react';
import ClassificacaoPorEstrelas from '@/components/loja-online/ClassificacaoPorEstrelas';
import { formataPreco } from '@/contexts/moeda';
import { Produto } from '@/types/produto';

const ProdutoDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { adicionarAoCarrinho, getEstoqueDisponivel } = useCarrinho();
  const { toggleFavorito, isFavorito } = useFavoritos();
  const { avaliarProduto, getAvaliacao, getComentario, getAvaliacaoCompleta } = useAvaliacoes();
  
  const [comentario, setComentario] = useState('');
  const [rating, setRating] = useState(0);

  // Buscar produto pelo ID
  const produto = produtosLocais.find(p => p.id === Number(id));
  const estoqueDisponivel = getEstoqueDisponivel(produto.id);
  const estoqueZerado = estoqueDisponivel === 0;
  const estoqueBaixo = estoqueDisponivel > 0 && estoqueDisponivel <= 5;
  const avaliacaoAtual = getAvaliacaoCompleta(produto.id);

  // Inicializar estados com avaliação existente com hooks React.useEffect 
  React.useEffect(() => { // Preencher rating e comentário se já houver avaliação
    if (avaliacaoAtual) {
      setRating(avaliacaoAtual.rating);
      setComentario(avaliacaoAtual.comentario || '');
    }
  }, [avaliacaoAtual]);

  // Se produto não encontrado, redirecionar
  if (!produto) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
        <Button onClick={() => navigate('/loja-online/produtos')}>
          Voltar para Produtos
        </Button>
      </div>
    );
  }

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

  const handleAvaliar = () => {
    if (rating > 0) {
      avaliarProduto(produto.id, rating, comentario.trim() || undefined);
      toast({
        title: "Avaliação salva!",
        description: "Sua avaliação foi registrada com sucesso.",
      });
    } else {
      toast({
        title: "Avaliação inválida",
        description: "Por favor, selecione uma classificação por estrelas.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      {/* Breadcrumb e botão voltar */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/loja-online/produtos')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Produtos
        </Button>
        <nav className="text-sm text-gray-600">
          <span>Produtos</span> / <span className="font-medium">{produto.nome}</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Imagem do produto */}
        <div className="relative">
          <img
            src={produto.imagem}
            alt={produto.nome}
            className="w-full h-96 object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-background/50 backdrop-blur-sm hover:bg-background/80"
            onClick={() => toggleFavorito(produto)}
          >
            <Heart className={isFavorito(produto.id) ? "fill-red-500 text-red-500" : ""} />
          </Button>
          
          {/* Badge de estoque */}
          <div className="absolute bottom-4 left-4">
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

        {/* Informações do produto */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{produto.nome}</h1>
            <p className="text-gray-600 mb-4">{produto.descricao}</p>
            <p className="text-3xl font-bold text-primary">{formataPreco(produto.venda)}</p>
          </div>

          {/* Classificação por estrelas */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Avalie este produto</h3>
            <ClassificacaoPorEstrelas
              rating={rating}
              onRate={setRating}
            />
          </div>

          {/* Campo de comentário */}
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Comentário (opcional)
            </h3>
            <Textarea
              placeholder="Compartilhe sua experiência com este produto..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="min-h-20"
              maxLength={500}
            />
            <p className="text-sm text-gray-500 mt-1">
              {comentario.length}/500 caracteres
            </p>
          </div>

          {/* Botões de ação */}
          <div className="space-y-3">
            <Button 
              onClick={handleAvaliar}
              variant="outline"
              className="w-full"
              disabled={rating === 0}
            >
              {avaliacaoAtual ? 'Atualizar Avaliação' : 'Salvar Avaliação'}
            </Button>
            
            <Button 
              className="w-full" 
              onClick={() => handleAdicionarAoCarrinho(produto)}
              disabled={estoqueZerado}
              size="lg"
            >
              {estoqueZerado ? 'Produto Esgotado' : 'Adicionar ao Pedido'}
            </Button>
          </div>

          {/* Informações adicionais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Categoria:</span>
                <span className="font-medium">{produto.categoria}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Código:</span>
                <span className="font-medium">{produto.codigo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estoque:</span>
                <span className="font-medium">{estoqueDisponivel} unidades</span>
              </div>
            </CardContent>
          </Card>

          {/* Mostrar avaliação atual se existir */}
          {avaliacaoAtual && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sua Avaliação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <ClassificacaoPorEstrelas
                    rating={avaliacaoAtual.rating}
                    readonly={true}
                  />
                </div>
                {avaliacaoAtual.comentario && (
                  <p className="text-gray-700">{avaliacaoAtual.comentario}</p>
                )}
                {avaliacaoAtual.dataAvaliacao && (
                  <p className="text-sm text-gray-500 mt-2">
                    Avaliado em {new Date(avaliacaoAtual.dataAvaliacao).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProdutoDetalhes;
