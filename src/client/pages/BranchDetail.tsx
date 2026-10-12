import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Loader2, Settings, Users, MapPin, Mail, Phone, Clock, CheckCircle, XCircle, Shield, Plus, Trash2, Search, UserPlus, X, CalendarDays, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useBranchManagement, type Branch, type BranchMember, type BranchAdmin } from '../hooks/useBranchManagement';
import { useSchoolContext } from '../context/SchoolContext';
import { apiFetch } from '../utils/api';
import UserSearchSelector, { type UserOption } from '../components/UserSearchSelector';

type TabType = 'overview' | 'members' | 'schedule' | 'settings';

const BranchDetail: React.FC = () => {
  const { branchId } = useParams<{ branchId: string }>();
  const navigate = useNavigate();
  const { currentSchool } = useSchoolContext();
  const {
    loading: branchLoading,
    fetchBranch,
    updateBranch,
    toggleBranchStatus,
    fetchBranchMembers,
    addBranchMember,
    removeBranchMember,
    fetchBranchAdmins,
    grantBranchAdmin,
    revokeBranchAdmin,
  } = useBranchManagement();

  const [branch, setBranch] = useState<Branch | null>(null);
  const [parentSchool, setParentSchool] = useState<any>(null);
  const [members, setMembers] = useState<BranchMember[]>([]);
  const [admins, setAdmins] = useState<BranchAdmin[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [adminGrantOpen, setAdminGrantOpen] = useState(false);
  const [selectedAdminUser, setSelectedAdminUser] = useState<UserOption | null>(null);
  const [adminGrantRole, setAdminGrantRole] = useState<string>('instructor');
  const [grantingAdmin, setGrantingAdmin] = useState(false);
  const [adminGrantError, setAdminGrantError] = useState<string | null>(null);
  const targetRole = 'instructor'; // Only instructors can be added via this modal
  // User search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: number; first_name: string; last_name: string; email: string; phone?: string; role: string }>>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: number; first_name: string; last_name: string; email: string; role: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUserData, setNewUserData] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  // Schedule edit state
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<{ timezone: string }>({ timezone: 'UTC' });
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Dropdown user list
  const [dropdownUsers, setDropdownUsers] = useState<Array<{ id: number; first_name: string; last_name: string; email: string; phone?: string; role: string }>>([]);
  const [loadingDropdown, setLoadingDropdown] = useState(false);

  useEffect(() => {
    if (!branchId) return;
    const loadData = async () => {
      setLoading(true);
      const result = await fetchBranch(parseInt(branchId));
      if (result) {
        setBranch(result.branch);
        setParentSchool(result.parentSchool);
        setScheduleForm({ timezone: result.branch.timezone || 'UTC' });

        // Load members and admins
        const [membersData, adminsData] = await Promise.all([
          fetchBranchMembers(parseInt(branchId)),
          fetchBranchAdmins(parseInt(branchId)),
        ]);
        setMembers(membersData);
        setAdmins(adminsData);
      } else {
        setError('Failed to load branch details');
      }
      setLoading(false);
    };
    loadData();
  }, [branchId, fetchBranch, fetchBranchMembers, fetchBranchAdmins]);

  const handleToggleStatus = async () => {
    if (!branch) return;
    const reason = branch.is_active ? 'Deactivated from detail page' : 'Reactivated from detail page';
    const success = await toggleBranchStatus(branch.id, !branch.is_active, reason);
    if (success) {
      setBranch(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
    }
  };

  // Load users by role for dropdown
  const loadDropdownUsers = async (role: string) => {
    setLoadingDropdown(true);
    try {
      const response = await apiFetch(`/api/users/role/${role}`);
      if (response.ok) {
        const result = await response.json();
        setDropdownUsers(result.data?.users || []);
      } else {
        setDropdownUsers([]);
      }
    } catch {
      setDropdownUsers([]);
    } finally {
      setLoadingDropdown(false);
    }
  };

  // Open member modal and load initial dropdown
  const openMemberModal = () => {
    setMemberModalOpen(true);
    loadDropdownUsers(targetRole);
  };

  // Search users by name for member selection (excludes students)
  const handleUserSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setMemberError(null);
    try {
      const response = await apiFetch(`/api/users/search?query=${encodeURIComponent(query)}&excludeRoles=student`);
      if (response.ok) {
        const result = await response.json();
        const users = result.data?.users || [];
        setSearchResults(users);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Add existing user as member
  const handleAddExistingMember = async (userId: number) => {
    if (!branch) return;
    setIsAddingMember(true);
    setMemberError(null);
    const success = await addBranchMember(branch.id, userId, targetRole);
    if (success) {
      resetMemberModal();
      const membersData = await fetchBranchMembers(branch.id);
      setMembers(membersData);
    } else {
      setMemberError('Failed to add member. They may already be in this branch.');
    }
    setIsAddingMember(false);
  };

  // Create new user and add as member
  const handleCreateAndAddMember = async () => {
    if (!branch || !newUserData.firstName) return;
    setIsAddingMember(true);
    setMemberError(null);
    try {
      const createRes = await apiFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: newUserData.firstName,
          lastName: newUserData.lastName,
          email: newUserData.email || undefined,
          phone: newUserData.phone || undefined,
          role: targetRole,
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        setMemberError(err.error?.message || 'Failed to create user');
        setIsAddingMember(false);
        return;
      }
      const createResult = await createRes.json();
      const newUserId = createResult.data?.user?.id;

      if (!newUserId) {
        setMemberError('User created but ID not returned');
        setIsAddingMember(false);
        return;
      }

      const addSuccess = await addBranchMember(branch.id, newUserId, targetRole);
      if (addSuccess) {
        resetMemberModal();
        const membersData = await fetchBranchMembers(branch.id);
        setMembers(membersData);
      } else {
        setMemberError('User created but failed to add to branch');
      }
    } catch {
      setMemberError('An error occurred while creating the user');
    } finally {
      setIsAddingMember(false);
    }
  };

  const resetMemberModal = () => {
    setMemberModalOpen(false);
    setSelectedUser(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowCreateForm(false);
    setNewUserData({ firstName: '', lastName: '', email: '', phone: '' });
    setMemberError(null);
  };

  const handleRemoveMember = async (userId: number) => {
    if (!branch) return;
    const success = await removeBranchMember(branch.id, userId);
    if (success) {
      setMembers(prev => prev.filter(m => m.user_id !== userId));
    }
  };

  // Reset admin grant modal state
  const resetAdminGrantModal = () => {
    setAdminGrantOpen(false);
    setSelectedAdminUser(null);
    setAdminGrantRole('instructor');
    setAdminGrantError(null);
  };

  // Grant admin to an existing user
  const handleGrantAdminSubmit = async (userId: number) => {
    if (!branch || !currentSchool) return;
    setGrantingAdmin(true);
    setAdminGrantError(null);
    const success = await grantBranchAdmin(currentSchool.id, userId, branch.id, false);
    if (success) {
      resetAdminGrantModal();
      const adminsData = await fetchBranchAdmins(branch.id);
      setAdmins(adminsData);
    } else {
      setAdminGrantError('Failed to grant admin access. The user may already be an admin.');
    }
    setGrantingAdmin(false);
  };

  // Create a new user and grant admin
  const handleCreateAndGrantAdmin = async (_userId: number, createData?: { firstName: string; lastName: string; email: string; phone: string }) => {
    if (!branch || !currentSchool || !createData) return;
    setGrantingAdmin(true);
    setAdminGrantError(null);
    try {
      const createRes = await apiFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: createData.firstName,
          lastName: createData.lastName,
          email: createData.email || undefined,
          phone: createData.phone || undefined,
          role: adminGrantRole,
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        setAdminGrantError(err.error?.message || 'Failed to create user');
        setGrantingAdmin(false);
        return;
      }
      const createResult = await createRes.json();
      const newUserId = createResult.data?.user?.id;
      if (!newUserId) {
        setAdminGrantError('User created but ID not returned');
        setGrantingAdmin(false);
        return;
      }
      const success = await grantBranchAdmin(currentSchool.id, newUserId, branch.id, false);
      if (success) {
        resetAdminGrantModal();
        const adminsData = await fetchBranchAdmins(branch.id);
        setAdmins(adminsData);
      } else {
        setAdminGrantError('User created but failed to grant admin access');
      }
    } catch {
      setAdminGrantError('An error occurred while creating the user');
    } finally {
      setGrantingAdmin(false);
    }
  };

  // Route submit to the appropriate handler
  const handleAdminSubmit = (userId: number, createData?: { firstName: string; lastName: string; email: string; phone: string }) => {
    if (userId === -1) {
      handleCreateAndGrantAdmin(userId, createData);
    } else {
      handleGrantAdminSubmit(userId);
    }
  };

  // Save schedule configuration
  const handleSaveSchedule = async () => {
    if (!branch) return;
    setSavingSchedule(true);
    const success = await updateBranch(branch.id, {
      timezone: scheduleForm.timezone,
    });
    if (success) {
      setBranch(prev => prev ? { ...prev, timezone: scheduleForm.timezone } : null);
      setIsEditingSchedule(false);
    }
    setSavingSchedule(false);
  };

  const handleRevokeAdmin = async (userId: number) => {
    if (!branch) return;
    const success = await revokeBranchAdmin(branch.id, userId);
    if (success) {
      setAdmins(prev => prev.filter(a => a.id !== userId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 mb-4">{error || 'Branch not found'}</p>
        <button
          onClick={() => navigate('/branches')}
          className="text-primary hover:text-primary-hover text-sm font-medium"
        >
          Back to Branches
        </button>
      </div>
    );
  }

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <Settings size={16} /> },
    { key: 'members', label: 'Members', icon: <Users size={16} /> },
    { key: 'schedule', label: 'Schedule', icon: <Clock size={16} /> },
    { key: 'settings', label: 'Settings', icon: <Shield size={16} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/branches')}
        className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        Back to Branches
      </button>

      {/* Header */}
      <div className="bg-surface-dark border border-border-green/20 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{branch.name}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {branch.branch_code}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                branch.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {branch.is_active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                {branch.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-text-muted text-sm">
              {branch.address && (
                <span className="flex items-center gap-1"><MapPin size={14} /> {branch.address}</span>
              )}
              {branch.email && (
                <span className="flex items-center gap-1"><Mail size={14} /> {branch.email}</span>
              )}
              {branch.phone && (
                <span className="flex items-center gap-1"><Phone size={14} /> {branch.phone}</span>
              )}
            </div>
          </div>
          <button
            onClick={handleToggleStatus}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              branch.is_active
                ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                : 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20'
            }`}
          >
            {branch.is_active ? 'Deactivate Branch' : 'Reactivate Branch'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-dark border border-border-green/20 rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-primary/10 text-primary'
                : 'text-text-muted hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-surface-dark border border-border-green/20 rounded-2xl p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-white font-semibold">Branch Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Branch Code</span>
                    <span className="text-white font-medium">{branch.branch_code}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Slug</span>
                    <span className="text-white">{branch.slug}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Timezone</span>
                    <span className="text-white">{branch.timezone}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Status</span>
                    <span className={branch.is_active ? 'text-green-400' : 'text-red-400'}>
                      {branch.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {branch.deactivated_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Deactivated At</span>
                      <span className="text-white">{new Date(branch.deactivated_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-white font-semibold">Parent School</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Name</span>
                    <span className="text-white">{parentSchool?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Parent School Slug</span>
                    <span className="text-white">{parentSchool?.slug || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Branch Members ({members.length})</h3>
              <button
                onClick={openMemberModal}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium"
              >
                <Plus size={16} />
                Add Member
              </button>
            </div>

            {members.length === 0 ? (
              <p className="text-text-muted text-sm py-4">No members in this branch yet.</p>
            ) : (
              <div className="space-y-2">
                {members.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between bg-background-dark rounded-xl px-4 py-3"
                  >
                    <div>
                      <div className="text-white font-medium text-sm">
                        {member.user?.first_name} {member.user?.last_name || ''}
                      </div>
                      <div className="text-text-muted text-xs mt-0.5">
                        {member.user?.email && /^[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/.test(member.user.email) ? 'Email hidden' : member.user?.email} - {member.role}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Member Modal */}
            {memberModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={resetMemberModal} />
                <div className="relative bg-surface-dark border border-border-green/20 rounded-2xl p-6 max-w-md w-full mx-4 z-10 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">
                      {showCreateForm ? 'Create New User' : 'Add Member'}
                    </h3>
                    {showCreateForm && (
                      <button
                        onClick={() => { setShowCreateForm(false); setSelectedUser(null); }}
                        className="text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        Back to Search
                      </button>
                    )}
                  </div>

                  {!showCreateForm ? (
                    <div className="space-y-3">
                      {/* Dropdown Selector - instructors only */}
                      {!selectedUser && (
                         <select
                           value=""
                           onChange={(e) => {
                            const selectedId = e.target.value;
                            if (!selectedId) return;
                            const user = dropdownUsers.find(u => String(u.id) === selectedId);
                            if (user) setSelectedUser(user);
                          }}
                          className="w-full bg-background-dark border border-border-green/20 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50"
                        >
                          <option value="" disabled>{loadingDropdown ? 'Loading...' : 'Select instructor...'}</option>
                          {dropdownUsers.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.first_name} {user.last_name || ''} {user.email ? `(${user.email})` : ''}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Search Users */}
                      {!selectedUser ? (
                        <>
                          <div className="flex items-center gap-2 text-text-muted">
                            <span className="flex-1 border-t border-border-green/20" />
                            <span className="text-xs px-2">or search</span>
                            <span className="flex-1 border-t border-border-green/20" />
                          </div>

                          <div className="relative">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => handleUserSearch(e.target.value)}
                              placeholder="Search by name, email or phone..."
                              className="w-full bg-background-dark border border-border-green/20 rounded-lg pl-10 pr-10 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50"
                            />
                            {isSearching && (
                              <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary animate-spin" />
                            )}
                          </div>

                          {/* Search Results */}
                          {searchResults.length > 0 && (
                            <div className="bg-background-dark border border-border-green/20 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                              {searchResults.map(user => (
                                <button
                                  key={user.id}
                                  onClick={() => { setSelectedUser(user); setSearchResults([]); setSearchQuery(''); }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-primary/5 border-b border-border-green/10 last:border-0 transition-colors"
                                >
                                  <div className="text-white text-sm font-medium">
                                    {user.first_name} {user.last_name || ''}
                                  </div>
                                  <div className="text-text-muted text-xs">
                                    {user.email} {user.phone ? `· ${user.phone}` : ''} · {user.role}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* No Results + Create New CTA */}
                          {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                            <div className="text-center py-3">
                              <p className="text-text-muted text-sm mb-2">No users found</p>
                              <button
                                onClick={() => setShowCreateForm(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-sm font-medium text-primary transition-colors"
                              >
                                <UserPlus size={16} />
                                Create New User
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        /* Selected User Display */
                        <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/30 rounded-lg">
                          <div>
                            <div className="text-white text-sm font-medium">
                              {selectedUser.first_name} {selectedUser.last_name || ''}
                            </div>
                            <div className="text-text-muted text-xs">{selectedUser.email} · {selectedUser.role}</div>
                          </div>
                          <button
                            onClick={() => setSelectedUser(null)}
                            className="p-1 text-text-muted hover:text-white transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}

                      {/* Error Message */}
                      {memberError && (
                        <p className="text-red-400 text-xs">{memberError}</p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3 pt-1">
                        <button onClick={resetMemberModal} className="flex-1 px-4 py-2 rounded-lg border border-border-green/20 text-text-muted text-sm">
                          Cancel
                        </button>
                        <button
                          onClick={() => selectedUser && handleAddExistingMember(selectedUser.id)}
                          disabled={!selectedUser || isAddingMember}
                          className="flex-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isAddingMember && <Loader2 size={14} className="animate-spin" />}
                          Add to Branch
                        </button>
                      </div>

                      {/* Create New CTA at bottom */}
                      <button
                        onClick={() => setShowCreateForm(true)}
                        className="w-full py-2 text-sm text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <UserPlus size={14} />
                        Or create a brand new user
                      </button>
                    </div>
                  ) : (
                    /* Create New User Form */
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-text-muted text-xs mb-1">First Name *</label>
                          <input
                            type="text"
                            value={newUserData.firstName}
                            onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                            placeholder="First name"
                            className="w-full bg-background-dark border border-border-green/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                          />
                        </div>
                        <div>
                          <label className="block text-text-muted text-xs mb-1">Last Name</label>
                          <input
                            type="text"
                            value={newUserData.lastName}
                            onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                            placeholder="Last name"
                            className="w-full bg-background-dark border border-border-green/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-text-muted text-xs mb-1">Email</label>
                        <input
                          type="email"
                          value={newUserData.email}
                          onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                          placeholder="user@example.com"
                          className="w-full bg-background-dark border border-border-green/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                        />
                      </div>
                      <div>
                        <label className="block text-text-muted text-xs mb-1">Phone</label>
                        <input
                          type="tel"
                          value={newUserData.phone}
                          onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                          placeholder="+1234567890"
                          className="w-full bg-background-dark border border-border-green/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                        />
                      </div>
                      {memberError && (
                        <p className="text-red-400 text-xs">{memberError}</p>
                      )}

                      <div className="flex gap-3 pt-1">
                        <button
                          onClick={() => { setShowCreateForm(false); setNewUserData({ firstName: '', lastName: '', email: '', phone: '' }); }}
                          className="flex-1 px-4 py-2 rounded-lg border border-border-green/20 text-text-muted text-sm"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleCreateAndAddMember}
                          disabled={!newUserData.firstName || isAddingMember}
                          className="flex-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isAddingMember && <Loader2 size={14} className="animate-spin" />}
                          Create &amp; Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-white font-semibold">Schedule Configuration</h3>
              {!isEditingSchedule ? (
                <button
                  onClick={() => {
                    setScheduleForm({ timezone: branch.timezone || 'UTC' });
                    setIsEditingSchedule(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditingSchedule(false)}
                    className="px-3 py-1.5 rounded-lg border border-border-green/20 text-text-muted hover:text-white text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSchedule}
                    disabled={savingSchedule}
                    className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {savingSchedule && <Loader2 size={14} className="animate-spin" />}
                    Save
                  </button>
                </div>
              )}
            </div>

            {isEditingSchedule ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-text-muted text-sm mb-2">Timezone</label>
                    <select
                      value={scheduleForm.timezone}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, timezone: e.target.value }))}
                      className="w-full bg-background-dark border border-border-green/20 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50"
                    >
                      {Intl.supportedValuesOf?.('timeZone')?.map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      )) || (
                        <>
                          <option value="UTC">UTC</option>
                          <option value="Africa/Accra">Africa/Accra</option>
                          <option value="America/New_York">America/New_York</option>
                          <option value="Europe/London">Europe/London</option>
                          <option value="Asia/Dubai">Asia/Dubai</option>
                          <option value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Session Days</span>
                    <span className="text-white">Every day</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Timezone</span>
                    <span className="text-white">{branch.timezone}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-white font-semibold">Branch Admins</h3>
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-muted text-sm">Admins with branch-level access</span>
              <button
                onClick={() => setAdminGrantOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium"
              >
                <Plus size={16} />
                Grant Admin
              </button>
            </div>

            {admins.length === 0 ? (
              <p className="text-text-muted text-sm">No branch admins assigned.</p>
            ) : (
              <div className="space-y-2">
                {admins.map(admin => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between bg-background-dark rounded-xl px-4 py-3"
                  >
                    <div className="text-white font-medium text-sm">
                      {admin.first_name} {admin.last_name || ''}
                    </div>
                    <button
                      onClick={() => handleRevokeAdmin(admin.id)}
                      className="px-3 py-1 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-medium"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Grant Admin Modal */}
            {adminGrantOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={resetAdminGrantModal} />
                <div className="relative bg-surface-dark border border-border-green/20 rounded-2xl p-6 max-w-md w-full mx-4 z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">Grant Branch Admin</h3>
                    <button onClick={resetAdminGrantModal} className="p-1 text-text-muted hover:text-white transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                  <UserSearchSelector
                    key={`grant-admin-${adminGrantOpen}-${adminGrantRole}`}
                    role={adminGrantRole as 'instructor' | 'student' | 'admin'}
                    onRoleChange={(role) => { setAdminGrantRole(role); setSelectedAdminUser(null); }}
                    availableRoles={['instructor', 'admin']}
                    searchExcludeRoles="student"
                    selectedUser={selectedAdminUser}
                    onUserSelect={setSelectedAdminUser}
                    onUserDeselect={() => setSelectedAdminUser(null)}
                    onCancel={resetAdminGrantModal}
                    onSubmit={handleAdminSubmit}
                    submitLabel="Grant Admin"
                    allowCreate
                    error={adminGrantError}
                    isSubmitting={grantingAdmin}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchDetail;
