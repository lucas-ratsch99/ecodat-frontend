import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/api/client';
import type { User, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    const token = localStorage.getItem('api_password');
    const userStr = localStorage.getItem('auth_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        setAuthState({ user, token, isAuthenticated: true });
      } catch {
        localStorage.removeItem('api_password');
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  const login = async (password: string) => {
    const result = await api.auth.login(password);
    if (!result.ok) throw new Error('Login failed');

    const user: User = {
      id: 'shared',
      email: 'ecodat@ecodat.nl',
      name: 'Ecologist',
      role: 'admin',
    };
    localStorage.setItem('api_password', result.api_password);
    localStorage.setItem('auth_user', JSON.stringify(user));
    setAuthState({ user, token: result.api_password, isAuthenticated: true });
  };

  const logout = () => {
    localStorage.removeItem('api_password');
    localStorage.removeItem('auth_user');
    setAuthState({ user: null, token: null, isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
