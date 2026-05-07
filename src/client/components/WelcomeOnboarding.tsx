import React from 'react';
import { UserPlus, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';

interface WelcomeOnboardingProps {
  userName: string;
}

export const WelcomeOnboarding: React.FC<WelcomeOnboardingProps> = ({ userName }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-surface-dark border border-border-green/30 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Visual Header */}
        <div className="relative h-48 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
              <Sparkles size={48} />
            </div>
            <div className="absolute -top-2 -right-2 p-2 rounded-full bg-primary text-background-dark shadow-lg animate-bounce">
              <UserPlus size={20} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 text-center flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Welcome, {userName}!
            </h1>
            <p className="text-text-muted text-lg leading-relaxed">
              We're excited to help you manage your Tahfiz school. Let's get started by adding your first student.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => navigate('/students/enrollment?mode=onboarding')}
              className="group w-full py-4 bg-primary hover:bg-primary-hover text-background-dark font-bold rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 text-lg"
            >
              Add Your First Student
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            <p className="text-sm text-text-muted/60 italic">
              It only takes a minute to set up a student profile.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-background-dark/50 border-t border-border-green/10 flex justify-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <div className="w-2 h-2 rounded-full bg-border-green/30"></div>
            <div className="w-2 h-2 rounded-full bg-border-green/30"></div>
            <span className="text-xs font-medium text-text-muted ml-2">Step 1 of 3</span>
          </div>
        </div>
      </div>
    </div>
  );
};
