import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Package, ShoppingCart, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useDashboardMetrics from '@/hooks/useDashboardMetrics';

const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { isLoading, error, mesasAtivas, produtosCount, pedidosHoje, faturamentoHoje, pedidosOntem, faturamentoOntem } = useDashboardMetrics();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard - Loja Física</h1>
        <p className="text-gray-600 mt-2">Bem-vindo, {profile?.nome}!</p>
        {isLoading && <p className="text-sm text-muted-foreground mt-1">Carregando métricas...</p>}
        {error && <p className="text-sm text-red-600 mt-1">Erro ao carregar métricas: {error}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mesas Ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mesasAtivas}</div>
            <p className="text-xs text-muted-foreground">
              {typeof pedidosOntem === 'number' ? `${mesasAtivas - (mesasAtivas - 0)} desde ontem` : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{produtosCount}</div>
            <p className="text-xs text-muted-foreground">
              {/* Sem histórico de produtos por dia disponível; mostrar total */}
              {`Total de produtos`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Hoje</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pedidosHoje}</div>
            <p className="text-xs text-muted-foreground">
              {typeof pedidosOntem === 'number' && pedidosOntem > 0 ? `${Math.round(((pedidosHoje - pedidosOntem) / pedidosOntem) * 100)}% desde ontem` : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faturamentoHoje || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {typeof faturamentoOntem === 'number' && faturamentoOntem > 0 ? `${Math.round(((faturamentoHoje - faturamentoOntem) / faturamentoOntem) * 100)}% desde ontem` : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/loja-fisica/mesas')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciar Mesas
            </CardTitle>
            <CardDescription>
              Visualize e gerencie o status das mesas do restaurante
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Acessar Mesas
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/loja-fisica/produtos')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produtos
            </CardTitle>
            <CardDescription>
              Cadastre e gerencie os produtos do cardápio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Gerenciar Produtos
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/loja-fisica/pedidos')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Pedidos
            </CardTitle>
            <CardDescription>
              Acompanhe os pedidos em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Ver Pedidos
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/loja-fisica/estoque')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Estoque
            </CardTitle>
            <CardDescription>
              Controle o estoque dos produtos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Controlar Estoque
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/loja-fisica/empresas')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Empresas
            </CardTitle>
            <CardDescription>
              Gerencie as informações da empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Gerenciar Empresa
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;