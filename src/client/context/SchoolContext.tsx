import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiFetch } from '../utils/api';

export interface SchoolContextData {
  id: number;
  name: string;
  slug: string;
  is_branch: boolean;
  parent_school_id: number | null;
  branch_code: string | null;
  is_active: boolean;
}

export interface AccessibleSchool {
  id: number;
  name: string;
  slug: string;
  is_branch: boolean;
  parent_school_id: number | null;
  branch_code: string | null;
  is_active: boolean;
}

export interface SchoolTreeNode extends AccessibleSchool {
  branches: AccessibleSchool[];
}

interface SchoolContextType {
  currentSchool: SchoolContextData | null;
  accessibleSchools: AccessibleSchool[];
  schoolTree: SchoolTreeNode[];
  loading: boolean;
  error: string | null;
  switchContext: (schoolId: number) => Promise<boolean>;
  refreshContext: () => Promise<void>;
  refreshAccessibleSchools: () => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSchool, setCurrentSchool] = useState<SchoolContextData | null>(null);
  const [accessibleSchools, setAccessibleSchools] = useState<AccessibleSchool[]>([]);
  const [schoolTree, setSchoolTree] = useState<SchoolTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentContext = useCallback(async () => {
    try {
      const response = await apiFetch('/api/context/current');
      if (response.ok) {
        const data = await response.json();
        setCurrentSchool(data.school);
        return data.school;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Retry helper: attempts fn up to maxRetries times with exponential backoff
  const retryWithBackoff = async <T,>(fn: () => Promise<T>, maxRetries: number = 3, baseDelay: number = 500): Promise<T> => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();
        if (result !== null && result !== undefined) {
          return result;
        }
        // fn returned null/undefined — treat as retryable failure
        lastError = new Error('Fetch returned empty result');
      } catch (err) {
        lastError = err;
      }
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  };

  const fetchAccessibleSchools = useCallback(async () => {
    try {
      const [schoolsRes, treeRes] = await Promise.all([
        apiFetch('/api/context/accessible'),
        apiFetch('/api/context/accessible/tree'),
      ]);

      if (schoolsRes.ok) {
        const schoolsData = await schoolsRes.json();
        setAccessibleSchools(schoolsData.schools || []);
      }

      if (treeRes.ok) {
        const treeData = await treeRes.json();
        setSchoolTree(treeData.tree || []);
      }
    } catch {
      // Silently fail - accessible schools is a convenience feature
    }
  }, []);

  const refreshContext = useCallback(async () => {
    setLoading(true);
    setError(null);
    await fetchCurrentContext();
    setLoading(false);
  }, [fetchCurrentContext]);

  const refreshAccessibleSchools = useCallback(async () => {
    await fetchAccessibleSchools();
  }, [fetchAccessibleSchools]);

  const switchContext = useCallback(async (schoolId: number): Promise<boolean> => {
    try {
      const response = await apiFetch(`/api/context/switch/${schoolId}`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setCurrentSchool(data.school);
        
        // Update localStorage for subsequent requests
        localStorage.setItem('active_school_id', schoolId.toString());
        
        // Refresh the page or trigger a re-fetch of all data to reflect new context
        window.location.reload(); 
        
        return true;
      }
      const errorData = await response.json().catch(() => ({}));
      setError(errorData.error || 'Failed to switch context');
      return false;
    } catch (err: any) {
      setError(err.message || 'Failed to switch context');
      return false;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // Retry context fetch with backoff — handles race conditions where
        // auth cookies may not be fully ready on initial page load
        await retryWithBackoff(fetchCurrentContext, 3, 500);
        await fetchAccessibleSchools();
      } catch (err) {
        console.error('SchoolContext initialization failed after retries:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchCurrentContext, fetchAccessibleSchools]);

  return (
    <SchoolContext.Provider
      value={{
        currentSchool,
        accessibleSchools,
        schoolTree,
        loading,
        error,
        switchContext,
        refreshContext,
        refreshAccessibleSchools,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchoolContext = (): SchoolContextType => {
  const context = useContext(SchoolContext);
  if (context === undefined) {
    throw new Error('useSchoolContext must be used within a SchoolProvider');
  }
  return context;
};

export default SchoolContext;
