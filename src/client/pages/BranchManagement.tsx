import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Plus, Search, Filter, Loader2, Building2, AlertCircle } from 'lucide-react';
import { BranchCard } from '../components/BranchCard';
import { BranchFormModal } from '../components/BranchFormModal';
import { useBranchManagement, type CreateBranchData, type UpdateBranchData } from '../hooks/useBranchManagement';
import { useSchoolContext } from '../context/SchoolContext';

type FilterTab = 'all' | 'active' | 'inactive';

const BranchManagement: React.FC = () => {
  const navigate = useNavigate();
  const { currentSchool, loading: contextLoading, refreshContext } = useSchoolContext();
  const {
    branches,
    loading,
    error,
    setError,
    fetchBranches,
    createBranch,
    updateBranch,
    toggleBranchStatus,
    deleteBranch,
  } = useBranchManagement();

  const [showModal, setShowModal] = useState(false);
  const [editBranch, setEditBranch] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [contextRetrying, setContextRetrying] = useState(false);

  useEffect(() => {
    if (currentSchool) {
      fetchBranches();
    }
  }, [fetchBranches, currentSchool]);

  const handleRefreshContext = async () => {
    setContextRetrying(true);
    await refreshContext();
    setContextRetrying(false);
  };

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentSchool) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-surface-dark rounded-2xl border border-border-green/20 p-8 text-center">
        <Building2 size={48} className="text-text-muted mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No School Selected</h2>
        <p className="text-text-muted mb-6 max-w-md">
          Your school context could not be loaded. This may happen if the session
          is still initializing. Try refreshing or select a school manually.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleRefreshContext}
            disabled={contextRetrying}
            className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium disabled:opacity-50 inline-flex items-center gap-2"
          >
            {contextRetrying && <Loader2 size={16} className="animate-spin" />}
            {contextRetrying ? 'Retrying...' : 'Retry'}
          </button>
          <Link
            to="/switch-school"
            className="px-6 py-2.5 border border-border-green/20 text-text-muted rounded-lg hover:text-white hover:bg-white/5 transition-colors font-medium"
          >
            Select a School
          </Link>
        </div>
      </div>
    );
  }

  const filteredBranches = branches.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.branch_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterTab === 'all' ||
                          (filterTab === 'active' && b.is_active) ||
                          (filterTab === 'inactive' && !b.is_active);
    return matchesSearch && matchesFilter;
  });

  const activeCount = branches.filter(b => b.is_active).length;
  const inactiveCount = branches.filter(b => !b.is_active).length;

  const handleCreate = async (data: CreateBranchData | UpdateBranchData) => {
    const parentId = currentSchool?.id;
    if (!parentId) {
      setError('No parent school context');
      return;
    }
    const result = await createBranch(parentId, data as CreateBranchData);
    if (result) {
      setShowModal(false);
    }
  };

  const handleToggleStatus = async (branchId: number, isActive: boolean) => {
    const reason = isActive ? 'Reactivated by admin' : 'Deactivated by admin';
    await toggleBranchStatus(branchId, isActive, reason);
  };

  const handleDelete = async (branchId: number) => {
    await deleteBranch(branchId);
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Branch Management</h1>
          <p className="text-text-muted text-sm mt-1">
            Manage your school branches and their configurations
          </p>
        </div>
        <button
          onClick={() => {
            setEditBranch(null);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          Create New Branch
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-dark border border-border-green/20 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{branches.length}</div>
          <div className="text-text-muted text-sm">Total Branches</div>
        </div>
        <div className="bg-surface-dark border border-border-green/20 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-400">{activeCount}</div>
          <div className="text-text-muted text-sm">Active</div>
        </div>
        <div className="bg-surface-dark border border-border-green/20 rounded-xl p-4">
          <div className="text-2xl font-bold text-red-400">{inactiveCount}</div>
          <div className="text-text-muted text-sm">Inactive</div>
        </div>
        <div className="bg-surface-dark border border-border-green/20 rounded-xl p-4">
          <div className="text-2xl font-bold text-primary">{currentSchool?.name || 'N/A'}</div>
          <div className="text-text-muted text-sm">Parent School</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search branches by name or code..."
            className="w-full bg-surface-dark border border-border-green/20 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex gap-1 bg-surface-dark border border-border-green/20 rounded-xl p-1">
          {(['all', 'active', 'inactive'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                filterTab === tab
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            Dismiss
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && !branches.length && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!loading && branches.length === 0 && (
        <div className="text-center py-16">
          <Building2 size={48} className="mx-auto text-text-muted/30 mb-4" />
          <h3 className="text-white text-lg font-semibold mb-2">No Branches Yet</h3>
          <p className="text-text-muted text-sm mb-4">
            Create your first branch to start managing multiple school locations
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            Create Your First Branch
          </button>
        </div>
      )}

      {/* No Results */}
      {!loading && branches.length > 0 && filteredBranches.length === 0 && (
        <div className="text-center py-12">
          <Filter size={32} className="mx-auto text-text-muted/30 mb-3" />
          <p className="text-text-muted">No branches match your search or filter criteria</p>
        </div>
      )}

      {/* Branch Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredBranches.map((branch) => (
          <BranchCard
            key={branch.id}
            branch={branch}
            onToggleStatus={handleToggleStatus}
            onDelete={(id) => setDeleteConfirm(id)}
          />
        ))}
      </div>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-surface-dark border border-border-green/20 rounded-2xl p-6 max-w-sm w-full mx-4 z-10">
            <h3 className="text-white font-semibold text-lg mb-2">Delete Branch?</h3>
            <p className="text-text-muted text-sm mb-6">
              This action cannot be undone. All branch data will be preserved but the branch will be deactivated.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-border-green/20 text-text-muted hover:text-white hover:bg-white/5 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Branch Form Modal */}
      <BranchFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditBranch(null);
          setError(null);
        }}
        onSubmit={handleCreate}
        loading={loading}
        editBranch={editBranch}
        error={error}
      />
    </div>
  );
};

export default BranchManagement;
