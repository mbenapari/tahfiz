import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { CreateBranchData, UpdateBranchData, Branch } from '../hooks/useBranchManagement';

interface BranchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBranchData | UpdateBranchData) => Promise<any>;
  loading?: boolean;
  editBranch?: Branch | null;
  error?: string | null;
}

export const BranchFormModal: React.FC<BranchFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  editBranch,
  error,
}) => {
  const [name, setName] = useState(editBranch?.name || '');
  const [slug, setSlug] = useState(editBranch?.slug || '');
  const [branchCode, setBranchCode] = useState(editBranch?.branch_code || '');
  const [timezone, setTimezone] = useState(editBranch?.timezone || 'UTC');
  const [address, setAddress] = useState(editBranch?.address || '');
  const [email, setEmail] = useState(editBranch?.email || '');
  const [phone, setPhone] = useState(editBranch?.phone || '');
  const [localError, setLocalError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && editBranch) {
      setName(editBranch.name || '');
      setSlug(editBranch.slug || '');
      setBranchCode(editBranch.branch_code || '');
      setTimezone(editBranch.timezone || 'UTC');
      setAddress(editBranch.address || '');
      setEmail(editBranch.email || '');
      setPhone(editBranch.phone || '');
    }
  }, [isOpen, editBranch]);

  const generateSlug = (inputName: string) => {
    return inputName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!editBranch) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!name || !slug) {
      setLocalError('Name and slug are required');
      return;
    }
    if (!editBranch && !branchCode) {
      setLocalError('Branch code is required');
      return;
    }

    const data: any = {
      name,
      slug,
      timezone,
      address: address || undefined,
      email: email || undefined,
      phone: phone || undefined,
    };

    if (!editBranch) {
      data.branchCode = branchCode;
    }

    await onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-dark border border-border-green/20 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg sm:mx-4 max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain z-10">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-surface-dark border-b border-border-green/10 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-white font-semibold text-lg">
            {editBranch ? 'Edit Branch' : 'Create New Branch'}
          </h2>
          <button onClick={onClose} aria-label="Close" className="p-2.5 -mr-2 hover:bg-white/5 rounded-lg transition-colors">
            <X size={20} className="text-text-muted" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-4 sm:space-y-5">
          {(localError || error) && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
              {localError || error}
            </div>
          )}

          {/* Branch Name */}
          <div>
            <label className="block text-sm text-text-muted mb-1.5">Branch Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-background-dark border border-border-green/20 rounded-lg px-4 py-3 sm:py-2.5 text-white text-base sm:text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="e.g., Downtown Campus"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm text-text-muted mb-1.5">Slug *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full bg-background-dark border border-border-green/20 rounded-lg px-4 py-3 sm:py-2.5 text-white text-base sm:text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="e.g., downtown-campus"
            />
          </div>

          {/* Branch Code (only for create) */}
          {!editBranch && (
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Branch Code *</label>
              <input
                type="text"
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
                maxLength={10}
                className="w-full bg-background-dark border border-border-green/20 rounded-lg px-4 py-3 sm:py-2.5 text-white text-base sm:text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="e.g., DT001"
              />
            </div>
          )}

          {/* Address */}
          <div>
            <label className="block text-sm text-text-muted mb-1.5">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-background-dark border border-border-green/20 rounded-lg px-4 py-3 sm:py-2.5 text-white text-base sm:text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="Branch address"
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background-dark border border-border-green/20 rounded-lg px-4 py-3 sm:py-2.5 text-white text-base sm:text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="branch@school.com"
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-background-dark border border-border-green/20 rounded-lg px-4 py-3 sm:py-2.5 text-white text-base sm:text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="+1-234-567-8900"
              />
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm text-text-muted mb-1.5">Timezone</label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-background-dark border border-border-green/20 rounded-lg px-4 py-3 sm:py-2.5 text-white text-base sm:text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 sm:py-2.5 rounded-lg border border-border-green/20 text-text-muted hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 sm:py-2.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {editBranch ? 'Save Changes' : 'Create Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BranchFormModal;
