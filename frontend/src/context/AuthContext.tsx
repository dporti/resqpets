import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  permisos: Record<string, boolean>;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (permiso: string) => boolean;
  isRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('resqpet_token'));
  const [permisos, setPermisos] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      Promise.all([api.me(), api.permisos()])
        .then(([userData, permisosData]) => {
          setUser(userData);
          setPermisos(permisosData.permisos);
        })
        .catch(() => {
          localStorage.removeItem('resqpet_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const { token: t, user: u } = await api.login(email, password);
    localStorage.setItem('resqpet_token', t);
    setToken(t);
    setUser(u);
    const permisosData = await api.permisos();
    setPermisos(permisosData.permisos);
  };

  const logout = () => {
    localStorage.removeItem('resqpet_token');
    setToken(null);
    setUser(null);
    setPermisos({});
  };

  const can = (permiso: string) => permisos[permiso] ?? false;
  const isRole = (...roles: UserRole[]) => !!user && roles.includes(user.rol);

  return (
    <AuthContext.Provider value={{ user, token, permisos, loading, login, logout, can, isRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
