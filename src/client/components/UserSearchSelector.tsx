import React, { useState, useEffect } from 'react';
import { Loader2, Search, UserPlus, X } from 'lucide-react';
import { apiFetch } from '../utils/api';

export interface UserOption {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
}

export type UserRole = 'instructor' | 'student' | 'admin';

interface UserSearchSelectorProps {
  /** Selected role for filtering dropdown */
  role: UserRole;
  /** Called when role changes */
  onRoleChange: (role: UserRole) => void;
  /** Available roles to show in the selector */
  availableRoles?: UserRole[];
  /** Roles to exclude from search results (comma-separated for API) */
  searchExcludeRoles?: string;
  /** Currently selected user */
  selectedUser: UserOption | null;
  /** Called when a user is selected */
  onUserSelect: (user: UserOption) => void;
  /** Called when user is deselected */
  onUserDeselect: () => void;
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Called when submit is clicked with the selected user, or with -1 and create data for new user */
  onSubmit: (userId: number, createData?: { firstName: string; lastName: string; email: string; phone: string }) => void;
  /** Submit button label */
  submitLabel?: string;
  /** Whether to allow creating a new user */
  allowCreate?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Whether the form is submitting */
  isSubmitting?: boolean;
  /** Show the create-new-user form by default */
  initialShowCreate?: boolean;
}

const isEncryptedEmail = (email: string | undefined | null): boolean => {
  if (!email) return false;
  // Encrypted format from crypto.ts: iv:tag:encryptedHex (three hex segments separated by colons)
  return /^[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/.test(email);
};

const safeEmail = (email: string | undefined | null): string => {
  if (!email) return '';
  return isEncryptedEmail(email) ? 'Email hidden' : email;
};

const UserSearchSelector: React.FC<UserSearchSelectorProps> = ({
  role,
  onRoleChange,
  availableRoles = ['instructor', 'student', 'admin'],
  searchExcludeRoles,
  selectedUser,
  onUserSelect,
  onUserDeselect,
  onCancel,
  onSubmit,
  submitLabel = 'Submit',
  allowCreate = false,
  error,
  isSubmitting = false,
  initialShowCreate = false,
}) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Dropdown state
  const [dropdownUsers, setDropdownUsers] = useState<UserOption[]>([]);
  const [loadingDropdown, setLoadingDropdown] = useState(false);

  // Create new user state
  const [showCreateForm, setShowCreateForm] = useState(initialShowCreate);
  const [newUserData, setNewUserData] = useState({ firstName: '', lastName: '', email: '', phone: '' });

  // Load dropdown users when role changes
  useEffect(() => {
    loadDropdownUsers(role);
  }, [role]);

  const loadDropdownUsers = async (roleFilter: string) => {
    setLoadingDropdown(true);
    try {
      const response = await apiFetch(`/api/users/role/${roleFilter}`);
      if (response.ok) {
        const result = await response.json();
        const users = result?.data?.users;
        setDropdownUsers(Array.isArray(users) ? users : []);
      } else {
        setDropdownUsers([]);
      }
    } catch {
      setDropdownUsers([]);
    } finally {
      setLoadingDropdown(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const params = new URLSearchParams({ query });
      if (searchExcludeRoles) params.set('excludeRoles', searchExcludeRoles);
      const response = await apiFetch(`/api/users/search?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setSearchResults(result.data?.users || []);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowCreateForm(false);
    setNewUserData({ firstName: '', lastName: '', email: '', phone: '' });
  };

  const handleBackFromCreate = () => {
    setShowCreateForm(false);
    setNewUserData({ firstName: '', lastName: '', email: '', phone: '' });
  };

  const roleSelector = (
    <select
      value={role}
      onChange={(e) => { onRoleChange(e.target.value as UserRole); onUserDeselect(); }}
      className="w-full bg-background-dark border border-border-green/20 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50"
    >
      {availableRoles.includes('instructor') && <option value="instructor">Instructor</option>}
      {availableRoles.includes('student') && <option value="student">Student</option>}
      {availableRoles.includes('admin') && <option value="admin">Admin</option>}
    </select>
  );

  if (showCreateForm) {
    return (
      <div className="space-y-3" data-cy="create-user-form">
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
        {roleSelector}
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div className="flex gap-3 pt-1">
          <button onClick={handleBackFromCreate} className="flex-1 px-4 py-2 rounded-lg border border-border-green/20 text-text-muted text-sm">
            Back
          </button>
          <button
            onClick={() => onSubmit(-1, {
              firstName: newUserData.firstName,
              lastName: newUserData.lastName,
              email: newUserData.email,
              phone: newUserData.phone,
            })}
            disabled={!newUserData.firstName || isSubmitting}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            Create &amp; Submit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-cy="user-search-selector">
      {roleSelector}

      {!selectedUser ? (
        <>
          {/* Dropdown Selector */}
          <select
            value=""
            onChange={(e) => {
              const selectedId = parseInt(e.target.value, 10);
              if (isNaN(selectedId)) return;
              const user = dropdownUsers.find(u => Number(u.id) === selectedId);
              if (user) onUserSelect(user);
            }}
            className="w-full bg-background-dark border border-border-green/20 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50"
          >
            <option value="" disabled>{loadingDropdown ? 'Loading...' : `Select ${role}...`}</option>
            {dropdownUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.first_name} {user.last_name || ''} {safeEmail(user.email) ? `(${safeEmail(user.email)})` : ''}
              </option>
            ))}
          </select>

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
              onChange={(e) => handleSearch(e.target.value)}
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
                  onClick={() => { onUserSelect(user); setSearchResults([]); setSearchQuery(''); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-primary/5 border-b border-border-green/10 last:border-0 transition-colors"
                >
                  <div className="text-white text-sm font-medium">
                    {user.first_name} {user.last_name || ''}
                  </div>
                  <div className="text-text-muted text-xs">
                    {safeEmail(user.email)} {user.phone ? `· ${user.phone}` : ''} · {user.role}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No Results + Create New CTA */}
          {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
            <div className="text-center py-3">
              <p className="text-text-muted text-sm mb-2">No users found</p>
              {allowCreate && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-sm font-medium text-primary transition-colors"
                >
                  <UserPlus size={16} />
                  Create New User
                </button>
              )}
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
            <div className="text-text-muted text-xs">{safeEmail(selectedUser.email)} · {selectedUser.role}</div>
          </div>
          <button
            onClick={onUserDeselect}
            className="p-1 text-text-muted hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-lg border border-border-green/20 text-text-muted text-sm">
          Cancel
        </button>
        <button
          onClick={() => selectedUser && onSubmit(selectedUser.id)}
          disabled={!selectedUser || isSubmitting}
          className="flex-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {submitLabel}
        </button>
      </div>

      {/* Create New CTA at bottom */}
      {allowCreate && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full py-2 text-sm text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1.5"
        >
          <UserPlus size={14} />
          Or create a brand new user
        </button>
      )}
    </div>
  );
};

export default UserSearchSelector;
