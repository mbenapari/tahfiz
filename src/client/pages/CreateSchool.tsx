import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CalendarDays, 
  MapPin, 
  Lock, 
  Store,
  ChevronRight,
  LayoutDashboard
} from 'lucide-react';
import { Link } from 'react-router';

const CreateSchool: React.FC = () => {
  const [formData, setFormData] = useState({
    schoolName: '',
    slug: '',
    timezone: 'Asia/Riyadh',
    address: '',
    studyDays: ['MON', 'TUE', 'WED'] as string[],
  });

  const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  const timezones = [
    { value: 'Asia/Riyadh', label: 'Asia/Riyadh (GMT+3)' },
    { value: 'Asia/Dubai', label: 'Asia/Dubai (GMT+4)' },
    { value: 'Europe/London', label: 'Europe/London (GMT+0)' },
    { value: 'America/New_York', label: 'America/New_York (GMT-5)' },
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Add creation logic here
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
              className="flex items-center gap-2 px-6 py-3 bg-primary text-background-dark rounded-lg font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              <Store size={20} />
              <span>Create School</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateSchool;
