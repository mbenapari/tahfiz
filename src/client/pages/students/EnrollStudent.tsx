import React from 'react';
import { 
  UserPlus, 
  Search, 
  X, 
  Calendar, 
  ChevronDown, 
  CheckCircle2,
  Users,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router';

export const EnrollStudent: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm">
        <Link to="/" className="text-text-muted hover:text-white transition-colors">Home</Link>
        <span className="text-text-muted">/</span>
        <Link to="/students" className="text-text-muted hover:text-white transition-colors">Students</Link>
        <span className="text-text-muted">/</span>
        <span className="text-primary font-medium">Enrollment</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Enroll New Student</h1>
        <p className="text-text-muted">Add a student to the current academic session and set their initial status.</p>
      </div>

      {/* Form Container */}
      <div className="bg-surface-dark border border-border-green/30 rounded-2xl overflow-hidden">
        
        <div className="p-8 flex flex-col gap-10">
          
          {/* Section 1: Student Identity */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Users size={20} />
                </div>
                <h2 className="text-lg font-bold text-white">Student Identity</h2>
              </div>
              <button className="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                + Create New User
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Search Student */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-muted">Search Student</label>
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input 
                    type="text" 
                    placeholder="Search by name or email..." 
                    className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <p className="text-xs text-text-muted/60 mt-1">Search for an existing user account to enroll.</p>
              </div>

              {/* Selected User Display */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-muted">Selected User</label>
                <div className="flex items-center justify-between p-3 bg-background-dark/30 border border-border-green/30 rounded-xl group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-border-green/20">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed" alt="Ahmed Hassan" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">Ahmed Hassan</p>
                      <p className="text-xs text-text-muted">ahmed.hassan@example.com</p>
                    </div>
                  </div>
                  <button className="p-1.5 text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-all">
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Enrollment Details */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Calendar size={20} />
              </div>
              <h2 className="text-lg font-bold text-white">Enrollment Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Enrolled On */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-muted">Enrolled On</label>
                <div className="relative">
                  <input 
                    type="text" 
                    defaultValue="10/24/2023"
                    className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" />
                </div>
              </div>

              {/* Initial Status */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-muted">Initial Status</label>
                <div className="relative">
                  <div className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 px-4 text-white flex items-center justify-between cursor-pointer hover:border-primary/30 transition-colors">
                    <span>Active</span>
                    <ChevronDown size={18} className="text-text-muted" />
                  </div>
                </div>
                <div className="flex">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Notes & Hifz Goals */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <MessageSquare size={20} />
              </div>
              <h2 className="text-lg font-bold text-white">Notes & Hifz Goals</h2>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-muted">Additional Information</label>
              <textarea 
                placeholder="Enter any initial notes about the student's memorization level, goals, or specific requirements..." 
                className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl p-4 text-white placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors min-h-[120px] resize-none"
              ></textarea>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-background-dark/30 border-t border-border-green/20 flex justify-end items-center gap-4">
          <button className="px-6 py-2.5 rounded-xl text-sm font-bold text-text-muted hover:text-white hover:bg-white/5 transition-all">
            Cancel
          </button>
          <button className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-background-dark rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20">
            <CheckCircle2 size={18} />
            Confirm Enrollment
          </button>
        </div>

      </div>

    </div>
  );
};
