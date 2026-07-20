import React, { useState } from 'react';
import { X, Sparkles, PenTool } from 'lucide-react';

interface ProgressOnboardingModalProps {
  onClose: (dontShowAgain: boolean) => void;
}

export const ProgressOnboardingModal: React.FC<ProgressOnboardingModalProps> = ({ onClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    onClose(dontShowAgain);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-surface-dark border border-primary/30 rounded-2xl w-full max-w-md flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header with gradient background */}
        <div className="relative h-32 bg-gradient-to-br from-primary/20 to-surface-dark flex items-center justify-center">
          <div className="absolute top-4 right-4">
            <button 
              onClick={handleClose}
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
              onClick={handleClose}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-background-dark py-4 rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
            >
              <PenTool size={18} />
              Got it, let's start!
            </button>
            <button 
              onClick={handleClose}
              className="w-full py-3 text-text-muted hover:text-white font-medium transition-colors"
            >
              Maybe later
            </button>
          </div>

          {/* Don't show again checkbox */}
          <label className="flex items-center justify-center gap-2 mt-4 cursor-pointer group">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-border-green/40 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-text-muted text-sm group-hover:text-white transition-colors select-none">
              Don't show this again
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};
