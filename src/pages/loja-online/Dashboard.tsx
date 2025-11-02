import { useAuth } from '@/contexts/AuthContext';
import { useCarrinho } from '@/hooks/useCarrinho';
import { useFavoritos } from '@/hooks/useFavoritos';
import { useAvaliacoes } from '@/hooks/useAvaliacoes';
import { usePedidos } from '@/hooks/useApiData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Star, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { carrinho, totalCarrinho, subtotalCarrinho } = useCarrinho();
  const { favoritos } = useFavoritos();
  const { avaliacoes } = useAvaliacoes();
  const { data: pedidos } = usePedidos();

  const carrinhoCount = Array.isArray(carrinho) ? carrinho.length : 0;
  const carrinhoTotalValue = typeof totalCarrinho === 'number' ? totalCarrinho : (typeof subtotalCarrinho === 'number' ? subtotalCarrinho : 0);
  const favoritosCount = Array.isArray(favoritos) ? favoritos.length : 0;
  const avaliacoesCount = Array.isArray(avaliacoes) ? avaliacoes.length : 0;
  const pedidosCount = Array.isArray(pedidos) ? pedidos.length : 0;

  const formatCurrency = (value: number) => {
    try {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    } catch (e) {
      return `R$ ${value.toFixed(2)}`;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard - Loja Online</h1>
        <p className="text-gray-600 mt-2">Bem-vindo, {profile?.nome}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos no Carrinho</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{carrinhoCount}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(carrinhoTotalValue)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favoritos</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{favoritosCount}</div>
            <p className="text-xs text-muted-foreground">
              Produtos salvos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliações</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avaliacoesCount}</div>
            <p className="text-xs text-muted-foreground">
              Produtos avaliados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pedidosCount}</div>
            <p className="text-xs text-muted-foreground">
              Total de pedidos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/loja-online/produtos')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Catálogo
            </CardTitle>
            <CardDescription>
              Explore nosso catálogo completo de cervejas e produtos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Ver Produtos
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/loja-online/favoritos')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Favoritos
            </CardTitle>
            <CardDescription>
              Seus produtos favoritos salvos para compras futuras
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Ver Favoritos
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/loja-online/historico')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Histórico
            </CardTitle>
            <CardDescription>
              Acompanhe seus pedidos e histórico de compras
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Ver Histórico
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/loja-online/avaliacoes')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Avaliações
            </CardTitle>
            <CardDescription>
              Suas avaliações e comentários sobre os produtos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Minhas Avaliações
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;