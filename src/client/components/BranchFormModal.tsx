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

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

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
  const [scheduleMode, setScheduleMode] = useState<'simple' | 'advanced'>(
    (editBranch?.schedule_mode as 'simple' | 'advanced') || 'simple'
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(editBranch?.study_days || []);
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
      setScheduleMode((editBranch.schedule_mode as 'simple' | 'advanced') || 'simple');
      setSelectedDays(editBranch.study_days || []);
    }
  }, [isOpen, editBranch]);

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

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
    if (selectedDays.length === 0) {
      setLocalError('At least one study day must be selected');
      return;
    }

    const data: any = {
      name,
      slug,
      timezone,
      address: address || undefined,
      email: email || undefined,
      phone: phone || undefined,
      scheduleMode,
      studyDays: selectedDays,
    };

    if (!editBranch) {
      data.branchCode = branchCode;
    }

    await onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-dark border border-border-green/20 rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto z-10">
        {/* Header */}
        <div className="sticky top-0 bg-surface-dark border-b border-border-green/10 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-white font-semibold text-lg">
            {editBranch ? 'Edit Branch' : 'Create New Branch'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
              className="w-full bg-background-dark border border-border-green/20 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
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
              className="w-full bg-background-dark border border-border-green/20 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
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
                className="w-full bg-background-dark border border-border-green/20 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
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
              className="w-full bg-background-dark border border-border-green/20 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="Branch address"
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background-dark border border-border-green/20 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="branch@school.com"
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-background-dark border border-border-green/20 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
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
              className="w-full bg-background-dark border border-border-green/20 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Schedule Mode */}
          <div>
            <label className="block text-sm text-text-muted mb-1.5">Schedule Mode</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setScheduleMode('simple')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  scheduleMode === 'simple'
                    ? 'bg-primary/10 border border-primary/20 text-primary'
                    : 'bg-background-dark border border-border-green/20 text-text-muted hover:text-white'
                }`}
              >
                Simple
              </button>
              <button
                type="button"
                onClick={() => setScheduleMode('advanced')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  scheduleMode === 'advanced'
                    ? 'bg-primary/10 border border-primary/20 text-primary'
                    : 'bg-background-dark border border-border-green/20 text-text-muted hover:text-white'
                }`}
              >
                Advanced
              </button>
            </div>
          </div>

          {/* Study Days */}
          <div>
            <label className="block text-sm text-text-muted mb-1.5">Study Days *</label>
            <div className="grid grid-cols-4 gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    selectedDays.includes(day.value)
                      ? 'bg-primary/10 border border-primary/20 text-primary'
                      : 'bg-background-dark border border-border-green/20 text-text-muted hover:text-white'
                  }`}
                >
                  {day.label.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border-green/20 text-text-muted hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
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
