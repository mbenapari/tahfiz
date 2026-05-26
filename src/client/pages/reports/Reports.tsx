import React, { useState, useEffect, useCallback } from 'react';
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
  UserCheck,
  Loader2
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [pendingDateRange, setPendingDateRange] = useState(getDefaultDateRange);

  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/reports/school-performance?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch school performance report');
      }
      const data = await response.json();
      
      // Map string icon names to Lucide icons
      const iconMap: any = {
        Calendar,
        BookOpen,
        Users,
        UserCheck,
        TrendingUp,
        ClipboardList,
        Presentation
      };

      const transformedStats = data.stats.map((stat: any) => ({
        ...stat,
        icon: iconMap[stat.icon] || Calendar
      }));

      const transformedReportTypes = data.reportTypes.map((type: any) => ({
        ...type,
        icon: iconMap[type.icon] || FileText
      }));

      setReportData({
        ...data,
        stats: transformedStats,
        reportTypes: transformedReportTypes
      });
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching report data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleApplyFilters = () => {
    setDateRange(pendingDateRange);
  };

  if (isLoading && !reportData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 size={40} className="text-primary animate-spin" />
        <p className="text-text-muted font-medium">Loading school performance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20">
          <p className="font-bold">Error loading reports: {error}</p>
        </div>
        <button 
          onClick={() => fetchReportData()}
          className="px-6 py-2 bg-primary text-background-dark rounded-xl font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats = [], trendData = [], topPerformers = [], reportTypes = [] } = reportData;

  const handleDownloadReport = async (reportTitle: string) => {
    let endpoint = '';
    let filename = '';

    if (reportTitle === 'Student Performance Report') {
      endpoint = `/api/reports/overall-performance/download?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      filename = `overall_performance_${dateRange.startDate}_${dateRange.endDate}.csv`;
    } else if (reportTitle === 'Daily Attendance Summary') {
      endpoint = `/api/reports/overall-attendance/download?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      filename = `overall_attendance_${dateRange.startDate}_${dateRange.endDate}.csv`;
    }

    if (!endpoint) return;

    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Error downloading report:', err);
      alert('Failed to download report. Please try again.');
    }
  };

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
            <div className="flex items-center gap-2 p-2 bg-surface-dark border border-border-green/30 rounded-xl">
              <Calendar size={16} className="text-primary shrink-0" />
              <input
                type="date"
                value={pendingDateRange.startDate}
                onChange={(e) => setPendingDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="bg-transparent text-sm font-bold text-white outline-none [color-scheme:dark] w-full min-w-0"
              />
              <span className="text-text-muted text-sm font-bold">-</span>
              <input
                type="date"
                value={pendingDateRange.endDate}
                onChange={(e) => setPendingDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="bg-transparent text-sm font-bold text-white outline-none [color-scheme:dark] w-full min-w-0"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Class Filter</span>
            <div className="flex items-center gap-4 px-4 py-2.5 bg-surface-dark border border-border-green/30 rounded-xl text-sm font-bold text-white cursor-pointer hover:border-primary/30 transition-colors">
              <span>All Classes</span>
              <ChevronDown size={16} className="text-text-muted" />
            </div>
          </div>

          <button
            onClick={handleApplyFilters}
            disabled={isLoading}
            className="mt-5 flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-background-dark px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
          >
            <Filter size={18} />
            {isLoading ? 'Applying...' : 'Apply'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat: any, idx: number) => (
          <div key={idx} className="bg-surface-dark border border-border-green/30 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group">
             <div className="flex justify-between items-start">
               <div className="flex flex-col gap-1">
                 <span className="text-xs font-bold text-text-muted tracking-wider">{stat.label}</span>
                 <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
               </div>
               <div className={`p-3 rounded-xl ${stat.bgIcon} ${stat.iconColor}`}>
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
                  <Area 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#94a3b8" 
                    strokeWidth={2} 
                    strokeDasharray="5 5" 
                    dot={false}
                    fill="transparent"
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
                  {topPerformers.map((student: any, idx: number) => (
                    <tr key={idx} className="group">
                      <td className="py-4 px-2 text-sm font-bold text-white">{idx + 1}{idx === 0 ? 'st' : idx === 1 ? 'nd' : idx === 2 ? 'rd' : 'th'}</td>
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
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${student.status === 'Exceptional' ? 'bg-primary/10 text-primary' : 'bg-white/5 text-text-muted'}`}>
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
              {reportTypes.map((report: any, idx: number) => (
                <div 
                  key={idx} 
                  onClick={() => handleDownloadReport(report.title)}
                  className="flex items-center justify-between p-4 bg-background-dark/30 border border-border-green/10 rounded-2xl hover:border-primary/30 transition-all cursor-pointer group"
                >
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
        </div>

      </div>

    </div>
  );
};
