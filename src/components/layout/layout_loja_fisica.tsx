// src\components\layout\layout_loja_fisica.tsx
import { useState, useEffect, ReactNode } from 'react';
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Layers, ShoppingBag, Users, Package, ClipboardList, LayoutList, Store, LogOut, Menu, X, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type LayoutLojaFisicaProps = {
  children?: ReactNode;
};

const LayoutLojaFisica = ({ children }: LayoutLojaFisicaProps) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);


  // Close mobile menu when route changes
  useEffect(() => {
    setSheetOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    signOut();
    toast({
      title: "Logout realizado",
      description: "Você saiu da sua conta com sucesso",
    });
    navigate('/');
  };

  const navItems = [
    { label: 'Dashboard', icon: <Layers className="w-5 h-5 mr-2" />, path: '/loja-fisica' },
    { label: 'Produtos', icon: <ShoppingBag className="w-5 h-5 mr-2" />, path: '/loja-fisica/produtos' },
    { label: 'Fornecedores', icon: <Users className="w-5 h-5 mr-2" />, path: '/loja-fisica/empresas' },
    { label: 'Estoque', icon: <Package className="w-5 h-5 mr-2" />, path: '/loja-fisica/estoque' },
    { label: 'Mesas', icon: <ClipboardList className="w-5 h-5 mr-2" />, path: '/loja-fisica/mesas' },
    { label: 'Categorias', icon: <LayoutList className="w-5 h-5 mr-2" />, path: '/loja-fisica/categorias' },
    { label: 'Pedidos Online', icon: <ShoppingCart className="w-5 h-5 mr-2" />, path: '/loja-fisica/pedidos-online' },
    { label: 'Pedidos Locais', icon: <ClipboardList className="w-5 h-5 mr-2" />, path: '/loja-fisica/pedidos-recebidos' },
  ];

  const NavItem = ({ item }: { item: typeof navItems[0] }) => (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center py-2 px-3 rounded-md transition-colors ${
          isActive
            ? 'bg-amber-600 text-white font-medium'
            : 'text-amber-800 hover:bg-amber-600/10'
        }`
      }
      onClick={() => setSheetOpen(false)}
      end={item.path === '/loja-fisica'}
    >
      {item.icon}
      {item.label}
    </NavLink>
  );

  return (
    <div className="h-screen bg-gradient-to-b from-amber-50 to-orange-100 overflow-hidden">
      <div className="flex h-full">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-full">
          <div className="flex items-center p-4 border-b border-gray-200">
            <Store className="h-8 w-8 text-amber-600 mr-2" />
            <h2 className="text-xl font-bold text-amber-900">Loja Física</h2>
          </div>
          
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2">
              {navItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>
          </nav>
          
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center mb-4 p-2 rounded-md">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarFallback className="bg-amber-600 text-white">
                  {profile?.nome?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-amber-900 truncate">
                  {profile?.nome || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500 truncate">{profile?.email || 'usuario@email.com'}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center" 
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </aside>
        
        {/* Mobile Sidebar */}
        {sheetOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setSheetOpen(false)} />
            <div className="fixed left-0 top-0 h-full w-[85vw] max-w-xs bg-white flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center">
                  <Store className="h-6 w-6 text-amber-600 mr-2" />
                  <h2 className="text-lg font-bold text-amber-900">Loja Física</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSheetOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <nav className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-2">
                  {navItems.map((item) => (
                    <NavItem key={item.path} item={item} />
                  ))}
                </div>
              </nav>
              
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center mb-4 p-2 rounded-md">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback className="bg-amber-600 text-white">
                      {profile?.nome?.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium text-amber-900 truncate">
                      {profile?.nome || 'Usuário'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{profile?.email || 'usuario@email.com'}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center" 
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Mobile menu button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden fixed top-4 left-4 z-40 bg-white/90 shadow-md hover:bg-white"
          onClick={() => setSheetOpen(!sheetOpen)}
        >
          <Menu className="h-5 w-5 text-amber-900" />
        </Button>
        
        {/* Main Content */}
        <main className="flex-1 h-full overflow-y-auto">
          <div className="h-full p-4">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LayoutLojaFisica;
