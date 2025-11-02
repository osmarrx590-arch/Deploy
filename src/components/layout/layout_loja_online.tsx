
import React, { ReactNode } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { ShoppingBag, Clock, Heart, Star, Store, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useFavoritos } from '@/hooks/useFavoritos';
import { useAvaliacoes } from '@/hooks/useAvaliacoes';
import CarrinhoDrawer from '../loja-online/CarrinhoDrawer';

type LayoutLojaOnlineProps = {
  children?: ReactNode;
};

const LayoutLojaOnline: React.FC<LayoutLojaOnlineProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { favoritos } = useFavoritos();
  const { avaliacoes } = useAvaliacoes();

  const menuItems = [
    { label: 'Produtos', path: '/loja-online/produtos', icon: <ShoppingBag size={20} /> },
    { label: 'Histórico', path: '/loja-online/historico', icon: <Clock size={20} /> },
    { label: 'Favoritos', path: '/loja-online/favoritos', icon: <Heart size={20} />, count: favoritos.length },
    { label: 'Avaliações', path: '/loja-online/avaliacoes', icon: <Star size={20} />, count: avaliacoes.length },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path);

  const handleFinalizarCompra = () => {
    navigate('/loja-online/checkout');
  };

  return (
    <div className="h-screen bg-gradient-to-b from-amber-50 to-orange-100 overflow-hidden">
      <div className="flex h-full">
        {/* Sidebar fixa */}
        <aside className="flex flex-col w-64 bg-white border-r border-gray-200 h-full">
          <div className="flex items-center p-4 border-b border-gray-200">
            <Store className="h-8 w-8 text-amber-600 mr-2" />
            <h2 className="text-xl font-bold text-amber-900">Loja Online</h2>
          </div>
          {/* Link principal */}
          <div className="pb-2 mb-2 border-b border-gray-100">
            <Link 
              to="/loja-online" 
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === '/loja-online' ? 'bg-amber-600/10 text-amber-600' : 'text-gray-600 hover:bg-amber-600/5 hover:text-amber-600'
              }`}
            >
              <ShoppingBag className="mr-3" size={20} />
              Minha Loja
            </Link>
          </div>
          <nav className="flex-1 px-4 pt-2 overflow-y-auto">
            <div className="space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-amber-600/10 text-amber-600'
                      : 'text-gray-600 hover:bg-amber-600/5 hover:text-amber-600'
                  }`}
                >
                  <span className="flex items-center">
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </span>
                  {item.count !== undefined && item.count > 0 && (
                    <Badge variant="outline" className="h-5 min-w-5 px-1.5 flex items-center justify-center">
                      {item.count}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
              <CarrinhoDrawer />
              <button
                type="button"
                onClick={handleFinalizarCompra}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors w-full ${
                  location.pathname === '/loja-online/checkout'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-600/80 text-white hover:bg-amber-600'
                }`}
              >
                <ShoppingCart className="mr-3" size={20} />
                Finalizar Compra
              </button>
            </div>
          </nav>
        </aside>

        {/* Conteúdo principal */}
        <main className="flex-1 h-full overflow-y-auto">
          <div className="h-full p-4">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LayoutLojaOnline;
