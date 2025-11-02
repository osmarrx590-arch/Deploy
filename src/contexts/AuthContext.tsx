/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { authStorage } from '@/services/storageService';

// BACKEND URL used by auth hooks; keep at module scope so it doesn't change between renders
const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';

export interface BackendUser {
  id: string;
  email: string;
  nome?: string;
  tipo?: 'fisica' | 'online' | 'admin';
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface BackendSession {
  accessToken?: string;
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
      try {
        const res = await fetch(`${BACKEND}/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const backendUser: BackendUser = {
            id: String(data.id),
            email: data.email,
            nome: data.nome,
            tipo: data.tipo,
            created_at: data.created_at,
            updated_at: data.updated_at,
            ...data,
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
          // Persistir usuário no storage local para sinalizar sessão ativa entre abas
          try { authStorage.setUser({ id: Number(data.id), nome: data.nome, email: data.email, type: data.tipo, tipo: data.tipo, createdAt: data.created_at ? new Date(data.created_at) : new Date() }); } catch (e) { console.debug(e); }
        } else {
          // Se backend não considerar o usuário autenticado, limpar também o localStorage
          authStorage.removeUser();
          setUser(null);
          setProfile(null);
          setSession(null);
        }
      } catch (err) {
        const e = err as unknown;
        console.error('Error initializing auth from backend:', e);
        // Em caso de erro (ex: backend reiniciado), limpar o usuário local para evitar sessão fantasma
        try { authStorage.removeUser(); } catch (e) { console.debug(e); }
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
      const res = await fetch(`${BACKEND}/auth/me`, { credentials: 'include' });
      if (!res.ok) {
        // limpar storage de auth para sinalizar logout
        try { authStorage.removeUser(); } catch (e) { console.debug(e); }
        setProfile(null);
        setUser(null);
        setSession(null);
        return null;
      }
      const data = await res.json();
      const backendUser: BackendUser = {
        id: String(data.id),
        email: data.email,
        nome: data.nome,
        tipo: data.tipo,
        created_at: data.created_at,
        updated_at: data.updated_at,
        ...data,
      };
      const p: Profile = {
        id: String(data.id),
        user_id: String(data.id),
        nome: data.nome,
        email: data.email,
        tipo: (data.tipo || 'online') as Profile['tipo'],
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      setProfile(p);
      setUser(backendUser);
      setSession((data.session ?? null) as BackendSession | null);
      // Persistir usuário no storage local para sinalizar sessão ativa entre abas
      try { authStorage.setUser({ id: Number(data.id), nome: data.nome, email: data.email, type: data.tipo, tipo: data.tipo, createdAt: data.created_at ? new Date(data.created_at) : new Date() }); } catch (e) { console.debug(e); }
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
    try {
      const res = await fetchWithTimeout(`${BACKEND}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }, 15000);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        return { error: err.detail ?? 'Erro ao logar' };
      }
      // Atualiza estado chamando /auth/me (cookie httpOnly)
      await fetchProfile();
      toast({ title: 'Login realizado', description: 'Bem-vindo!' });
      return { error: null, user, session };
    } catch (err) {
      const e = err as unknown;
      console.error('signIn error:', e);
      return { error: (e as Error)?.message ?? String(e) };
    }
  }

  async function signUp(email: string, password: string, nome: string, tipo: 'fisica' | 'online' = 'online'): Promise<AuthResult> {
    try {
      const res = await fetchWithTimeout(`${BACKEND}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, password, tipo }),
      }, 15000);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        return { error: err.detail ?? 'Erro ao registrar' };
      }
      // após registro o backend faz auto-login via cookie; buscar /auth/me para popular o estado
      try {
        await fetchProfile();
      } catch (e) {
        console.warn('fetchProfile após registro falhou:', e);
      }
      toast({ title: 'Registro realizado', description: 'Conta criada com sucesso.' });
      return { error: null, user, session };
    } catch (err) {
      const e = err as unknown;
      console.error('signUp error:', e);
      return { error: (e as Error)?.message ?? String(e) };
    }
  }

  const signOut = async () => {
    try {
      const res = await fetch(`${BACKEND}/auth/logout`, { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        const msg = err.detail ?? 'Erro no logout';
        toast({ variant: 'destructive', title: 'Erro no logout', description: msg });
        return { error: msg };
      }
      setUser(null);
      setProfile(null);
      setSession(null);
      try { authStorage.removeUser(); } catch (e) { console.debug(e); }
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
      try { authStorage.removeUser(); } catch (e) { console.debug(e); }
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