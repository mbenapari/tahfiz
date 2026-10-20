import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch, fetchCsrfToken } from '../utils/api';

export interface SchoolMembership {
  id: number;
  name: string;
  role: string;
  is_primary: boolean;
}

export interface User {
  id: number;
  first_name: string;
  last_name?: string;
  email: string;
  role: string;
  tenantId: number | null;
  active_school_context: number | null;
  schools: SchoolMembership[];
  is_onboarded?: boolean;
  progress_onboarding_dismissed?: boolean;
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
        const result = await response.json();
        // The backend returns { success: true, data: { user: { ... } } }
        const userData = result.data?.user || result.user;
        
        if (userData) {
          // Ensure is_onboarded is a boolean
          userData.is_onboarded = !!userData.is_onboarded;
          userData.progress_onboarding_dismissed = !!userData.progress_onboarding_dismissed;
          
          // Set active school context in localStorage for apiFetch header
          if (userData.active_school_context) {
            localStorage.setItem('active_school_id', userData.active_school_context.toString());
          } else if (userData.tenantId) {
            localStorage.setItem('active_school_id', userData.tenantId.toString());
          }
          
          setUser(userData);
          return;
        }
      }

      // If not found, try system owner endpoint
      response = await apiFetch('/api/owner/me');
      if (response.ok) {
        const result = await response.json();
        const userData = result.data?.user || result.user;
        
        if (userData) {
          // Ensure is_onboarded is a boolean (system owners are always onboarded)
          userData.is_onboarded = true;
          localStorage.removeItem('active_school_id');
          setUser(userData);
          return;
        }
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
      localStorage.removeItem('active_school_id');
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
