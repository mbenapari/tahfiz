import React from 'react';
import { X, Sparkles, PenTool } from 'lucide-react';

interface ProgressOnboardingModalProps {
  onClose: () => void;
}

export const ProgressOnboardingModal: React.FC<ProgressOnboardingModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-surface-dark border border-primary/30 rounded-2xl w-full max-w-md flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header with gradient background */}
        <div className="relative h-32 bg-gradient-to-br from-primary/20 to-surface-dark flex items-center justify-center">
          <div className="absolute top-4 right-4">
            <button 
              onClick={onClose}
              className="p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary animate-pulse">
            <Sparkles size={32} />
          </div>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to track progress?</h2>
          <p className="text-text-muted mb-8 leading-relaxed">
            Start tracking your student's memorization journey today. 
            Logging daily sessions helps monitor progress and keeps parents informed.
          </p>

          <div className="flex flex-col gap-3">
            <button 
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-background-dark py-4 rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
            >
              <PenTool size={18} />
              Got it, let's start!
            </button>
            <button 
              onClick={onClose}
              className="w-full py-3 text-text-muted hover:text-white font-medium transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
