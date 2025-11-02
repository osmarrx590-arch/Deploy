/**
 * Header.tsx
 * 
 * ✅ Funcionalidades Implementadas:
 * - Exibe o cabeçalho fixo da aplicação com navegação responsiva (desktop/mobile)
 * - Mostra links de navegação principais
 * - Exibe avatar e menu de usuário autenticado, com opções baseadas no tipo de usuário (online/fisica)
 * - Permite login, cadastro e logout
 * - Mostra diferentes áreas da loja conforme o tipo de usuário
 * 
 * 🔄 Como Funciona:
 * - Usa React hooks para controlar estado do menu e rolagem
 * - Usa contexto de autenticação para saber se o usuário está logado e qual seu tipo
 * - Usa React Router para navegação e detecção de rota ativa
 * - Usa Framer Motion para animação do menu mobile
 * 
 * 📊 Interface da Página:
 * - Layout responsivo, com menu horizontal em desktop e menu lateral em mobile
 * - Avatar com menu suspenso para ações do usuário
 * - Links e botões estilizados com Tailwind CSS
 */

import { useState, useEffect } from 'react'; // Hooks para estado e efeitos colaterais
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Navegação e localização de rotas
import { motion, AnimatePresence } from 'framer-motion'; // Animações para o menu mobile
import { Menu, X, Beer, UserCircle, ShoppingBag, Home, LogOut, Store, User, MapPin, Settings } from 'lucide-react'; // Ícones
import { Button } from './ui/button'; // Botão customizado
import { Avatar, AvatarFallback } from './ui/avatar'; // Avatar do usuário
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuItem 
} from './ui/dropdown-menu'; // Componentes do menu suspenso do usuário
import { useAuth } from '@/contexts/AuthContext'; // Contexto de autenticação

const Header = () => {
  const [isOpen, setIsOpen] = useState(false); // Estado do menu mobile aberto/fechado
  const [isScrolled, setIsScrolled] = useState(false); // Estado para saber se a página foi rolada
  const location = useLocation(); // Hook para saber a rota atual
  const navigate = useNavigate(); // Hook para navegação programática
  const { user, profile, signOut } = useAuth(); // Dados do usuário autenticado e função de logout

  useEffect(() => {
    // Adiciona/remover listener para mudar o estilo do header ao rolar a página
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true); // Header com sombra e padding menor
      } else {
        setIsScrolled(false); // Header padrão
      }
    };

    window.addEventListener('scroll', handleScroll); // Adiciona evento de scroll
    return () => window.removeEventListener('scroll', handleScroll); // Limpa evento ao desmontar
  }, []);

  useEffect(() => {
    // Fecha o menu mobile ao trocar de rota
    setIsOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await signOut(); // Executa logout
    navigate('/'); // Redireciona para home
  };

  // Links principais do menu
  const navLinks = [
    { nome: 'Início', path: '/', icon: <Home size={18} className="mr-2" /> },
    { nome: 'Menu', path: '/menu', icon: <ShoppingBag size={18} className="mr-2" /> },
    { nome: 'Sobre', path: '/sobre', icon: <Beer size={18} className="mr-2" /> },
    { nome: 'Contato', path: '/contato', icon: <UserCircle size={18} className="mr-2" /> },
  ];

  // Função para saber se o link está ativo
  const isActive = (path: string) => location.pathname === path;

  // Gera as iniciais do nome do usuário para o avatar
  const getUserInitials = () => {
    if (!profile?.nome) return '??'; // Se não houver nome, mostra ??
    return profile.nome
      .split(' ')
      .slice(0, 2)
      .map(nome => nome.charAt(0))
      .join('')
      .toUpperCase();
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-amber-800 shadow-md py-2' // Header menor e com sombra ao rolar
          : 'bg-amber-800 py-3 md:py-4' // Header padrão
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Beer className="h-7 w-7 md:h-8 md:w-8 text-amber-100 mr-2" /> {/* Ícone da logo */}
            <span className="text-lg md:text-xl font-brewery font-bold text-amber-100">
              Choperia
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-amber-100 hover:text-amber-200 transition-colors ${
                  isActive(link.path) ? 'text-amber-200 font-semibold' : ''
                }`}
              >
                {link.nome}
              </Link>
            ))}

            {user && profile ? (
              // Se usuário está logado, mostra avatar e menu suspenso
              <div className="flex items-center gap-3 md:gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative rounded-full h-10 w-10 p-0" aria-label="Perfil">
                      <Avatar>
                        <AvatarFallback className="bg-amber-600 text-white">
                          {getUserInitials()} {/* Iniciais do usuário */}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="font-medium text-amber-800">{profile.nome}</div>
                      <div className="text-xs text-muted-foreground overflow-hidden text-ellipsis">{profile.email}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4 text-amber-800" />
                      Meu Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/change-password')}>
                      <Settings className="mr-2 h-4 w-4 text-amber-800" />
                      Alterar Senha
                    </DropdownMenuItem>
                    {profile.tipo === 'online' && (
                      <DropdownMenuItem onClick={() => navigate('/enderecos')}>
                        <MapPin className="mr-2 h-4 w-4 text-amber-800" />
                        Meus Endereços
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4 text-amber-800" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* Área da Loja para cada type de usuário */}
                {profile.tipo === 'fisica' && (
                  <Link to="/loja-fisica" className="bg-amber-600 hover:bg-amber-700 text-white rounded-md px-4 py-2 text-sm md:text-base whitespace-nowrap transition-colors">
                    Área da Loja Local
                  </Link>
                )}
                {profile.tipo === 'online' && (
                  <Link to="/loja-online" className="bg-amber-600 hover:bg-amber-700 text-white rounded-md px-4 py-2 text-sm md:text-base whitespace-nowrap transition-colors">
                    Área da Loja
                  </Link>
                )}
              </div>
            ) : (
              // Se não está logado, mostra botões de login/cadastro
              <div className="flex items-center gap-2">
                <button
                  className="text-amber-100 hover:text-amber-200 transition-colors text-sm md:text-base"
                  onClick={() => navigate('/auth')}
                >
                  Entrar
                </button>
                <button
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-md px-4 py-2 text-sm md:text-base transition-colors"
                  onClick={() => navigate('/auth')}
                >
                  Cadastrar
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-amber-100 p-2"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="h-6 w-6" /> // Ícone de fechar
            ) : (
              <Menu className="h-6 w-6" /> // Ícone de abrir
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-amber-700 shadow-md overflow-hidden"
          >
            <div className="container mx-auto px-4 py-3 flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`py-2 px-3 rounded-md flex items-center text-amber-100 hover:text-amber-200 transition-colors ${
                    isActive(link.path) ? 'bg-amber-600/20 text-amber-200' : ''
                  }`}
                >
                  {link.icon}
                  {link.nome}
                </Link>
              ))}
              {user && profile ? (
                <>
                  <div className="pt-2 border-t border-amber-600/30">
                    <div className="flex items-center gap-2 mb-3 px-3 py-2">
                      <UserCircle className="h-5 w-5 text-amber-200" />
                      <span className="text-sm font-medium text-amber-100">{profile.nome}</span>
                    </div>
                    <Link 
                      to="/profile" 
                      className="w-full mb-2 py-2 px-3 flex items-center rounded-md text-amber-100 hover:text-amber-200 transition-colors"
                    >
                      <User size={18} className="mr-2 text-amber-200" />
                      Meu Perfil
                    </Link>
                    <Link 
                      to="/change-password" 
                      className="w-full mb-2 py-2 px-3 flex items-center rounded-md text-amber-100 hover:text-amber-200 transition-colors"
                    >
                      <Settings size={18} className="mr-2 text-amber-200" />
                      Alterar Senha
                    </Link>
                    {profile.tipo === 'online' && (
                      <Link 
                        to="/enderecos" 
                        className="w-full mb-2 py-2 px-3 flex items-center rounded-md text-amber-100 hover:text-amber-200 transition-colors"
                      >
                        <MapPin size={18} className="mr-2 text-amber-200" />
                        Meus Endereços
                      </Link>
                    )}
                    {profile.tipo === 'fisica' && (
                      <Link
                        to="/loja-fisica"
                        className="bg-amber-600 hover:bg-amber-700 text-white w-full mb-2 text-center flex items-center justify-center py-2 px-3 rounded-md transition-colors"
                      >
                        <Store size={18} className="mr-2" />
                        Área da Loja
                      </Link>
                    )}
                    {profile.tipo === 'online' && (
                      <Link
                        to="/loja-online"
                        className="bg-amber-600 hover:bg-amber-700 text-white w-full mb-2 text-center flex items-center justify-center py-2 px-3 rounded-md transition-colors"
                      >
                        <Store size={18} className="mr-2" />
                        Área da Loja
                      </Link>
                    )}
                    <Button
                      variant="outline"
                      className="w-full border-amber-200 text-amber-100 hover:bg-red-600 hover:text-white flex items-center justify-center mt-2"
                      onClick={handleLogout}
                    >
                      <LogOut size={18} className="mr-2" />
                      Sair
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-2 border-t border-amber-600/30">
                  <button
                    className="text-amber-100 hover:text-amber-200 text-center py-2 transition-colors"
                    onClick={() => navigate('/auth')}
                  >
                    Entrar
                  </button>
                  <button
                    className="bg-amber-600 hover:bg-amber-700 text-white text-center py-2 px-3 rounded-md transition-colors"
                    onClick={() => navigate('/auth')}
                  >
                    Cadastrar
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Header;
