import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Eye, 
  PenTool, 
  ChevronDown,
  Filter,
  Loader2,
  Trash2,
  AlertCircle,
  Edit2
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { Tooltip } from '../../components/Tooltip';
import { EditStudentModal } from '../../components/EditStudentModal';
import { apiFetch } from '../../utils/api';

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  student_identifier: string;
  role: string;
  currentLevel?: {
    juz: number;
    surah: string;
  };
  progress?: {
    percentage: number;
    status: string;
    statusColor: string;
    barColor: string;
  };
  lastSession?: {
    time: string;
    detail: string;
  };
}

export const Students: React.FC = () => {
  const navigate = useNavigate();
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  const fetchStudents = useCallback(async (query: string = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const url = query 
        ? `/api/users/students/search?query=${encodeURIComponent(query)}`
        : '/api/users/students';
      
      const response = await apiFetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const result = await response.json();
      
      // The backend returns { success: true, data: { students: [], ... } }
      const results = result.data?.students || result.data?.users || result.students || result.users || [];
      
      // Transform backend data to include UI-specific progress info if missing
      const transformedStudents = results.map((s: any) => ({
        ...s,
        // Default values for fields that might not be in the basic user object yet
        currentLevel: s.currentLevel || { juz: 30, surah: 'Amma' },
        progress: s.progress || { 
          percentage: 0, 
          status: 'New', 
          statusColor: 'text-text-muted',
          barColor: 'bg-text-muted'
        },
        lastSession: s.lastSession || { time: 'No sessions yet', detail: '-' }
      }));

      setStudentsList(transformedStudents);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching students:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchStudents]);

  const filteredStudents = studentsList.filter(student => {
    if (filterStatus === 'All') return true;
    if (filterStatus === 'Active') return student.progress && student.progress.percentage > 0;
    if (filterStatus === 'Needs Attention') return student.progress && student.progress.percentage < 20;
    return true;
  });

  const activeCount = studentsList.filter(s => s.progress && s.progress.percentage > 0).length;
  const needsAttentionCount = studentsList.filter(s => s.progress && s.progress.percentage < 20).length;

  const handleDeleteStudent = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/students/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setStudentsList(prev => prev.filter(s => s.id !== id));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete student');
      }
    } catch (err) {
      console.error('Error deleting student:', err);
      alert('An error occurred while deleting the student');
    }
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">Student Roster</h1>
          <p className="text-sm md:text-base text-text-muted">Manage enrollment and track memorization progress.</p>
        </div>
        <button 
          onClick={() => navigate('/students/enrollment')}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-background-dark px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 w-full md:w-auto"
        >
          <Plus size={20} />
          Add New Student
        </button>
      </div>

      {/* Filters & Search Section */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 md:gap-6">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, or email..." 
              className="w-full bg-surface-dark border border-border-green/30 rounded-xl py-2.5 pl-11 pr-4 text-sm md:text-base text-white placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center bg-surface-dark border border-border-green/30 rounded-xl p-1 w-full md:w-auto overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setFilterStatus('All')}
              className={`px-4 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${filterStatus === 'All' ? 'bg-primary text-background-dark' : 'text-text-muted hover:text-white'}`}
            >
              All <span className="hidden sm:inline">Students</span> <span className="ml-1 opacity-70">{studentsList.length}</span>
            </button>
            <button 
              onClick={() => setFilterStatus('Active')}
              className={`px-4 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${filterStatus === 'Active' ? 'bg-primary text-background-dark' : 'text-text-muted hover:text-white'}`}
            >
              Active <span className="ml-1 opacity-70">{activeCount}</span>
            </button>
            <Tooltip text="Students with < 20% progress" position="bottom">
              <button 
                onClick={() => setFilterStatus('Needs Attention')}
                className={`px-4 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${filterStatus === 'Needs Attention' ? 'bg-primary text-background-dark' : 'text-text-muted hover:text-white'}`}
              >
                Needs Attention <span className="ml-1 opacity-70">{needsAttentionCount}</span>
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500"></div>
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto no-scrollbar pb-1 lg:pb-0">
          <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-surface-dark border border-border-green/30 rounded-xl text-xs md:text-sm font-bold text-text-muted cursor-pointer hover:border-primary/30 transition-colors whitespace-nowrap">
            <span>Level: All</span>
            <ChevronDown size={14} className="md:w-4 md:h-4" />
          </div>
          <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-surface-dark border border-border-green/30 rounded-xl text-xs md:text-sm font-bold text-text-muted cursor-pointer hover:border-primary/30 transition-colors whitespace-nowrap">
            <span>Teacher: All</span>
            <ChevronDown size={14} className="md:w-4 md:h-4" />
          </div>
        </div>
      </div>

      {/* Students List Container */}
      <div className="bg-surface-dark border border-border-green/30 rounded-2xl overflow-hidden min-h-[400px] flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-text-muted">
            <Loader2 size={40} className="animate-spin text-primary" />
            <p className="font-medium">Loading student roster...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-red-400 p-8 text-center">
            <AlertCircle size={40} />
            <div>
              <p className="font-bold text-lg">Failed to load students</p>
              <p className="text-sm opacity-80 mt-1">{error}</p>
            </div>
            <button 
              onClick={() => fetchStudents(searchQuery)}
              className="mt-2 px-6 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-sm font-bold transition-all"
            >
              Try Again
            </button>
          </div>
        ) : studentsList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-text-muted p-8 text-center">
            <div className="p-4 rounded-full bg-white/5">
              <Search size={32} />
            </div>
            <div>
              <p className="font-bold text-lg text-white">No students found</p>
              <p className="text-sm mt-1">
                {searchQuery ? `No results for "${searchQuery}"` : 'Your school doesn\'t have any students enrolled yet.'}
              </p>
            </div>
            {!searchQuery && (
              <button 
                onClick={() => navigate('/students/enrollment')}
                className="mt-2 px-6 py-2 bg-primary text-background-dark rounded-xl text-sm font-bold hover:bg-primary-hover transition-all"
              >
                Enroll First Student
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-green/20">
                    <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Current Level</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Memorization Progress</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Last Session</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-green/10">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-border-green/20 bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {student.first_name[0]}{student.last_name ? student.last_name[0] : ''}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white leading-tight">{student.first_name} {student.last_name || ''}</p>
                            <p className="text-xs text-text-muted mt-0.5">ID: {student.student_identifier || `USR-${student.id}`}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {student.currentLevel && (
                          <div>
                            <p className="text-sm font-bold text-primary">Juz {student.currentLevel.juz}</p>
                            <p className="text-xs text-text-muted mt-0.5">{student.currentLevel.surah}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        {student.progress && (
                          <div className="max-w-[180px]">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-white">{student.progress.percentage}% Memorized</span>
                              <span className={`text-xs font-bold ${student.progress.statusColor}`}>{student.progress.status}</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${student.progress.barColor} transition-all duration-500`} 
                                style={{ width: `${student.progress.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        {student.lastSession && (
                          <div>
                            <p className="text-sm font-bold text-white leading-tight">{student.lastSession.time}</p>
                            <p className="text-xs text-text-muted mt-0.5">{student.lastSession.detail}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Tooltip text="Log Progress">
                            <button 
                              onClick={() => navigate(`/sessions/daily/${student.id}`)}
                              className="p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-all" 
                            >
                              <PenTool size={18} />
                            </button>
                          </Tooltip>
                          <Tooltip text="Edit Student">
                            <button 
                              onClick={() => setEditingStudent(student)}
                              className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-all" 
                            >
                              <Edit2 size={18} />
                            </button>
                          </Tooltip>
                          <Tooltip text="View Details">
                            <button 
                              onClick={() => navigate(`/students/${student.id}`)}
                              className="p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-all" 
                            >
                              <Eye size={18} />
                            </button>
                          </Tooltip>
                          <Tooltip text="Delete Student">
                            <button 
                              onClick={() => handleDeleteStudent(student.id)}
                              className="p-2 text-text-muted hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden flex flex-col divide-y divide-border-green/10">
              {filteredStudents.map((student) => (
                <div key={student.id} className="p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-border-green/20 bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {student.first_name[0]}{student.last_name ? student.last_name[0] : ''}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white leading-tight">{student.first_name} {student.last_name || ''}</p>
                        <p className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wider">ID: {student.student_identifier || `USR-${student.id}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => navigate(`/sessions/daily/${student.id}`)}
                        className="p-2 text-text-muted hover:text-white"
                      >
                        <PenTool size={18} />
                      </button>
                      <button 
                        onClick={() => setEditingStudent(student)}
                        className="p-2 text-text-muted hover:text-primary"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => navigate(`/students/${student.id}`)}
                        className="p-2 text-text-muted hover:text-white"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Level</p>
                      <p className="text-sm font-bold text-primary">Juz {student.currentLevel?.juz}</p>
                      <p className="text-xs text-text-muted">{student.currentLevel?.surah}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Last Session</p>
                      <p className="text-sm font-bold text-white leading-tight">{student.lastSession?.time}</p>
                      <p className="text-xs text-text-muted">{student.lastSession?.detail}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">{student.progress?.percentage}% Memorized</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 ${student.progress?.statusColor}`}>{student.progress?.status}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${student.progress?.barColor} transition-all duration-500`} 
                        style={{ width: `${student.progress?.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination Footer */}
        {!isLoading && !error && filteredStudents.length > 0 && (
          <div className="px-4 md:px-6 py-4 bg-white/[0.02] border-t border-border-green/20 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
            <p className="text-xs md:text-sm text-text-muted">
              Showing <span className="text-white font-medium">1 to {filteredStudents.length}</span> of <span className="text-white font-medium">{filteredStudents.length}</span>
            </p>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold text-text-muted bg-white/5 cursor-not-allowed transition-all">
                Previous
              </button>
              <button className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold text-text-muted bg-white/5 cursor-not-allowed transition-all">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {editingStudent && (
        <EditStudentModal 
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSuccess={(updated) => {
            setStudentsList(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
          }}
        />
      )}

    </div>
  );
};
