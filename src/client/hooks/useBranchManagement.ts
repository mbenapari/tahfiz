import { useState, useCallback } from 'react';
import { apiFetch } from '../utils/api';

// Branch-specific types
export interface Branch {
  id: number;
  name: string;
  slug: string;
  parent_school_id: number;
  is_branch: boolean;
  branch_code: string;
  is_active: boolean;
  deactivated_at: string | null;
  timezone: string;
  study_days: number[];
  schedule_mode: 'simple' | 'advanced';
  session_type_day_map: Record<string, number[]> | null;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface BranchMember {
  id: number;
  user_id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
  role: string;
  scope_type: string;
  is_primary_admin: boolean;
}

export interface BranchAdmin {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export interface CreateBranchData {
  name: string;
  slug: string;
  branchCode: string;
  timezone?: string;
  studyDays?: number[];
  scheduleMode?: 'simple' | 'advanced';
  sessionTypeDayMap?: Record<string, number[]>;
  enabledMemorizationSubtypes?: Array<{ key: string; label: string; active: boolean }>;
  address?: string;
  email?: string;
  phone?: string;
}

export interface UpdateBranchData {
  name?: string;
  timezone?: string;
  studyDays?: number[];
  scheduleMode?: 'simple' | 'advanced';
  sessionTypeDayMap?: Record<string, number[]>;
  enabledMemorizationSubtypes?: Array<{ key: string; label: string; active: boolean }>;
  address?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

export const useBranchManagement = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all accessible branches
  const fetchBranches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/api/branches');
      if (response.ok) {
        const data = await response.json();
        setBranches(data.branches || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to fetch branches');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch a single branch
  const fetchBranch = useCallback(async (branchId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/branches/${branchId}`);
      if (response.ok) {
        const data = await response.json();
        return { branch: data.branch, parentSchool: data.parentSchool };
      }
      const errorData = await response.json().catch(() => ({}));
      setError(errorData.error || 'Failed to fetch branch');
      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch branch');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new branch
  const createBranch = useCallback(async (parentSchoolId: number, data: CreateBranchData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, parentSchoolId }),
      });
      if (response.ok) {
        const result = await response.json();
        await fetchBranches(); // Refresh list
        return result.branch;
      }
      const errorData = await response.json().catch(() => ({}));
      setError(errorData.error || 'Failed to create branch');
      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to create branch');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchBranches]);

  // Update branch settings
  const updateBranch = useCallback(async (branchId: number, data: UpdateBranchData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/branches/${branchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const result = await response.json();
        await fetchBranches();
        return result.branch;
      }
      const errorData = await response.json().catch(() => ({}));
      setError(errorData.error || 'Failed to update branch');
      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to update branch');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchBranches]);

  // Toggle branch status (activate/deactivate)
  const toggleBranchStatus = useCallback(async (branchId: number, isActive: boolean, reason?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/branches/${branchId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive, reason }),
      });
      if (response.ok) {
        await fetchBranches();
        return true;
      }
      const errorData = await response.json().catch(() => ({}));
      setError(errorData.error || 'Failed to update branch status');
      return false;
    } catch (err: any) {
      setError(err.message || 'Failed to update branch status');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchBranches]);

  // Delete branch
  const deleteBranch = useCallback(async (branchId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/branches/${branchId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchBranches();
        return true;
      }
      const errorData = await response.json().catch(() => ({}));
      setError(errorData.error || 'Failed to delete branch');
      return false;
    } catch (err: any) {
      setError(err.message || 'Failed to delete branch');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchBranches]);

  // Fetch branch members
  const fetchBranchMembers = useCallback(async (branchId: number): Promise<BranchMember[]> => {
    try {
      const response = await apiFetch(`/api/branches/${branchId}/members`);
      if (response.ok) {
        const data = await response.json();
        return data.members || [];
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  // Add member to branch
  const addBranchMember = useCallback(async (branchId: number, userId: number, role: string) => {
    try {
      const response = await apiFetch(`/api/branches/${branchId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  // Remove member from branch
  const removeBranchMember = useCallback(async (branchId: number, userId: number) => {
    try {
      const response = await apiFetch(`/api/branches/${branchId}/members/${userId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  // Fetch branch admins
  const fetchBranchAdmins = useCallback(async (branchId: number): Promise<BranchAdmin[]> => {
    try {
      const response = await apiFetch(`/api/branch-admins/branch/${branchId}`);
      if (response.ok) {
        const data = await response.json();
        return data.admins || [];
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  // Grant branch admin access
  const grantBranchAdmin = useCallback(async (
    parentSchoolId: number,
    targetUserId: number,
    branchId: number,
    isPrimaryAdmin?: boolean
  ) => {
    try {
      const response = await apiFetch('/api/branch-admins/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentSchoolId, targetUserId, branchId, isPrimaryAdmin }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  // Revoke branch admin access
  const revokeBranchAdmin = useCallback(async (branchId: number, userId: number) => {
    try {
      const response = await apiFetch(`/api/branch-admins/revoke/${userId}/${branchId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  return {
    branches,
    loading,
    error,
    setError,
    fetchBranches,
    fetchBranch,
    createBranch,
    updateBranch,
    toggleBranchStatus,
    deleteBranch,
    fetchBranchMembers,
    addBranchMember,
    removeBranchMember,
    fetchBranchAdmins,
    grantBranchAdmin,
    revokeBranchAdmin,
  };
};
