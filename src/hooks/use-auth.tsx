'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService, type User } from '@/lib/auth-service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const token = authService.getToken();
      
      if (!token) {
        setUser(null);
        return;
      }

      // Verify token is still valid
      const isValid = await authService.verifyToken();
      
      if (!isValid) {
        authService.logout();
        setUser(null);
        return;
      }

      // Get current user data
      const userData = await authService.getCurrentUser();
      setUser(userData);
      
      // Set cookie for middleware
      document.cookie = `access_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
      
    } catch (error) {
      console.error('Auth check failed:', error);
      authService.logout();
      setUser(null);
      // Clear cookie
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
      
      // Set cookie for middleware
      document.cookie = `access_token=${response.access_token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
      
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await authService.register({ email, password });
      setUser(response.user);
      
      // Set cookie for middleware
      document.cookie = `access_token=${response.access_token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
      
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    
    // Clear cookie
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    
    router.push('/');
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    token: authService.getToken(),
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
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