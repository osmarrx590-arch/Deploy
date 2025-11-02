
import { useAuth } from '@/contexts/AuthContext';
import { Mesa } from '@/types/mesa';

export const useMesaPermissions = (mesa?: Mesa) => {
  const { user, profile } = useAuth();

  const canEdit = () => {
    if (!user || !profile) return false;
    
    // Admins podem editar qualquer mesa
    if (profile.tipo === 'admin') return true;
    
    // Garçons só podem editar mesas que estão atendendo
    if (profile.tipo === 'fisica' && mesa?.usuarioId === parseInt(profile.user_id)) return true;
    
    // Mesas sem responsável podem ser editadas por qualquer usuário físico
    if (profile.tipo === 'fisica' && !mesa?.usuarioId) return true;
    
    return false;
  };

  const canAssignUser = () => {
    if (!user || !profile) return false;
    return profile.tipo === 'admin' || profile.tipo === 'fisica';
  };

  const canViewDetails = () => {
    return !!user; // Qualquer usuário logado pode ver detalhes
  };

  return {
    canEdit: canEdit(),
    canAssignUser: canAssignUser(),
    canViewDetails: canViewDetails(),
    isOwner: mesa?.usuarioId === parseInt(profile?.user_id || '0'),
    isAdmin: profile?.tipo === 'admin'
  };
};
