import React from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  BookOpen, 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  MoreVertical, 
  Mail, 
  FileText, 
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Flag
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export const StudentProfile: React.FC = () => {
  const navigate = useNavigate();

  // Mock Data
  const student = {
    name: 'Ahmed Ali',
    id: '12345',
    class: 'Hifz A',
    level: 'Level 3',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
    stats: {
      juzs: { current: 15, total: 30 },
      completion: 50,
      attendance: { value: 92, trend: '+2%' }
    }
  };

  const activityLog = [
    {
      id: 1,
      type: 'completed',
      title: 'Completed Surah Al-Mulk',
      time: 'Today, 10:30 AM',
      meta: 'Score: Excellent',
      icon: CheckCircle2,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      id: 2,
      type: 'revised',
      title: 'Revised Juz 29',
      time: 'Yesterday, 4:00 PM',
      meta: '"Needs more focus on Tajweed rules in verses 10-20"',
      icon: Clock,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10'
    },
    {
      id: 3,
      type: 'attendance',
      title: 'Attendance: Present',
      time: 'Oct 24, 2023',
      meta: '',
      icon: Calendar,
      color: 'text-text-muted',
      bg: 'bg-white/5'
    },
    {
      id: 4,
      type: 'flagged',
      title: 'Flagged: Missed Homework',
      time: 'Oct 23, 2023',
      meta: 'Surah Al-Qalam was not recited.',
      icon: AlertCircle,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10'
    },
    {
      id: 5,
      type: 'milestone',
      title: 'Completed Juz 28',
      time: 'Oct 20, 2023',
      meta: 'Milestone Reached! 🏆',
      icon: Flag,
      color: 'text-primary',
      bg: 'bg-primary/10'
    }
  ];

  const velocityData = [
    { week: 'W1', pages: 8 },
    { week: 'W2', pages: 14 },
    { week: 'W3', pages: 20 },
    { week: 'W4', pages: 12 },
    { week: 'W5', pages: 6 },
    { week: 'W6', pages: 16 },
    { week: 'W7', pages: 18 },
    { week: 'W8', pages: 22 },
  ];

  // Mock Surah Mastery Data (114 Surahs)
  // 1=Memorized, 2=Revision, 0=Not Started
  const masteryData = Array.from({ length: 114 }, (_, i) => {
    if (i < 40) return 1; // First 40 memorized
    if (i < 55) return 2; // Next 15 needs revision
    return 0; // Rest not started
  });

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      {/* Back Navigation */}
      <button 
        onClick={() => navigate('/students')}
        className="flex items-center gap-2 text-text-muted hover:text-white transition-colors w-fit"
      >
        <ArrowLeft size={20} />
        <span>Back to Students</span>
      </button>

      {/* Header Card */}
      <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-6 lg:p-8 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full border-2 border-primary p-1">
                <img 
                  src={student.avatar} 
                  alt={student.name} 
                  className="w-full h-full rounded-full object-cover bg-background-dark"
                />
              </div>
              <div className="absolute bottom-0 right-0 bg-primary text-background-dark p-1.5 rounded-full border-4 border-surface-dark">
                <CheckCircle2 size={16} strokeWidth={3} />
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-white">{student.name}</h1>
              <div className="flex items-center gap-3 text-text-muted text-sm font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-border-green"></span>
                  ID: {student.id}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-border-green"></span>
                  Class: {student.class}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                  {student.level}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="flex flex-col items-center bg-background-dark/50 rounded-xl p-3 px-6 border border-border-green/20">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Juzs</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">{student.stats.juzs.current}</span>
                <span className="text-sm text-text-muted">/{student.stats.juzs.total}</span>
              </div>
            </div>
            <div className="flex flex-col items-center bg-background-dark/50 rounded-xl p-3 px-6 border border-border-green/20">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Completion</span>
              <span className="text-2xl font-bold text-primary">{student.stats.completion}%</span>
            </div>
            <div className="flex flex-col items-center bg-background-dark/50 rounded-xl p-3 px-6 border border-border-green/20">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Attendance</span>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold text-white">{student.stats.attendance.value}%</span>
                <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  {student.stats.attendance.trend}
                </span>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-8 pt-8 border-t border-border-green/20 flex flex-wrap gap-3">
          <button 
            onClick={() => navigate('/sessions/daily')}
            className="flex items-center gap-2 bg-primary text-background-dark font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
          >
            <PlusCircle size={18} />
            <span>Log Progress</span>
          </button>
          <button className="flex items-center gap-2 bg-surface-dark border border-border-green/30 text-white font-medium px-5 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
            <FileText size={18} />
            <span>Add Note</span>
          </button>
          <button className="flex items-center gap-2 bg-surface-dark border border-border-green/30 text-white font-medium px-5 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
            <TrendingUp size={18} />
            <span>Report</span>
          </button>
          <button className="ml-auto flex items-center gap-2 text-text-muted hover:text-white transition-colors px-3 py-2">
            <Mail size={18} />
            <span>Contact Parent</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Surah Mastery */}
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <BookOpen className="text-primary" size={24} />
                <div>
                  <h3 className="text-lg font-bold text-white">Surah Mastery</h3>
                  <p className="text-text-muted text-sm">Detailed breakdown of memorized chapters</p>
                </div>
              </div>
              <div className="flex gap-4 text-xs font-medium">
                <div className="flex items-center gap-2 text-white">
                  <div className="w-3 h-3 rounded bg-primary"></div>
                  <span>Memorized</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <div className="w-3 h-3 rounded bg-yellow-500"></div>
                  <span>Needs Revision</span>
                </div>
                <div className="flex items-center gap-2 text-text-muted">
                  <div className="w-3 h-3 rounded bg-white/10"></div>
                  <span>Not Started</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {masteryData.map((status, idx) => (
                <div 
                  key={idx}
                  title={`Surah ${idx + 1}`}
                  className={`
                    w-4 h-8 rounded-sm transition-all duration-300 hover:scale-110 cursor-help
                    ${status === 1 ? 'bg-primary shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 
                      status === 2 ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]' : 
                      'bg-white/10 hover:bg-white/20'}
                  `}
                />
              ))}
            </div>
            <p className="text-center text-xs text-text-muted mt-4 font-medium">
              Hover over a block to view Surah details
            </p>
          </div>

          {/* Memorization Velocity */}
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-primary" size={24} />
                <div>
                  <h3 className="text-lg font-bold text-white">Memorization Velocity</h3>
                  <p className="text-text-muted text-sm">Pages memorized per week (Last 8 weeks)</p>
                </div>
              </div>
              <span className="bg-background-dark border border-border-green/30 text-white px-3 py-1 rounded-lg text-xs font-bold">
                Last 8 Weeks
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocityData}>
                  <XAxis 
                    dataKey="week" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 12 }} 
                    dy={10}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ 
                      backgroundColor: '#1E1E1E', 
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="pages" radius={[4, 4, 0, 0]} maxBarSize={50}>
                    {velocityData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === velocityData.length - 1 ? '#10B981' : 'rgba(16, 185, 129, 0.4)'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Column (1/3) */}
        <div className="flex flex-col gap-6">
          
          {/* Activity Log */}
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-6 h-fit">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="text-primary" size={24} />
              <h3 className="text-lg font-bold text-white">Activity Log</h3>
            </div>
            
            <div className="relative pl-4 border-l border-border-green/20 space-y-8">
              {activityLog.map((log) => (
                <div key={log.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-surface-dark ${log.type === 'milestone' ? 'bg-yellow-500' : 'bg-primary'}`}></div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-text-muted">{log.time}</span>
                    <h4 className="text-white font-bold text-sm group-hover:text-primary transition-colors">{log.title}</h4>
                    {log.meta && (
                      <div className={`mt-1 text-xs font-medium px-2 py-1 rounded w-fit ${
                        log.type === 'completed' ? 'bg-primary/20 text-primary' :
                        log.type === 'flagged' ? 'bg-orange-400/10 text-orange-400' :
                        log.type === 'milestone' ? 'bg-yellow-500/10 text-yellow-500' :
                        'text-text-muted italic'
                      }`}>
                        {log.meta}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Goals & Notes */}
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="text-primary" size={24} />
              <h3 className="text-lg font-bold text-white">Goals & Notes</h3>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-yellow-500 shrink-0" size={20} />
                <div>
                  <h4 className="text-yellow-500 font-bold text-sm mb-1">Focus Area</h4>
                  <p className="text-text-muted text-xs leading-relaxed">
                    Surah Al-Waqi'ah needs immediate revision. Student is struggling with similar verses (Mutashabihat).
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-white font-bold">Next Target:</span>
              <span className="text-primary font-bold">Finish Juz 16 by Friday</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
