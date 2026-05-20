import React, { useState, useEffect } from 'react';
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
  Flag,
  Loader2
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

import { Tooltip } from '../../components/Tooltip';
import { StudentReportModal } from '../../components/StudentReportModal';
import { ContactParentModal } from '../../components/ContactParentModal';
import { EditStudentModal } from '../../components/EditStudentModal';
import { apiFetch } from '../../utils/api';

const ICON_MAP: Record<string, any> = {
  'CheckCircle2': CheckCircle2,
  'Clock': Clock,
  'Calendar': Calendar,
  'AlertCircle': AlertCircle,
  'Flag': Flag
};

export const StudentProfile: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [studentData, setStudentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchStudentProfile = async () => {
      setIsLoading(true);
      try {
        const response = await apiFetch(`/api/users/students/${id}`);
        if (!response.ok) throw new Error('Failed to fetch student profile');
        const result = await response.json();
        setStudentData(result.data?.student || result.student);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching student profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchStudentProfile();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-text-muted">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="font-medium mt-4">Loading student profile...</p>
      </div>
    );
  }

  if (error || !studentData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-red-400 p-8 text-center">
        <AlertCircle size={40} />
        <p className="font-bold text-lg mt-4">Failed to load student profile</p>
        <p className="text-sm opacity-80 mt-1">{error || 'Student not found'}</p>
        <button 
          onClick={() => navigate('/students')}
          className="mt-6 px-6 py-2 bg-primary text-background-dark rounded-xl text-sm font-bold hover:bg-primary-hover transition-all"
        >
          Back to Students
        </button>
      </div>
    );
  }

  const { stats, activityLog, masteryData, velocityData } = studentData;
  const student = {
    name: `${studentData.first_name} ${studentData.last_name || ''}`,
    id: studentData.student_identifier || `USR-${studentData.id}`,
    class: studentData.tenant?.name || 'Unassigned',
    level: studentData.stats.completion > 80 ? 'Expert' : studentData.stats.completion > 50 ? 'Advanced' : 'Beginner',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentData.first_name}`,
    stats: studentData.stats
  };

  // Fallback velocity data if empty
  const displayVelocityData = velocityData && velocityData.length > 0 ? velocityData : [
    { week: 'W1', pages: 0 },
    { week: 'W2', pages: 0 },
    { week: 'W3', pages: 0 },
    { week: 'W4', pages: 0 },
    { week: 'W5', pages: 0 },
    { week: 'W6', pages: 0 },
    { week: 'W7', pages: 0 },
    { week: 'W8', pages: 0 },
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 max-w-7xl mx-auto overflow-hidden">
      {/* Back Navigation */}
      <button 
        onClick={() => navigate('/students')}
        className="flex items-center gap-2 text-text-muted hover:text-white transition-colors w-fit text-sm sm:text-base"
      >
        <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
        <span>Back to Students</span>
      </button>

      {/* Header Card */}
      <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-5 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full border-2 border-primary p-1">
                <img 
                  src={student.avatar} 
                  alt={student.name} 
                  className="w-full h-full rounded-full object-cover bg-background-dark"
                />
              </div>
              <div className="absolute bottom-0 right-0 bg-primary text-background-dark p-1 rounded-full border-2 sm:border-4 border-surface-dark">
                <CheckCircle2 size={12} className="sm:w-4 sm:h-4" strokeWidth={3} />
              </div>
            </div>
            
            <div className="flex flex-col gap-1 min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold text-white truncate">{student.name}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-text-muted text-[10px] sm:text-sm font-medium">
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-border-green"></span>
                  ID: {student.id}
                </span>
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-border-green"></span>
                  {student.class}
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
                  {student.level}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 lg:flex items-center gap-2 sm:gap-4 w-full lg:w-auto">
            <div className="flex flex-col items-center bg-background-dark/50 rounded-xl p-2 sm:p-3 sm:px-6 border border-border-green/20">
              <span className="text-[8px] sm:text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Juzs</span>
              <div className="flex items-baseline gap-0.5 sm:gap-1">
                <span className="text-base sm:text-2xl font-bold text-white">{student.stats.juzs.current}</span>
                <span className="text-[10px] sm:text-sm text-text-muted">/{student.stats.juzs.total}</span>
              </div>
            </div>
            <div className="flex flex-col items-center bg-background-dark/50 rounded-xl p-2 sm:p-3 sm:px-6 border border-border-green/20">
              <span className="text-[8px] sm:text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Done</span>
              <span className="text-base sm:text-2xl font-bold text-primary">{student.stats.completion}%</span>
            </div>
            <div className="flex flex-col items-center bg-background-dark/50 rounded-xl p-2 sm:p-3 sm:px-6 border border-border-green/20">
              <span className="text-[8px] sm:text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Attend.</span>
              <div className="flex items-center gap-1">
                <span className="text-base sm:text-2xl font-bold text-white">{student.stats.attendance.value}%</span>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border-green/20 flex flex-wrap gap-2 sm:gap-3">
          <button 
            onClick={() => navigate(`/sessions/daily/${studentData.id}`)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-background-dark font-bold px-4 sm:px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm"
          >
            <PlusCircle size={18} />
            <span>Log Progress</span>
          </button>
          <button 
            onClick={() => setIsReportModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-surface-dark border border-border-green/30 text-white font-medium px-4 sm:px-5 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-sm"
          >
            <TrendingUp size={18} />
            <span>Report</span>
          </button>
          <button 
            onClick={() => setIsContactModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-text-muted hover:text-white transition-colors px-3 py-2 text-sm sm:ml-auto"
          >
            <Mail size={18} />
            <span>Contact Parent</span>
          </button>
        </div>
      </div>

      {isReportModalOpen && id && (
        <StudentReportModal 
          studentId={id} 
          studentName={`${studentData.first_name} ${studentData.last_name || ''}`}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

      {isContactModalOpen && (
        <ContactParentModal 
          studentName={`${studentData.first_name} ${studentData.last_name || ''}`}
          email={studentData.email}
          phone={studentData.phone}
          onClose={() => setIsContactModalOpen(false)}
          onEdit={() => {
            setIsContactModalOpen(false);
            setIsEditModalOpen(true);
          }}
        />
      )}

      {isEditModalOpen && (
        <EditStudentModal 
          student={studentData}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={(updated) => {
            setStudentData(updated);
            setIsEditModalOpen(false);
          }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-6">
          
          {/* Surah Mastery */}
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <BookOpen className="text-primary" size={24} />
                <div>
                  <h3 className="text-lg font-bold text-white">Surah Mastery</h3>
                  <p className="text-text-muted text-xs sm:text-sm">Detailed breakdown of memorized chapters</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 sm:gap-4 text-[10px] sm:text-xs font-medium">
                <div className="flex items-center gap-1.5 text-white">
                  <div className="w-2.5 h-2.5 rounded bg-primary"></div>
                  <span>Memorized</span>
                </div>
                <div className="flex items-center gap-1.5 text-white">
                  <div className="w-2.5 h-2.5 rounded bg-yellow-500"></div>
                  <span>Revision</span>
                </div>
                <div className="flex items-center gap-1.5 text-text-muted">
                  <div className="w-2.5 h-2.5 rounded bg-white/10"></div>
                  <span>Not Started</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {masteryData.map((surah: any, idx: number) => (
                <Tooltip 
                  key={idx} 
                  text={`${surah.number}. ${surah.name}: ${surah.details}`}
                  position="top"
                >
                  <div 
                    className={`
                      w-3.5 h-7 sm:w-4 sm:h-8 rounded-sm transition-all duration-300 hover:scale-110 cursor-pointer
                      ${surah.status === 1 ? 'bg-primary shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 
                        surah.status === 2 ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]' : 
                        'bg-white/10 hover:bg-white/20'}
                    `}
                  />
                </Tooltip>
              ))}
            </div>
            <p className="text-center text-[10px] sm:text-xs text-text-muted mt-6 font-medium">
              Tap or hover over a block to view details
            </p>
          </div>

          {/* Memorization Velocity */}
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-primary" size={24} />
                <div>
                  <h3 className="text-lg font-bold text-white">Memorization Velocity</h3>
                  <p className="text-text-muted text-xs sm:text-sm">Pages memorized per week</p>
                </div>
              </div>
              <span className="w-fit bg-background-dark border border-border-green/30 text-white px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold">
                Last 8 Weeks
              </span>
            </div>

            <div className="h-48 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayVelocityData}>
                  <XAxis 
                    dataKey="week" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 10 }} 
                    dy={10}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ 
                      backgroundColor: '#1E1E1E', 
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="pages" radius={[3, 3, 0, 0]} maxBarSize={40}>
                    {displayVelocityData.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === displayVelocityData.length - 1 ? '#10B981' : 'rgba(16, 185, 129, 0.4)'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Column (1/3) */}
        <div className="flex flex-col gap-4 sm:gap-6">
          
          {/* Activity Log */}
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-5 sm:p-6 h-fit">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="text-primary" size={24} />
              <h3 className="text-lg font-bold text-white">Activity Log</h3>
            </div>
            
            <div className="relative pl-4 border-l border-border-green/20 space-y-6 sm:space-y-8">
              {activityLog.map((log: any) => {
                const Icon = ICON_MAP[log.icon] || CheckCircle2;
                return (
                  <div key={log.id} className="relative group">
                    {/* Timeline Dot */}
                    <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-surface-dark ${log.type === 'milestone' ? 'bg-yellow-500' : 'bg-primary'}`}></div>
                    
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-text-muted">{log.time}</span>
                      <h4 className="text-white font-bold text-xs sm:text-sm group-hover:text-primary transition-colors">{log.title}</h4>
                      {log.meta && (
                        <div className={`mt-1 text-[10px] font-medium px-2 py-0.5 rounded w-fit ${
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
                );
              })}
              {activityLog.length === 0 && (
                <div className="text-text-muted text-xs sm:text-sm italic">No recent activity recorded.</div>
              )}
            </div>
          </div>

          {/* Goals & Notes */}
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="text-primary" size={24} />
              <h3 className="text-lg font-bold text-white">Goals & Notes</h3>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 sm:p-4 mb-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertTriangle className="text-yellow-500 shrink-0 sm:w-5 sm:h-5" size={18} />
                <div>
                  <h4 className="text-yellow-500 font-bold text-[10px] sm:text-sm mb-1 uppercase tracking-wider">Focus Area</h4>
                  <p className="text-text-muted text-[10px] sm:text-xs leading-relaxed">
                    {studentData.notes || 'No specific focus areas noted yet.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-white font-bold">Next Target:</span>
              <span className="text-primary font-bold">Keep progressing!</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
