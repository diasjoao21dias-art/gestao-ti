import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  nome: string;
  email: string;
  cargo?: string;
  departamento?: string;
  nivel_permissao: string;
  ativo: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<User>;
  register: (nome: string, email: string, senha: string, cargo?: string, departamento?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      verificarToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verificarToken = async (tokenToVerify: string) => {
    try {
      const response = await fetch('/api/auth/verificar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
        },
      });

      const data = await response.json();

      if (!data.valid) {
        logout();
      } else {
        setUser(data.user);
      }
    } catch (error) {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, senha: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, senha }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao fazer login');
    }

    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data.user;
  };

  const register = async (nome: string, email: string, senha: string, cargo?: string, departamento?: string) => {
    const response = await fetch('/api/auth/registro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nome, email, senha, cargo, departamento }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar conta');
    }

    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
