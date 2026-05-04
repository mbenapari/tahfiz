import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch, fetchCsrfToken } from '../utils/api';

export interface User {
  id: number;
  first_name: string;
  last_name?: string;
  email: string;
  role: string;
  tenantId: number | null;
  school_name?: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      // Ensure we have a CSRF token
      await fetchCsrfToken();

      // Try normal user endpoint first
      let response = await apiFetch('/api/users/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return;
      }

      // If not found, try system owner endpoint
      response = await apiFetch('/api/owner/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return;
      }

      setUser(null);
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      setUser(null);
      
      // Clear all client-side storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies that might have auth data (besides JWT handled by backend)
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, checkAuth, logout }}>
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
