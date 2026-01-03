import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { User } from '@/lib/auth';
import { login as firebaseLogin, register as firebaseRegister, signOut as firebaseSignOut, onAuthStateChange, getAuthHeaders, isAuthenticated } from '@/lib/firebaseAuth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ token: string; user: User }>;
  register: (email: string, password: string, name: string) => Promise<{ token: string; user: User }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (!isAuthenticated()) {
      setLoading(false);
      setUser(null);
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/auth/me', {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        // If 401 or 404, user is not authenticated
        if (response.status === 401 || response.status === 404) {
          setUser(null);
        }
      }
    } catch (error) {
      // Silently fail if backend is not available
      console.warn('Failed to fetch user (backend may not be running):', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        await refreshUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await firebaseLogin(email, password);
      setUser(data.user);
      return data;
    } catch (error: any) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const data = await firebaseRegister(email, password, name);
      setUser(data.user);
      return data;
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    await firebaseSignOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

