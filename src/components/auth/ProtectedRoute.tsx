import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredType?: 'fisica' | 'online' | 'admin';
}

const ProtectedRoute = ({ children, requiredType }: ProtectedRouteProps) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requiredType) {
    const userType = profile?.tipo?.toLowerCase();

    // Se a rota exige 'admin', somente 'admin' tem acesso
    if (requiredType.toLowerCase() === 'admin') {
      if (userType !== 'admin') {
        const redirectPath = userType === 'fisica' ? '/loja-fisica' : userType === 'online' ? '/loja-online' : '/auth';
        return <Navigate to={redirectPath} replace />;
      }
    } else {
      // Se a rota exige 'fisica' ou 'online', permitir também 'admin'
      if (userType !== requiredType.toLowerCase() && userType !== 'admin') {
        const redirectPath = userType === 'fisica' ? '/loja-fisica' : userType === 'online' ? '/loja-online' : '/auth';
        return <Navigate to={redirectPath} replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;