
export interface User {
  id: number;
  nome: string;
  email: string;
  type: 'fisica' | 'online';
  tipo: 'fisica' | 'online' | 'admin'; // Added for mesa permissions
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  nome: string;
  email: string;
  password: string;
  confirmPassword: string;
  type: 'fisica' | 'online';
}

// Context interface for Auth
export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Stored user interface for localStorage compatibility
export interface StoredUser {
  id: number;
  email: string;
  nome: string;
  name?: string; // Manter compatibilidade temporária
  password: string;
  type?: 'online' | 'fisica';
  tipo?: 'online' | 'fisica' | 'admin';
  createdAt?: Date; // Adiciona createdAt opcional
}
