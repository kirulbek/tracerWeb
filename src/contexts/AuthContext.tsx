import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, UserResponse } from '../utils/api';

interface AuthContextType {
  user: { userId: string; username: string; fullName?: string; isAdmin: boolean } | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ userId: string; username: string; fullName?: string; isAdmin: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем, есть ли сохраненный токен
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Проверяем токен на сервере
      authApi.getMe()
        .then(userData => {
          setUser(userData);
        })
        .catch(() => {
          // Токен недействителен
          localStorage.removeItem('auth_token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const response = await authApi.login(username, password);
    setUser(response.user);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


