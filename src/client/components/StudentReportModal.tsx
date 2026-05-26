import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Loader2, Calendar, BookOpen, Clock, CheckCircle2 } from 'lucide-react';

interface StudentReportModalProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
}

export const StudentReportModal: React.FC<StudentReportModalProps> = ({ studentId, studentName, onClose }) => {
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/reports/student/${studentId}`);
        if (!response.ok) throw new Error('Failed to fetch report data');
        const data = await response.json();
        setReportData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [studentId]);

  const handleDownload = () => {
    window.location.href = `/api/reports/student/${studentId}/download`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-dark border border-border-green/30 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-green/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Student Progress Report</h2>
              <p className="text-text-muted text-sm">{studentName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownload}
              disabled={isLoading || !!error}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-background-dark px-4 py-2 rounded-xl font-bold transition-all disabled:opacity-50"
            >
              <Download size={18} />
              <span>Download CSV</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-text-muted">
              <Loader2 size={40} className="animate-spin text-primary" />
              <p className="mt-4 font-medium">Generating report preview...</p>
            </div>
          ) : error ? (
            <div className="h-64 flex flex-col items-center justify-center text-red-400 gap-3">
              <X size={40} />
              <p className="font-bold">Error loading report</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-background-dark/50 border border-border-green/20 rounded-xl p-4">
                  <span className="text-xs font-bold text-text-muted uppercase block mb-1">Total Sessions</span>
                  <span className="text-2xl font-bold text-white">{reportData.summary.totalSessions}</span>
                </div>
                <div className="bg-background-dark/50 border border-border-green/20 rounded-xl p-4">
                  <span className="text-xs font-bold text-text-muted uppercase block mb-1">Attendance Rate</span>
                  <span className="text-2xl font-bold text-white">{reportData.summary.attendanceRate}%</span>
                </div>
                <div className="bg-background-dark/50 border border-border-green/20 rounded-xl p-4">
                  <span className="text-xs font-bold text-text-muted uppercase block mb-1">Ayahs Memorized</span>
                  <span className="text-2xl font-bold text-white">{reportData.summary.totalAyahsMemorized}</span>
                </div>
                <div className="bg-background-dark/50 border border-border-green/20 rounded-xl p-4">
                  <span className="text-xs font-bold text-text-muted uppercase block mb-1">Completion</span>
                  <span className="text-2xl font-bold text-primary">{reportData.summary.completionPercentage}%</span>
                </div>
              </div>

              {/* Session History */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-primary" />
                  Detailed History
                </h3>

                {/* Desktop Table */}
                <div className="hidden md:block border border-border-green/20 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-background-dark/50">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold text-text-muted uppercase">Date</th>
                        <th className="px-4 py-3 text-xs font-bold text-text-muted uppercase">Attendance</th>
                        <th className="px-4 py-3 text-xs font-bold text-text-muted uppercase">Memorization</th>
                        <th className="px-4 py-3 text-xs font-bold text-text-muted uppercase">Revision</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-green/10">
                      {reportData.sessions.map((session: any, idx: number) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3 text-sm text-white font-medium">{session.date}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                              session.attendance === 'present' ? 'bg-primary/10 text-primary' : 'bg-red-400/10 text-red-400'
                            }`}>
                              {session.attendance}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-text-muted leading-relaxed">
                            {session.memorization || '-'}
                          </td>
                          <td className="px-4 py-3 text-xs text-text-muted leading-relaxed">
                            {session.revision || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {reportData.sessions.map((session: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-background-dark/50 border border-border-green/20 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{session.date}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          session.attendance === 'present' ? 'bg-primary/10 text-primary' : 'bg-red-400/10 text-red-400'
                        }`}>
                          {session.attendance}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">Memorization</span>
                          <span className="text-xs text-text-muted leading-relaxed">
                            {session.memorization || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">Revision</span>
                          <span className="text-xs text-text-muted leading-relaxed">
                            {session.revision || '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
