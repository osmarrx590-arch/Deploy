
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Componente responsável por redirecionar automaticamente o usuário para a rota certa após login
const AutoRedirect = () => {
  // Obtém os dados do usuário e status de autenticação do contexto
  const { user, profile, isAuthenticated, isLoading } = useAuth();
  // Hook do React Router para navegação programática
  const navigate = useNavigate();

  useEffect(() => {
    // Só realiza o redirecionamento se não está carregando e usuário está autenticado
    if (!isLoading && isAuthenticated && user && profile) {
      // Redireciona conforme o tipo do usuário (fisica ou online)
      if (profile.tipo === 'fisica') {
        navigate('/loja-fisica');
      } else if (profile.tipo === 'online') {
        navigate('/loja-online');
      }
    }
  }, [user, profile, isAuthenticated, isLoading, navigate]);

  // Este componente não renderiza nada visível
  return null;
};

export default AutoRedirect;
