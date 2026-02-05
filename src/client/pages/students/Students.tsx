import React from 'react';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Eye, 
  PenTool, 
  ChevronDown,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router';

interface Student {
  id: string;
  name: string;
  studentId: string;
  avatar: string;
  currentLevel: {
    juz: number;
    surah: string;
  };
  progress: {
    percentage: number;
    status: string;
    statusColor: string;
    barColor: string;
  };
  lastSession: {
    time: string;
    detail: string;
  };
}

const students: Student[] = [
  {
    id: '1',
    name: 'Ahmed Al-Farsi',
    studentId: '2024-089',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
    currentLevel: { juz: 29, surah: 'Tabarak' },
    progress: { 
      percentage: 80, 
      status: 'Great', 
      statusColor: 'text-primary',
      barColor: 'bg-primary'
    },
    lastSession: { time: 'Today, 10:00 AM', detail: 'Surah Al-Mulk, Ayah 1-15' }
  },
  {
    id: '2',
    name: 'Fatima Hassan',
    studentId: '2024-092',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima',
    currentLevel: { juz: 30, surah: 'Amma' },
    progress: { 
      percentage: 45, 
      status: 'Steady', 
      statusColor: 'text-blue-400',
      barColor: 'bg-blue-400'
    },
    lastSession: { time: 'Yesterday, 4:00 PM', detail: 'Surah An-Naba' }
  },
  {
    id: '3',
    name: 'Omar Yaseen',
    studentId: '2024-105',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Omar',
    currentLevel: { juz: 1, surah: 'Al-Baqarah' },
    progress: { 
      percentage: 15, 
      status: 'Needs Review', 
      statusColor: 'text-orange-400',
      barColor: 'bg-orange-400'
    },
    lastSession: { time: 'Oct 24, 2:30 PM', detail: 'Correction Session' }
  },
  {
    id: '4',
    name: 'Layla Karim',
    studentId: '2024-112',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Layla',
    currentLevel: { juz: 28, surah: 'Al-Mujadila' },
    progress: { 
      percentage: 95, 
      status: 'Excellent', 
      statusColor: 'text-primary',
      barColor: 'bg-primary'
    },
    lastSession: { time: 'Oct 23, 11:00 AM', detail: 'Revision Complete' }
  },
  {
    id: '5',
    name: 'Khalid Ibn Walid',
    studentId: '2024-045',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Khalid',
    currentLevel: { juz: 5, surah: 'An-Nisa' },
    progress: { 
      percentage: 60, 
      status: 'On Track', 
      statusColor: 'text-text-muted',
      barColor: 'bg-text-muted'
    },
    lastSession: { time: 'Oct 22, 9:15 AM', detail: 'Ayah 24-30' }
  }
];

export const Students: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-8">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Student Roster</h1>
          <p className="text-text-muted">Manage enrollment and track memorization progress.</p>
        </div>
        <button 
          onClick={() => navigate('/students/enrollment')}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-background-dark px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={20} />
          Add New Student
        </button>
      </div>

      {/* Filters & Search Section */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search by name, ID, or phone..." 
              className="w-full bg-surface-dark border border-border-green/30 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center bg-surface-dark border border-border-green/30 rounded-xl p-1 w-full md:w-auto overflow-x-auto">
            <button className="px-4 py-1.5 rounded-lg text-sm font-bold bg-primary text-background-dark whitespace-nowrap">
              All Students <span className="ml-1 opacity-70">124</span>
            </button>
            <button className="px-4 py-1.5 rounded-lg text-sm font-bold text-text-muted hover:text-white transition-colors whitespace-nowrap">
              Active
            </button>
            <button className="px-4 py-1.5 rounded-lg text-sm font-bold text-text-muted hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap">
              Needs Attention
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-dark border border-border-green/30 rounded-xl text-sm font-bold text-text-muted cursor-pointer hover:border-primary/30 transition-colors">
            <span>Level: All</span>
            <ChevronDown size={16} />
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-dark border border-border-green/30 rounded-xl text-sm font-bold text-text-muted cursor-pointer hover:border-primary/30 transition-colors">
            <span>Teacher: All</span>
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-surface-dark border border-border-green/30 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
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
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-white/[0.02] transition-colors group">
                  {/* Student Name */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-border-green/20">
                        <img src={student.avatar} alt={student.name} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white leading-tight">{student.name}</p>
                        <p className="text-xs text-text-muted mt-0.5">ID: {student.studentId}</p>
                      </div>
                    </div>
                  </td>

                  {/* Current Level */}
                  <td className="px-6 py-5">
                    <div>
                      <p className="text-sm font-bold text-primary">Juz {student.currentLevel.juz}</p>
                      <p className="text-xs text-text-muted mt-0.5">{student.currentLevel.surah}</p>
                    </div>
                  </td>

                  {/* Progress */}
                  <td className="px-6 py-5">
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
                  </td>

                  {/* Last Session */}
                  <td className="px-6 py-5">
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">{student.lastSession.time}</p>
                      <p className="text-xs text-text-muted mt-0.5">{student.lastSession.detail}</p>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => navigate('/sessions/daily')}
                        className="p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-all" 
                        title="Log Progress"
                      >
                        <PenTool size={18} />
                      </button>
                      <button 
                        onClick={() => navigate(`/students/${student.id}`)}
                        className="p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-all" 
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button className="p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-white/[0.02] border-t border-border-green/20 flex items-center justify-between">
          <p className="text-sm text-text-muted">
            Showing <span className="text-white font-medium">1 to 5</span> of <span className="text-white font-medium">124</span> students
          </p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-lg text-sm font-bold text-text-muted bg-white/5 cursor-not-allowed transition-all">
              Previous
            </button>
            <button className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-white/10 hover:bg-white/15 transition-all border border-border-green/30">
              Next
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
