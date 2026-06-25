import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CalendarDays, 
  MapPin, 
  Lock, 
  Store,
  ChevronRight,
  LayoutDashboard,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { apiFetch } from '../utils/api';

const CreateSchool: React.FC = () => {
  const DAY_INDEX: Record<string, number> = {
    SUN: 0,
    MON: 1,
    TUE: 2,
    WED: 3,
    THU: 4,
    FRI: 5,
    SAT: 6,
  };

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    schoolName: '',
    slug: '',
    timezone: 'Asia/Riyadh',
    address: '',
    studyDays: ['MON', 'TUE', 'WED'] as string[],
    scheduleMode: 'simple' as 'simple' | 'advanced',
    sessionTypeDayMap: {
      'memorization:default': ['MON', 'TUE', 'WED'] as string[],
      'revision': [] as string[],
    },
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  const timezones = [
    { value: 'Asia/Riyadh', label: 'Asia/Riyadh (GMT+3)' },
    { value: 'Asia/Dubai', label: 'Asia/Dubai (GMT+4)' },
    { value: 'Asia/Kuala_Lumpur', label: 'Asia/Kuala_Lumpur (GMT+8)' },
    { value: 'Asia/Jakarta', label: 'Asia/Jakarta (GMT+7)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9)' },
    { value: 'Asia/Karachi', label: 'Asia/Karachi (GMT+5)' },
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (GMT+5:30)' },
    { value: 'Australia/Sydney', label: 'Australia/Sydney (GMT+10)' },
    { value: 'Europe/London', label: 'Europe/London (GMT+0)' },
    { value: 'Europe/Paris', label: 'Europe/Paris (GMT+1)' },
    { value: 'Europe/Berlin', label: 'Europe/Berlin (GMT+1)' },
    { value: 'Africa/Cairo', label: 'Africa/Cairo (GMT+2)' },
    { value: 'Africa/Abidjan', label: 'Africa/Abidjan (GMT+0)' },
    { value: 'Africa/Accra', label: 'Africa/Accra (GMT+0)' },
    { value: 'Africa/Lagos', label: 'Africa/Lagos (GMT+1)' },
    { value: 'Africa/Algiers', label: 'Africa/Algiers (GMT+1)' },
    { value: 'America/New_York', label: 'America/New_York (GMT-5)' },
    { value: 'America/Chicago', label: 'America/Chicago (GMT-6)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (GMT-8)' },
    { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo (GMT-3)' },
    { value: 'Pacific/Auckland', label: 'Pacific/Auckland (GMT+12)' },
  ];

  // Auto-generate slug from school name
  useEffect(() => {
    const generatedSlug = formData.schoolName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    setFormData(prev => ({ ...prev, slug: generatedSlug }));
  }, [formData.schoolName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleDay = (day: string) => {
    setFormData(prev => {
      const currentDays = prev.studyDays;
      if (currentDays.includes(day)) {
        return { ...prev, studyDays: currentDays.filter(d => d !== day) };
      } else {
        return { ...prev, studyDays: [...currentDays, day] };
      }
    });
  };

  const toggleTypeDay = (type: 'memorization:default' | 'revision', day: string) => {
    setFormData((prev) => {
      const currentDays = prev.sessionTypeDayMap[type];
      return {
        ...prev,
        sessionTypeDayMap: {
          ...prev.sessionTypeDayMap,
          [type]: currentDays.includes(day)
            ? currentDays.filter((value) => value !== day)
            : [...currentDays, day],
        },
      };
    });
  };

  const overlappingDays = formData.sessionTypeDayMap['memorization:default'].filter((day, index) => {
    return formData.sessionTypeDayMap.revision.includes(day)
      && formData.sessionTypeDayMap['memorization:default'].indexOf(day) === index;
  });
  const hasOverlap = formData.scheduleMode === 'advanced' && overlappingDays.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasOverlap) {
      setStatus({
        type: 'error',
        message: 'Memorization and Revision days cannot overlap in advanced scheduling mode.',
      });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const payload = {
        ...formData,
        sessionTypeDayMap:
          formData.scheduleMode === 'advanced'
            ? {
                'memorization:default': formData.sessionTypeDayMap['memorization:default'].map((day) => DAY_INDEX[day]),
                revision: formData.sessionTypeDayMap.revision.map((day) => DAY_INDEX[day]),
              }
            : null,
      };

      const response = await apiFetch('/api/schools/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || result.error || 'Failed to create school');
      }

      setStatus({ type: 'success', message: 'School created successfully!' });
      
      // Navigate to dashboard after success
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-dark text-white font-display overflow-x-hidden antialiased p-6 md:p-10">
      
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-8">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-text-muted text-sm font-medium">
          <div className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </div>
          <ChevronRight size={14} />
          <span className="hover:text-white transition-colors cursor-pointer">Schools</span>
          <ChevronRight size={14} />
          <span className="text-white">Add New</span>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Register New School</h1>
          <p className="text-text-muted max-w-2xl">
            Create a new tenant for the platform. This will set up the initial configuration, study days, and location settings.
          </p>
        </div>

        {status && (
          <div className={`p-4 rounded-lg border ${
            status.type === 'success' 
              ? 'bg-green-500/10 border-green-500/50 text-green-500' 
              : 'bg-red-500/10 border-red-500/50 text-red-500'
          }`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          {/* Basic Information Card */}
          <div className="bg-surface-dark rounded-xl p-6 border border-border-green/30 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="text-primary" size={24} />
              <h2 className="text-lg font-bold">Basic Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-white">School Name <span className="text-red-500">*</span></span>
                <input 
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleChange}
                  className="h-12 w-full rounded-lg bg-background-dark border border-border-green px-4 text-white placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g. Al-Huda Academy"
                  required
                />
              </label>
              
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-white">Tenant Slug (Auto-generated)</span>
                <div className="relative">
                  <input 
                    value={formData.slug}
                    readOnly
                    className="h-12 w-full rounded-lg bg-background-dark border border-border-green px-4 text-text-muted focus:outline-none cursor-not-allowed opacity-70"
                    placeholder="e.g. al-huda-academy"
                  />
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                </div>
              </label>
            </div>
          </div>

          {/* Scheduling Card */}
          <div className="bg-surface-dark rounded-xl p-6 border border-border-green/30 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <CalendarDays className="text-primary" size={24} />
              <h2 className="text-lg font-bold">Scheduling</h2>
            </div>
            
            <div className="flex flex-col gap-6">
              <label className="flex flex-col gap-2 max-w-md">
                <span className="text-sm font-bold text-white">Timezone</span>
                <select 
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="h-12 w-full rounded-lg bg-background-dark border border-border-green px-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
                >
                  {timezones.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
                <p className="text-xs text-text-muted mt-1">Used for prayer times and class scheduling.</p>
              </label>
              
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-white">Active Study Days</span>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map(day => {
                    const isSelected = formData.studyDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`
                          h-10 w-14 rounded-lg text-sm font-bold transition-all border
                          ${isSelected 
                            ? 'bg-primary text-background-dark border-primary hover:bg-opacity-90' 
                            : 'bg-transparent text-text-muted border-border-green hover:border-text-muted hover:text-white'
                          }
                        `}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border-green/20 bg-background-dark/30 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-white">Enable Advanced Scheduling</p>
                  <p className="text-xs text-text-muted">Assign different days for Hifz and Revision during school creation.</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      scheduleMode: prev.scheduleMode === 'simple' ? 'advanced' : 'simple',
                    }))
                  }
                  className={`h-8 w-14 rounded-full transition-colors ${formData.scheduleMode === 'advanced' ? 'bg-primary' : 'bg-white/10'}`}
                >
                  <div className={`mt-1 h-6 w-6 rounded-full bg-white transition-all ${formData.scheduleMode === 'advanced' ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              {formData.scheduleMode === 'advanced' && (
                <div className="flex flex-col gap-5 rounded-xl border border-border-green/20 bg-background-dark/30 p-4">
                  {hasOverlap && (
                    <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
                      <AlertCircle size={18} className="mt-0.5 shrink-0" />
                      <p className="text-xs font-medium">
                        Memorization and Revision overlap on {overlappingDays.join(', ')}. Assign each day to only one session type before creating the school.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <span className="text-sm font-bold text-white">Memorization (Hifz)</span>
                    <div className="flex flex-wrap gap-2">
                      {weekDays.map((day) => {
                        const isSelected = formData.sessionTypeDayMap['memorization:default'].includes(day);
                        const isConflicting = overlappingDays.includes(day);
                        return (
                          <button
                            key={`mem-${day}`}
                            type="button"
                            onClick={() => toggleTypeDay('memorization:default', day)}
                            className={`h-10 w-14 rounded-lg text-sm font-bold transition-all border ${
                              isConflicting
                                ? 'bg-red-500/20 text-red-300 border-red-500'
                                : isSelected
                                ? 'bg-primary/20 text-primary border-primary'
                                : 'bg-transparent text-text-muted border-border-green hover:border-text-muted hover:text-white'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <span className="text-sm font-bold text-white">Revision (Muraja&apos;ah)</span>
                    <div className="flex flex-wrap gap-2">
                      {weekDays.map((day) => {
                        const isSelected = formData.sessionTypeDayMap.revision.includes(day);
                        const isConflicting = overlappingDays.includes(day);
                        return (
                          <button
                            key={`rev-${day}`}
                            type="button"
                            onClick={() => toggleTypeDay('revision', day)}
                            className={`h-10 w-14 rounded-lg text-sm font-bold transition-all border ${
                              isConflicting
                                ? 'bg-red-500/20 text-red-300 border-red-500'
                                : isSelected
                                ? 'bg-blue-500/20 text-blue-300 border-blue-400'
                                : 'bg-transparent text-text-muted border-border-green hover:border-text-muted hover:text-white'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location Details Card */}
          <div className="bg-surface-dark rounded-xl p-6 border border-border-green/30 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <MapPin className="text-primary" size={24} />
                <h2 className="text-lg font-bold">Location Details</h2>
              </div>
              <span className="text-xs font-medium bg-border-green/30 text-text-muted px-2 py-1 rounded">Optional</span>
            </div>
            
            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold text-white">Address</span>
              <input 
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="h-12 w-full rounded-lg bg-background-dark border border-border-green px-4 text-white placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="e.g. 123 Quran School St, Riyadh, Saudi Arabia"
              />
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 mt-4">
            <button 
              type="button" 
              className="px-6 py-3 text-white font-medium hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || hasOverlap}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-background-dark rounded-lg font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-background-dark border-t-transparent rounded-full animate-spin" />
              ) : (
                <Store size={20} />
              )}
              <span>{loading ? 'Creating...' : 'Create School'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateSchool;
