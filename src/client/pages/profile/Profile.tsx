import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  Save,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router';

export const Profile: React.FC = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/users/me');
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const data = await response.json();
      const userData = data.user;

      setFormData({
        firstName: userData.first_name || '',
        lastName: userData.last_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching user data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Validate password change
      if (formData.newPassword) {
        if (!formData.currentPassword) {
          throw new Error('Current password is required to change password');
        }
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('New passwords do not match');
        }
        if (formData.newPassword.length < 8) {
          throw new Error('Password must be at least 8 characters long');
        }
      }

      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone
      };

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result = await response.json();
      setUser(result.user);

      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      alert('Profile updated successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 size={40} className="text-primary animate-spin" />
        <p className="text-text-muted font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-2 text-sm font-medium text-text-muted mb-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
              <p className="text-text-muted">Manage your personal information and account settings.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchUserData()}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-text-muted hover:text-white border border-transparent hover:border-border-green/30 transition-all disabled:opacity-50"
              >
                Reset
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-background-dark rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Profile Info */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Personal Information */}
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-8">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Personal Information</h2>
                <p className="text-sm text-text-muted">Update your basic profile details.</p>
              </div>
              <User className="text-text-muted/50" size={24} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-text-muted">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-text-muted">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-text-muted">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-text-muted">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Password Change */}
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-8">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Change Password</h2>
                <p className="text-sm text-text-muted">Update your account password. Leave blank to keep current password.</p>
              </div>
              <Shield className="text-text-muted/50" size={24} />
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-text-muted">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 px-4 pr-12 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-text-muted">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      placeholder="Enter new password"
                      className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 px-4 pr-12 text-white focus:outline-none focus:border-primary/50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-text-muted">Confirm New Password</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Account Summary */}
        <div className="flex flex-col gap-6">

          {/* Account Info */}
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Account Information</h3>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center pb-4 border-b border-border-green/10">
                <span className="text-text-muted font-medium">Role</span>
                <span className="text-white font-bold capitalize">{user?.role}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-border-green/10">
                <span className="text-text-muted font-medium">School</span>
                <span className="text-white font-bold">{user?.school_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted font-medium">Member Since</span>
                <span className="text-white font-bold">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short',
                    day: 'numeric'
                  }) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Avatar */}
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Profile Picture</h3>
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-surface-dark border-4 border-border-green/30 flex items-center justify-center overflow-hidden">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.first_name || 'User'}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <button className="text-sm font-bold text-primary hover:text-white transition-colors">
                Change Avatar
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};