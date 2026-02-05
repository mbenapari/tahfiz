import React, { useState } from 'react';
import { 
  BookOpen, 
  RotateCcw, 
  Star, 
  PenTool, 
  Calendar, 
  ChevronDown, 
  CheckCircle2,
  X,
  ArrowLeft,
  History
} from 'lucide-react';
import { useNavigate } from 'react-router';

export const DailySession: React.FC = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(3);
  const [revisionTab, setRevisionTab] = useState<'page' | 'surah'>('page');

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/20 p-1 bg-surface-dark">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Zayd" 
              alt="Zayd Al-Harith" 
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Zayd Al-Harith</h1>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                Hifz Level: Juz 3
              </span>
              <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                <History size={14} />
                View History
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Session Date</span>
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-dark border border-border-green/30 rounded-xl text-white font-bold">
            <Calendar size={18} className="text-text-muted" />
            <span>Oct 24, 2023</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Hifz & Grading */}
        <div className="flex flex-col gap-6">
          
          {/* New Lesson (Hifz) */}
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <BookOpen size={24} />
              </div>
              <h2 className="text-xl font-bold text-white">New Lesson (Hifz)</h2>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-muted">Surah</label>
                <div className="relative">
                  <div className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3.5 px-4 text-white flex items-center justify-between cursor-pointer hover:border-primary/30 transition-colors">
                    <span className="font-medium">004. An-Nisa</span>
                    <ChevronDown size={20} className="text-text-muted" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-text-muted">Start Ayah</label>
                  <input 
                    type="text" 
                    defaultValue="12"
                    className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3.5 px-4 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-text-muted">End Ayah</label>
                  <input 
                    type="text" 
                    placeholder="--"
                    className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3.5 px-4 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-muted/30"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 p-4 bg-background-dark/30 border border-border-green/20 rounded-xl cursor-pointer hover:bg-background-dark/50 transition-colors group">
                <div className="relative flex items-center">
                  <input type="checkbox" className="peer appearance-none w-6 h-6 border-2 border-border-green/30 rounded-lg checked:bg-primary checked:border-primary transition-all cursor-pointer" />
                  <CheckCircle2 size={16} className="absolute left-1 top-1 text-background-dark opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                </div>
                <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">Student completed Surah An-Nisa?</span>
              </label>
            </div>
          </div>

          {/* Grading & Notes */}
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <PenTool size={24} />
                </div>
                <h2 className="text-xl font-bold text-white">Grading & Notes</h2>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-text-muted">Performance Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star}
                      onClick={() => setRating(star)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        rating === star 
                          ? 'bg-primary/20 text-primary border-2 border-primary ring-4 ring-primary/10' 
                          : 'bg-background-dark/50 text-text-muted border border-border-green/30 hover:bg-background-dark hover:text-white'
                      }`}
                    >
                      <Star size={24} fill={rating >= star ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-bold text-orange-400 mt-1">Average Performance</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-muted">Instructor Notes</label>
                <textarea 
                  placeholder="Enter specific feedback..." 
                  className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl p-4 text-white placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-colors min-h-[100px] resize-none font-medium"
                ></textarea>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Revision */}
        <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-8 flex flex-col gap-6 h-full">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <RotateCcw size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Revision (Muraja'ah)</h2>
          </div>

          {/* Tabs */}
          <div className="flex bg-background-dark/50 p-1 rounded-xl border border-border-green/20">
            <button 
              onClick={() => setRevisionTab('page')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                revisionTab === 'page' 
                  ? 'bg-surface-dark text-white shadow-sm border border-border-green/30' 
                  : 'text-text-muted hover:text-white'
              }`}
            >
              By Page
            </button>
            <button 
              onClick={() => setRevisionTab('surah')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                revisionTab === 'surah' 
                  ? 'bg-surface-dark text-white shadow-sm border border-border-green/30' 
                  : 'text-text-muted hover:text-white'
              }`}
            >
              By Surah
            </button>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-text-muted">Recent Weak Spots</label>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-xs font-bold text-red-400">
                  Surah Al-Baqarah (280-286)
                  <Plus size={14} className="cursor-pointer" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-xs font-bold text-red-400">
                  Surah Al-Fatiha
                  <Plus size={14} className="cursor-pointer" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-muted">Start Page</label>
                <input 
                  type="text" 
                  defaultValue="42"
                  className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3.5 px-4 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-muted">End Page</label>
                <input 
                  type="text" 
                  defaultValue="52"
                  className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3.5 px-4 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            {/* Progress Section */}
            <div className="bg-background-dark/30 border border-border-green/20 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">Total Revision</span>
                <span className="text-sm font-bold text-white">10 Pages</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-blue-500 rounded-full transition-all duration-500"></div>
              </div>
              <p className="text-xs font-medium text-text-muted">Target: 20 pages/day</p>
            </div>

            <label className="flex items-center gap-3 p-4 bg-background-dark/30 border border-border-green/20 rounded-xl cursor-pointer hover:bg-background-dark/50 transition-colors group">
              <div className="relative flex items-center">
                <input type="checkbox" className="peer appearance-none w-6 h-6 border-2 border-border-green/30 rounded-lg checked:bg-primary checked:border-primary transition-all cursor-pointer" />
                <CheckCircle2 size={16} className="absolute left-1 top-1 text-background-dark opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
              </div>
              <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">Completed Revision of Juz 2?</span>
            </label>
          </div>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between py-6 border-t border-border-green/20">
        <button className="text-sm font-bold text-text-muted hover:text-white transition-colors">
          Reset Form
        </button>
        <div className="flex items-center gap-4">
          <button className="px-8 py-3.5 rounded-xl text-sm font-bold text-white border border-border-green/30 hover:bg-white/5 transition-all">
            Save as Draft
          </button>
          <button className="px-8 py-3.5 bg-primary hover:bg-primary-hover text-background-dark rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20">
            <CheckCircle2 size={20} />
            Save & Next Student
          </button>
        </div>
      </div>

    </div>
  );
};

const Plus: React.FC<{ size?: number, className?: string }> = ({ size = 16, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
