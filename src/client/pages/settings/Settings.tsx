import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Calendar, 
  Users, 
  CreditCard, 
  Save, 
  CheckCircle2, 
  Clock, 
  Info,
  CalendarDays,
  Globe,
  Mail,
  Phone,
  Shield,
  MoreVertical,
  Plus,
  Loader2
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'schedule' | 'instructors' | 'billing'>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schoolData, setSchoolData] = useState<any>(null);
  const [instructors, setInstructors] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [schoolRes, instructorsRes] = await Promise.all([
        fetch('/api/schools/me'),
        fetch('/api/users/instructors')
      ]);

      if (!schoolRes.ok || !instructorsRes.ok) {
        throw new Error('Failed to fetch settings data');
      }

      const [school, instructorsData] = await Promise.all([
        schoolRes.json(),
        instructorsRes.json()
      ]);

      setSchoolData(school);
      setInstructors(instructorsData.instructors || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/schools/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: schoolData.name,
          slug: schoolData.slug,
          timezone: schoolData.timezone,
          studyDays: schoolData.study_days,
          startTime: schoolData.start_time,
          endTime: schoolData.end_time,
          email: schoolData.email,
          phone: schoolData.phone,
          address: schoolData.address,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      const result = await response.json();
      setSchoolData(result.school);
      alert('Settings updated successfully');
    } catch (err: any) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 size={40} className="text-primary animate-spin" />
        <p className="text-text-muted font-medium">Loading school settings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-2 text-sm font-medium text-text-muted mb-2">
            <span>Dashboard</span>
            <span>›</span>
            <span>Settings</span>
            <span>›</span>
            <span className="text-white capitalize">{activeTab.replace('-', ' ')}</span>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">School Configuration</h1>
              <p className="text-text-muted">Manage school details, study schedules, and instructor permissions from a central dashboard.</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => fetchData()}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-text-muted hover:text-white border border-transparent hover:border-border-green/30 transition-all disabled:opacity-50"
              >
                Discard
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

        {/* Tabs Navigation */}
        <div className="flex items-center border-b border-border-green/20">
          <TabButton 
            active={activeTab === 'general'} 
            onClick={() => setActiveTab('general')} 
            icon={Building2} 
            label="General Info" 
          />
          <TabButton 
            active={activeTab === 'schedule'} 
            onClick={() => setActiveTab('schedule')} 
            icon={Calendar} 
            label="Study Schedule" 
          />
          <TabButton 
            active={activeTab === 'instructors'} 
            onClick={() => setActiveTab('instructors')} 
            icon={Users} 
            label="Instructors" 
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        {activeTab === 'schedule' && (
          <StudyScheduleTab 
            data={schoolData} 
            setData={(updated: any) => setSchoolData({ ...schoolData, ...updated })} 
          />
        )}
        {activeTab === 'general' && (
          <GeneralInfoTab 
            data={schoolData} 
            setData={(updated: any) => setSchoolData({ ...schoolData, ...updated })} 
          />
        )}
        {activeTab === 'instructors' && <InstructorsTab instructors={instructors} />}
        {activeTab === 'billing' && <BillingTab />}
      </div>

    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ElementType; label: string }> = ({ active, onClick, icon: Icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all ${
      active 
        ? 'border-primary text-white' 
        : 'border-transparent text-text-muted hover:text-white hover:border-border-green/30'
    }`}
  >
    <Icon size={18} />
    {label}
  </button>
);

// Tab Content Components

const StudyScheduleTab: React.FC<{ data: any; setData: (d: any) => void }> = ({ data, setData }) => {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const activeDayNumbers = data.study_days || [];

  const toggleDay = (dayIndex: number) => {
    const newDays = activeDayNumbers.includes(dayIndex)
      ? activeDayNumbers.filter((d: number) => d !== dayIndex)
      : [...activeDayNumbers, dayIndex];
    setData({ study_days: newDays });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Column: Schedule Controls */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Active Study Days */}
        <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Active Study Days</h2>
              <p className="text-sm text-text-muted">Select the days when on-site classes are held.</p>
            </div>
            <CalendarDays className="text-text-muted/50" size={24} />
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            {days.map((day, index) => {
              const isActive = activeDayNumbers.includes(index);
              return (
                <div 
                  key={day}
                  onClick={() => toggleDay(index)}
                  className={`
                    w-16 h-20 rounded-xl flex flex-col items-center justify-center gap-2 border-2 cursor-pointer transition-all
                    ${isActive 
                      ? 'bg-primary border-primary text-background-dark' 
                      : 'bg-transparent border-border-green/30 text-text-muted hover:border-primary/50'
                    }
                  `}
                >
                  <span className="text-xs font-bold">{day}</span>
                  {isActive && <CheckCircle2 size={20} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Operations */}
        <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-1">Daily Operations</h2>
            <p className="text-sm text-text-muted">Standard operating hours for Hifz sessions.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-text-muted">Start Time</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none" size={18} />
                <input 
                  type="time" 
                  value={data.start_time || ''}
                  onChange={(e) => setData({ start_time: e.target.value })}
                  className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 pl-11 pr-4 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors [color-scheme:dark] cursor-pointer"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-text-muted">End Time</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none" size={18} />
                <input 
                  type="time" 
                  value={data.end_time || ''}
                  onChange={(e) => setData({ end_time: e.target.value })}
                  className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 pl-11 pr-4 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors [color-scheme:dark] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Holiday Detection */}
        <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl text-white">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold">Automated Holiday Detection</h3>
              <p className="text-sm text-text-muted">Automatically close schedule on major Islamic holidays.</p>
            </div>
          </div>
          <div className="w-14 h-8 bg-primary rounded-full relative cursor-pointer">
            <div className="absolute right-1 top-1 w-6 h-6 bg-white rounded-full shadow-sm"></div>
          </div>
        </div>

      </div>

      {/* Right Column: Summaries */}
      <div className="flex flex-col gap-6">
        
        {/* Schedule Summary */}
        <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Schedule Summary</h3>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center pb-4 border-b border-border-green/10">
              <span className="text-text-muted font-medium">Active Days</span>
              <span className="text-white font-bold">{activeDayNumbers.length} Days / Week</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-border-green/10">
              <span className="text-text-muted font-medium">Daily Window</span>
              <span className="text-white font-bold">{data.start_time || 'N/A'} - {data.end_time || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted font-medium">Timezone</span>
              <span className="text-white font-bold flex items-center gap-1">
                {data.timezone} <Globe size={14} />
              </span>
            </div>
          </div>
        </div>

        {/* Upcoming Holiday */}
        <div className="bg-gradient-to-br from-green-900/50 to-surface-dark border border-border-green/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full"></div>
          <span className="text-xs font-bold text-primary uppercase tracking-wider mb-2 block">Upcoming Holiday</span>
          <div className="flex items-end justify-between mt-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Eid al-Fitr</h3>
              <p className="text-xs text-text-muted">Approx. 12 days remaining</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

const GeneralInfoTab: React.FC<{ data: any; setData: (d: any) => void }> = ({ data, setData }) => (
  <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-8">
    <h2 className="text-xl font-bold text-white mb-6">School Information</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-text-muted">School Name</label>
          <input 
            type="text" 
            value={data.name || ''}
            onChange={(e) => setData({ name: e.target.value })}
            className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-text-muted">Contact Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="email" 
              value={data.email || ''}
              onChange={(e) => setData({ email: e.target.value })}
              className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-text-muted">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="text" 
              value={data.phone || ''}
              onChange={(e) => setData({ phone: e.target.value })}
              className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-text-muted">Address</label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="text" 
              value={data.address || ''}
              onChange={(e) => setData({ address: e.target.value })}
              className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const InstructorsTab: React.FC<{ instructors: any[] }> = ({ instructors }) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Instructor Management</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-background-dark rounded-lg font-bold text-sm">
          <Plus size={16} />
          Add Instructor
        </button>
      </div>

      <div className="bg-surface-dark border border-border-green/30 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-background-dark/50 text-xs font-bold text-text-muted uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Instructor</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-green/10">
            {instructors.map((inst, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {inst.first_name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-white">{inst.first_name} {inst.last_name}</div>
                      <div className="text-xs text-text-muted">{inst.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-text-muted capitalize">{inst.role}</td>
                <td className="px-6 py-4 text-sm text-white">{inst.phone || 'N/A'}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-text-muted hover:text-white">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {instructors.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                  No instructors found for this school.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BillingTab: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-8">
      <h2 className="text-xl font-bold text-white mb-6">Current Plan</h2>
      <div className="bg-background-dark/50 p-6 rounded-xl border border-border-green/20 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Professional Plan</h3>
            <p className="text-sm text-text-muted">Billed annually</p>
          </div>
          <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full">Active</span>
        </div>
        <div className="text-3xl font-bold text-white mb-2">$199<span className="text-sm text-text-muted font-normal">/mo</span></div>
        <p className="text-sm text-text-muted">Next billing date: Oct 24, 2024</p>
      </div>
      <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors">
        Upgrade Plan
      </button>
    </div>

    <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-8">
      <h2 className="text-xl font-bold text-white mb-6">Payment Method</h2>
      <div className="flex items-center gap-4 p-4 border border-border-green/20 rounded-xl mb-6">
        <div className="p-3 bg-white/5 rounded-lg">
          <CreditCard size={24} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-white">Visa ending in 4242</p>
          <p className="text-sm text-text-muted">Expiry 12/25</p>
        </div>
      </div>
      <button className="text-sm font-bold text-primary hover:text-white transition-colors">
        + Add New Payment Method
      </button>
    </div>
  </div>
);
