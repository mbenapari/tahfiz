import React from 'react';
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  Calendar, 
  ChevronDown, 
  Download, 
  FileText, 
  Award,
  Filter,
  CheckCircle2,
  Clock,
  History,
  ArrowUpRight,
  ClipboardList,
  Presentation,
  UserCheck
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export const Reports: React.FC = () => {
  // Mock data for the institutional trends chart
  const trendData = [
    { name: 'Oct 01', current: 120, target: 100 },
    { name: 'Oct 08', current: 150, target: 140 },
    { name: 'Oct 15', current: 280, target: 200 },
    { name: 'Oct 22', current: 240, target: 260 },
    { name: 'Oct 31', current: 350, target: 320 },
  ];

  const stats = [
    {
      label: 'AVERAGE ATTENDANCE',
      value: '94.2%',
      trend: '+1.5% from last month',
      icon: Calendar,
      iconColor: 'text-primary',
      bgIcon: 'bg-primary/10'
    },
    {
      label: 'MEMORIZATION PROGRESS',
      value: '412 Pages',
      trend: '+24% velocity increase',
      icon: BookOpen,
      iconColor: 'text-blue-400',
      bgIcon: 'bg-blue-400/10'
    },
    {
      label: 'ACTIVE STUDENTS',
      value: '184',
      trend: 'Across 12 different levels',
      icon: Users,
      iconColor: 'text-primary',
      bgIcon: 'bg-primary/10'
    }
  ];

  const reportTypes = [
    {
      title: 'Student Performance Report',
      desc: 'Individual detailed breakdown',
      icon: UserCheck,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      title: 'Class Progression Report',
      desc: 'Curriculum coverage analysis',
      icon: TrendingUp,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10'
    },
    {
      title: 'Daily Attendance Summary',
      desc: 'Presence & punctuality log',
      icon: ClipboardList,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      title: 'Teacher Evaluation',
      desc: 'Class instruction performance',
      icon: Presentation,
      color: 'text-primary',
      bg: 'bg-primary/10'
    }
  ];

  const topPerformers = [
    { rank: '1st', name: 'Ahmed Ali', class: 'Hifz A', memorized: '15 Juz', accuracy: '98%', status: 'Exceptional', statusColor: 'bg-primary/10 text-primary', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed' },
    { rank: '2nd', name: 'Zaid Bakr', class: 'Hifz A', memorized: '12 Juz', accuracy: '95%', status: 'Advancing', statusColor: 'bg-white/5 text-text-muted', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zaid' },
    { rank: '3rd', name: 'Omar Farooq', class: 'Hifz B', memorized: '8 Juz', accuracy: '94%', status: 'Advancing', statusColor: 'bg-white/5 text-text-muted', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Omar' },
  ];

  const recentExports = [
    { name: 'Q3_Full_School_Report.pdf', info: 'Generated 2h ago • 4.2 MB' },
    { name: 'Hifz_A_Attendance_Oct.csv', info: 'Generated Yesterday • 120 KB' },
    { name: 'Yearly_Revenue_Audit.pdf', info: 'Generated Oct 28 • 1.8 MB' },
  ];

  return (
    <div className="flex flex-col gap-8">
      
      {/* Header with Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">School Performance Reports</h1>
          <p className="text-text-muted font-medium">Comprehensive data analysis and institutional progress tracking.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Date Range</span>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-dark border border-border-green/30 rounded-xl text-sm font-bold text-white">
              <Calendar size={16} className="text-primary" />
              <span>Oct 01, 2023 - Oct 31, 2023</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Class Filter</span>
            <div className="flex items-center gap-4 px-4 py-2.5 bg-surface-dark border border-border-green/30 rounded-xl text-sm font-bold text-white cursor-pointer hover:border-primary/30 transition-colors">
              <span>All Classes</span>
              <ChevronDown size={16} className="text-text-muted" />
            </div>
          </div>

          <button className="mt-5 flex items-center gap-2 bg-primary hover:bg-primary-hover text-background-dark px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20">
            <Filter size={18} />
            Apply
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-surface-dark border border-border-green/30 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group">
             <div className="flex justify-between items-start">
               <div className="flex flex-col gap-1">
                 <span className="text-xs font-bold text-text-muted tracking-wider">{stat.label}</span>
                 <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
               </div>
               <div className={`p-3 rounded-xl ${stat.bg} ${stat.iconColor}`}>
                 <stat.icon size={24} />
               </div>
             </div>
             <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
               {stat.trend.startsWith('+') ? <ArrowUpRight size={14} /> : null}
               <span>{stat.trend}</span>
             </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Chart and Top Performers */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Memorization Trends Chart */}
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-8 flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={20} className="text-primary" />
                  <h2 className="text-xl font-bold text-white">Memorization Trends</h2>
                </div>
                <p className="text-sm text-text-muted font-medium">Institutional page completion over the last 30 days</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-primary"></div>
                  <span className="text-xs font-bold text-text-muted">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-text-muted border-t border-dashed"></div>
                  <span className="text-xs font-bold text-text-muted">Target</span>
                </div>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="current" 
                    stroke="#10B981" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorCurrent)" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#94a3b8" 
                    strokeWidth={2} 
                    strokeDasharray="5 5" 
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Award size={20} />
                </div>
                <h2 className="text-xl font-bold text-white">Top Performers</h2>
              </div>
              <button className="text-sm font-bold text-primary hover:underline">View All Students</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-border-green/10">
                    <th className="pb-4 px-2">RANK</th>
                    <th className="pb-4 px-2">STUDENT</th>
                    <th className="pb-4 px-2">CLASS</th>
                    <th className="pb-4 px-2">MEMORIZED</th>
                    <th className="pb-4 px-2 text-center">ACCURACY</th>
                    <th className="pb-4 px-2 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-green/5">
                  {topPerformers.map((student, idx) => (
                    <tr key={idx} className="group">
                      <td className="py-4 px-2 text-sm font-bold text-white">{student.rank}</td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <img src={student.avatar} className="w-8 h-8 rounded-full bg-surface-dark border border-border-green/20" alt="" />
                          <span className="text-sm font-bold text-white">{student.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-sm font-medium text-text-muted">{student.class}</td>
                      <td className="py-4 px-2 text-sm font-bold text-white">{student.memorized}</td>
                      <td className="py-4 px-2 text-center">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                          {student.accuracy}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${student.statusColor}`}>
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Report Center and Exports */}
        <div className="flex flex-col gap-6">
          
          {/* Report Center */}
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-primary" />
              <h2 className="text-xl font-bold text-white">Report Center</h2>
            </div>

            <div className="flex flex-col gap-3">
              {reportTypes.map((report, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-background-dark/30 border border-border-green/10 rounded-2xl hover:border-primary/30 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${report.bg} ${report.color}`}>
                      <report.icon size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">{report.title}</p>
                      <p className="text-[10px] font-medium text-text-muted mt-1">{report.desc}</p>
                    </div>
                  </div>
                  <Download size={16} className="text-text-muted group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Exports */}
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <History size={20} className="text-primary" />
              <h2 className="text-xl font-bold text-white">Recent Exports</h2>
            </div>

            <div className="flex flex-col gap-6">
              {recentExports.map((exportItem, idx) => (
                <div key={idx} className="flex flex-col gap-1 group cursor-pointer">
                  <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{exportItem.name}</p>
                  <p className="text-[10px] font-medium text-text-muted">{exportItem.info}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
