/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { authStorage } from '@/services/storageService';
import { userService } from '@/services/api';

// NOTE: backend URL/config is provided via services (userService). Do not read .env/secrets directly here.

export interface BackendUser {
  id: number;
  username: string;
  email: string;
  nome: string;
  tipo: 'fisica' | 'online' | 'admin';
  created_at?: string;
  updated_at?: string;
}

export interface BackendSession {
  token: string;
  token_type?: string;
  expires_at?: string | number;
  [key: string]: unknown;
}

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  tipo: 'fisica' | 'online' | 'admin';
  created_at?: string;
  updated_at?: string;
}

type UserMinimal = BackendUser | null;

type AuthResult = {
  error: string | null;
  user?: BackendUser | null;
  session?: BackendSession | null;
};

interface AuthContextType {
  user: UserMinimal;
  profile: Profile | null;
  session: BackendSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, nome: string, tipo?: 'fisica' | 'online') => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<{ error?: string | null }>;
  // Legacy compatibility
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  register: (data: { nome: string; email: string; password: string; confirmPassword: string; type: 'fisica' | 'online' }) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProviderComponent = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserMinimal>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<BackendSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();


  // helper: fetch with timeout using AbortController
  const fetchWithTimeout = async (input: RequestInfo | URL, init?: RequestInit, timeout = 15000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(input, { ...init, signal: controller.signal });
      return res;
    } catch (err) {
      // normalize abort error
      const e = err as unknown;
      if (typeof (e as { name?: unknown }).name === 'string' && (e as { name?: string }).name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw e;
    } finally {
      clearTimeout(id);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const hasBackendUrl = !!import.meta.env.VITE_BACKEND_URL;
      
      try {
        // Se tem BACKEND_URL configurado, tentar usar backend FastAPI primeiro
        if (hasBackendUrl) {
          try {
            const me = await userService.me();
            const data = me as unknown as BackendUser & { session?: BackendSession };
            const backendUser: BackendUser = {
              id: Number((data as Partial<BackendUser>)?.id ?? 0),
              username: data.nome,
              email: data.email,
              nome: data.nome,
              tipo: data.tipo,
              created_at: data.created_at,
              updated_at: data.updated_at,
            };
            setUser(backendUser);
            setProfile({
              id: String(data.id),
              user_id: String(data.id),
              nome: data.nome,
              email: data.email,
              tipo: (data.tipo || 'online') as Profile['tipo'],
            });
            setSession((data.session ?? null) as BackendSession | null);
            // Sincronizar com localStorage
            try { 
              authStorage.setUser({ 
                id: backendUser.id, 
                nome: backendUser.nome, 
                email: backendUser.email, 
                type: backendUser.tipo === 'fisica' || backendUser.tipo === 'online' ? backendUser.tipo : 'online', 
                tipo: backendUser.tipo, 
                createdAt: data.created_at ? new Date(data.created_at) : new Date() 
              }); 
            } catch (e) { console.debug(e); }
            console.log('✅ Autenticação via Backend FastAPI');
            setIsLoading(false);
            return;
          } catch (backendErr) {
            console.log('Backend não respondeu, usando localStorage como fallback');
          }
        }

        // FALLBACK: Usar localStorage (Lovable ou quando backend não disponível)
        const localUser = authStorage.getUser();
        if (localUser) {
          const backendUser: BackendUser = {
            id: localUser.id,
            username: localUser.nome,
            email: localUser.email,
            nome: localUser.nome,
            tipo: localUser.tipo || (localUser.type === 'fisica' ? 'fisica' : 'online'),
            created_at: localUser.createdAt?.toISOString(),
          };
          setUser(backendUser);
          setProfile({
            id: String(localUser.id),
            user_id: String(localUser.id),
            nome: localUser.nome,
            email: localUser.email,
            tipo: backendUser.tipo,
          });
          console.log('✅ Autenticação via localStorage');
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        const e = err as unknown;
        console.error('Error initializing auth:', e);
        setUser(null);
        setProfile(null);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const fetchProfile = async (): Promise<Profile | null> => {
    try {
      const data = await userService.me();
      const d = data as unknown as BackendUser & { session?: BackendSession };
      const backendUser: BackendUser = {
        id: Number((d as Partial<BackendUser>)?.id ?? 0),
        email: d.email,
        nome: d.nome,
        tipo: d.tipo,
        created_at: d.created_at,
        updated_at: d.updated_at,
        ...d,
      };
      const p: Profile = {
        id: String(d.id),
        user_id: String(d.id),
        nome: d.nome,
        email: d.email,
        tipo: (d.tipo || 'online') as Profile['tipo'],
        created_at: d.created_at,
        updated_at: d.updated_at,
      };
      setProfile(p);
      setUser(backendUser);
  setSession((d.session ?? null) as BackendSession | null);
  try { authStorage.setUser({ id: Number((d as Partial<BackendUser>)?.id ?? 0), nome: d.nome, email: d.email, type: (d.tipo === 'fisica' || d.tipo === 'online') ? d.tipo : 'online', tipo: d.tipo, createdAt: d.created_at ? new Date(d.created_at) : new Date() }); } catch (e) { console.debug(e); }
      return p;
    } catch (error) {
      const e = error as unknown;
      console.error('Error fetching profile:', e);
      try { authStorage.removeUser(); } catch (e) { console.debug(e); }
      setProfile(null);
      setUser(null);
      setSession(null);
      return null;
    }
  };

  async function signIn(email: string, password: string): Promise<AuthResult> {
    const hasBackendUrl = !!import.meta.env.VITE_BACKEND_URL;
    
    try {
      // Se tem BACKEND_URL, tentar login via FastAPI primeiro
      if (hasBackendUrl) {
        try {
          await userService.login(email, password);
          // backend usa cookie httpOnly; buscar /auth/me para popular estado
          await fetchProfile();
          toast({ title: 'Login realizado', description: 'Bem-vindo!' });
          return { error: null, user: user ?? null, session: session ?? null };
        } catch (backendErr) {
          console.debug('Backend login falhou, usando fallback localStorage:', backendErr);
          // se backend falhar, continuar para fallback localStorage
        }
      }

      // FALLBACK: LOGIN VIA LOCALSTORAGE
      const allUsers = authStorage.getAllUsers();
      const foundUser = allUsers.find(u => u.email === email);
      
      if (!foundUser) {
        toast({ 
          variant: 'destructive',
          title: 'Erro no login', 
          description: 'Usuário não encontrado' 
        });
        return { error: 'Usuário não encontrado' };
      }

      // Verifica senha (em produção deve ser hash)
      const storedUser = foundUser as unknown as { password?: string };
      if (storedUser.password !== password) {
        toast({ 
          variant: 'destructive',
          title: 'Erro no login', 
          description: 'Senha incorreta' 
        });
        return { error: 'Senha incorreta' };
      }

      const backendUser: BackendUser = {
        id: foundUser.id,
        username: foundUser.nome,
        email: foundUser.email,
        nome: foundUser.nome,
        tipo: foundUser.tipo || (foundUser.type === 'fisica' ? 'fisica' : 'online'),
      };

      setUser(backendUser);
      setProfile({
        id: String(foundUser.id),
        user_id: String(foundUser.id),
        nome: foundUser.nome,
        email: foundUser.email,
        tipo: backendUser.tipo,
      });
      authStorage.setUser(foundUser);

      toast({ title: 'Login realizado', description: 'Bem-vindo!' });
      return { error: null, user: backendUser, session: null };
    } catch (err) {
      const e = err as unknown;
      console.error('signIn error:', e);
      return { error: (e as Error)?.message ?? String(e) };
    }
  }

  async function signUp(email: string, password: string, nome: string, tipo: 'fisica' | 'online' = 'online'): Promise<AuthResult> {
    const hasBackendUrl = !!import.meta.env.VITE_BACKEND_URL;
    
    try {
      // Se tem BACKEND_URL, tentar registrar no FastAPI primeiro
      if (hasBackendUrl) {
        try {
          await userService.register({ email, password, nome, tipo });
          // backend pode fazer auto-login via cookie; buscar perfil
          await fetchProfile();
          toast({ title: 'Registro realizado', description: 'Conta criada com sucesso.' });
          return { error: null, user: user ?? null, session: session ?? null };
        } catch (backendErr) {
          console.debug('Backend register falhou, usando fallback localStorage:', backendErr);
          // se backend falhar, continuar para fallback localStorage
        }
      }

      // FALLBACK: REGISTRO VIA LOCALSTORAGE
      const allUsers = authStorage.getAllUsers();
      // Verifica se email já existe
      if (allUsers.find(u => u.email === email)) {
        toast({ 
          variant: 'destructive',
          title: 'Erro no registro', 
          description: 'Email já cadastrado' 
        });
        return { error: 'Email já cadastrado' };
      }

      const newUser = {
        id: allUsers.length > 0 ? Math.max(...allUsers.map(u => u.id)) + 1 : 1,
        nome,
        email,
        password, // Em produção deve ser hash
        type: tipo,
        tipo,
        createdAt: new Date(),
      };

      authStorage.addUser(newUser);
      
      const backendUser: BackendUser = {
        id: newUser.id,
        username: newUser.nome,
        email: newUser.email,
        nome: newUser.nome,
        tipo: newUser.tipo,
      };

      setUser(backendUser);
      setProfile({
        id: String(newUser.id),
        user_id: String(newUser.id),
        nome: newUser.nome,
        email: newUser.email,
        tipo: newUser.tipo,
      });
      authStorage.setUser(newUser);

      toast({ title: 'Registro realizado', description: 'Conta criada com sucesso.' });
      return { error: null, user: backendUser, session: null };
    } catch (err) {
      const e = err as unknown;
      console.error('signUp error:', e);
      return { error: (e as Error)?.message ?? String(e) };
    }
  }

  const signOut = async () => {
    const hasBackendUrl = !!import.meta.env.VITE_BACKEND_URL;
    
    try {
      // Se tem BACKEND_URL, tentar logout no FastAPI
      if (hasBackendUrl) {
        try {
          await userService.logout();
        } catch (backendErr) {
          console.debug('Backend logout falhou:', backendErr);
        }
      }
      
      // Sempre limpar estado local
      setUser(null);
      setProfile(null);
      setSession(null);
      authStorage.removeUser();
      toast({ title: 'Logout realizado', description: 'Até logo!' });
      return { error: null };
    } catch (err) {
      const e = err as unknown;
      const msg = (e as Error)?.message ?? String(e);
      toast({
        variant: 'destructive',
        title: 'Erro no logout',
        description: msg,
      });
      authStorage.removeUser();
      return { error: msg };
    }
  };

  // Legacy compatibility methods
  const login = async (credentials: { email: string; password: string }) => {
    const { error } = await signIn(credentials.email, credentials.password);
    return !error;
  };

  const register = async (data: { nome: string; email: string; password: string; confirmPassword: string; type: 'fisica' | 'online' }) => {
    if (data.password !== data.confirmPassword) return false;
    const { error } = await signUp(data.email, data.password, data.nome, data.type);
    if (!error) {
      // Após registro bem-sucedido, buscar perfil do usuário (backend faz auto-login)
      await fetchProfile();
    }
    return !error;
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    login,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AuthProvider = AuthProviderComponent;