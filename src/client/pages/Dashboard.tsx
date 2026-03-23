import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Video, 
  ClipboardList,
  TrendingUp,
  CheckCircle2,
  Sun,
  Moon,
  UserPlus,
  PenTool,
  Calendar,
  MessageSquare,
  Clock,
  MoreHorizontal
} from 'lucide-react';
import axios from 'axios';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeStudents, setActiveStudents] = useState({ value: '...', trend: '' });
  const [totalHifz, setTotalHifz] = useState({ value: '...', trend: '' });
  const [todaySessions, setTodaySessions] = useState({ value: '...', completed: 0 });
  const [pendingReviews, setPendingReviews] = useState({ value: '...', status: '' });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [activeRes, hifzRes, sessionsRes, reviewsRes] = await Promise.all([
          axios.get('/api/stats/active-students'),
          axios.get('/api/stats/total-hifz'),
          axios.get('/api/stats/today-sessions'),
          axios.get('/api/stats/pending-reviews')
        ]);

        setActiveStudents(activeRes.data);
        setTotalHifz(hifzRes.data);
        setTodaySessions(sessionsRes.data);
        setPendingReviews(reviewsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();
  }, []);

  // Stats Data
  const stats = [
    {
      label: 'Active Students',
      value: activeStudents.value.toString(),
      trend: activeStudents.trend,
      icon: Users,
      color: 'text-primary',
      bgIcon: 'bg-primary/10',
      trendIcon: TrendingUp
    },
    {
      label: 'Total Hifz (Juz)',
      value: totalHifz.value.toString(),
      trend: totalHifz.trend,
      icon: BookOpen,
      color: 'text-blue-400',
      bgIcon: 'bg-blue-400/10',
      trendIcon: TrendingUp
    },
    {
      label: "Today's Sessions",
      value: todaySessions.value.toString(),
      subtext: `${todaySessions.completed} Completed`,
      icon: Video,
      color: 'text-orange-400',
      bgIcon: 'bg-orange-400/10',
    },
    {
      label: 'Pending Reviews',
      value: pendingReviews.value.toString(),
      subtext: pendingReviews.status,
      subtextColor: Number(pendingReviews.value) === 0 ? 'text-primary' : 'text-orange-400',
      subtextIcon: Number(pendingReviews.value) === 0 ? CheckCircle2 : Clock,
      icon: ClipboardList,
      color: 'text-purple-400',
      bgIcon: 'bg-purple-400/10',
    }
  ];

  // Chart Data
  const attendanceData = [
    { day: 'Mon', value: 65 },
    { day: 'Tue', value: 75 },
    { day: 'Wed', value: 85 },
    { day: 'Thu', value: 78 },
    { day: 'Fri', value: 82 },
    { day: 'Sat', value: 90 },
    { day: 'Sun', value: 88 },
  ];

  // Upcoming Sessions Data
  const sessions = [
    {
      id: 1,
      class: 'Advanced Tajweed',
      instructor: 'Sh. Abdullah',
      students: [1, 2, 3],
      time: '09:00 AM',
      status: 'Live',
      statusColor: 'text-green-400 bg-green-400/10',
      icon: 'A',
      iconColor: 'bg-blue-500/20 text-blue-400'
    },
    {
      id: 2,
      class: 'Hifz Group B',
      instructor: 'Ustadha Fatima',
      students: [1, 2, 3, 4],
      time: '10:30 AM',
      status: 'Starting in 15m',
      statusColor: 'text-orange-400 bg-orange-400/10',
      icon: 'H',
      iconColor: 'bg-purple-500/20 text-purple-400'
    },
    {
      id: 3,
      class: 'Beginners Arabic',
      instructor: 'Sh. Ahmed',
      students: [1, 2],
      time: '02:00 PM',
      status: 'Scheduled',
      statusColor: 'text-text-muted bg-white/5',
      icon: 'B',
      iconColor: 'bg-orange-500/20 text-orange-400'
    }
  ];

  // Recent Activity Data
  const activities = [
    {
      id: 1,
      text: 'Ahmed Ali completed Surah Al-Mulk',
      time: '10 mins ago',
      color: 'bg-primary'
    },
    {
      id: 2,
      text: 'New student Yusuf Khan enrolled',
      time: '2 hours ago',
      color: 'bg-blue-400'
    },
    {
      id: 3,
      text: 'Attendance report generated',
      time: 'Yesterday, 9:00 PM',
      color: 'bg-text-muted'
    },
    {
      id: 4,
      text: 'Fatima marked as absent',
      time: 'Yesterday, 4:00 PM',
      color: 'bg-orange-400'
    }
  ];

  return (
    <div className="flex flex-col gap-8">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.first_name}
          </h1>
          <p className="text-text-muted font-medium">Monday, October 23rd • 14 Rabi' al-Thani 1445</p>
        </div>

        <div className="flex items-center gap-4 bg-surface-dark border border-border-green/30 rounded-xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Sun size={16} className="text-orange-300" />
            <span>Fajr: <span className="text-white font-bold">05:12 AM</span></span>
          </div>
          <div className="w-px h-4 bg-border-green/50"></div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Moon size={16} className="text-blue-300" />
            <span>Maghrib: <span className="text-white font-bold">06:45 PM</span></span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-surface-dark border border-border-green/30 rounded-2xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${stat.bgIcon} opacity-20 blur-xl group-hover:scale-110 transition-transform duration-500`}></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="text-text-muted font-medium text-sm">{stat.label}</span>
              <div className={`p-2 rounded-lg ${stat.bgIcon} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-white mb-2">{stat.value}</h3>
              {stat.trend && (
                <div className="flex items-center gap-1.5 text-primary text-sm font-bold">
                  <stat.trendIcon size={16} />
                  <span>{stat.trend}</span>
                </div>
              )}
              {stat.subtext && (
                <div className={`flex items-center gap-1.5 text-sm font-medium ${stat.subtextColor || 'text-text-muted'}`}>
                  {stat.subtextIcon && <stat.subtextIcon size={16} className="text-primary" />}
                  <span>{stat.subtext}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Charts & Sessions) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Attendance Chart */}
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Weekly Attendance Trends</h2>
                <p className="text-sm text-text-muted">Student presence over the last 7 days</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">92%</span>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">+4.5%</span>
              </div>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10B981" 
                    strokeWidth={3} 
                    dot={false}
                    activeDot={{ r: 6, fill: '#10B981', stroke: '#064E3B', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Upcoming Sessions */}
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Upcoming Sessions</h2>
              <button className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">View all</button>
            </div>
            
            <div className="flex flex-col gap-4">
              {/* Header Row */}
              <div className="grid grid-cols-12 text-xs font-bold text-text-muted uppercase tracking-wider px-4">
                <div className="col-span-4">Class Name</div>
                <div className="col-span-3">Instructor</div>
                <div className="col-span-2">Students</div>
                <div className="col-span-2">Time</div>
                <div className="col-span-1 text-right">Status</div>
              </div>

              {sessions.map((session) => (
                <div key={session.id} className="grid grid-cols-12 items-center p-4 rounded-xl bg-background-dark/50 hover:bg-background-dark transition-colors border border-transparent hover:border-border-green/30">
                  
                  {/* Class Name */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${session.iconColor}`}>
                      {session.icon}
                    </div>
                    <span className="font-bold text-white">{session.class}</span>
                  </div>

                  {/* Instructor */}
                  <div className="col-span-3 text-sm text-text-muted">
                    {session.instructor}
                  </div>

                  {/* Students */}
                  <div className="col-span-2 flex -space-x-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-surface-dark border-2 border-surface-dark flex items-center justify-center text-xs text-white overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session.id}-${i}`} alt="Student" />
                      </div>
                    ))}
                    {session.students.length > 2 && (
                      <div className="w-8 h-8 rounded-full bg-surface-dark border-2 border-surface-dark flex items-center justify-center text-xs font-bold text-text-muted">
                        +{session.students.length - 2}
                      </div>
                    )}
                  </div>

                  {/* Time */}
                  <div className="col-span-2 text-sm font-bold text-white">
                    {session.time}
                  </div>

                  {/* Status */}
                  <div className="col-span-1 flex justify-end">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${session.statusColor}`}>
                      {session.status}
                    </span>
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (Actions & Activity) */}
        <div className="flex flex-col gap-6">
          
          {/* Quick Actions */}
          <div className="bg-primary rounded-2xl p-6 text-background-dark">
            <h2 className="text-lg font-bold mb-6">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center justify-center gap-2 bg-black/10 hover:bg-black/20 transition-colors rounded-xl p-4 aspect-square">
                <UserPlus size={24} />
                <span className="font-bold text-sm">Add Student</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 bg-black/10 hover:bg-black/20 transition-colors rounded-xl p-4 aspect-square">
                <PenTool size={24} />
                <span className="font-bold text-sm">Log Progress</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 bg-black/10 hover:bg-black/20 transition-colors rounded-xl p-4 aspect-square">
                <Calendar size={24} />
                <span className="font-bold text-sm">Schedule</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 bg-black/10 hover:bg-black/20 transition-colors rounded-xl p-4 aspect-square">
                <MessageSquare size={24} />
                <span className="font-bold text-sm">Message</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-6 flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Recent Activity</h2>
              <MoreHorizontal className="text-text-muted cursor-pointer hover:text-white" size={20} />
            </div>

            <div className="relative pl-2">
              {/* Timeline Line */}
              <div className="absolute left-2 top-2 bottom-6 w-px bg-border-green/30"></div>

              <div className="flex flex-col gap-8">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-4 relative">
                    <div className={`w-4 h-4 rounded-full ${activity.color} ring-4 ring-surface-dark z-10 mt-1 flex-shrink-0`}></div>
                    <div className="flex flex-col gap-1">
                      <p className="text-white text-sm font-medium leading-tight">{activity.text}</p>
                      <span className="text-xs text-text-muted">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full mt-8 py-3 text-sm font-bold text-text-muted hover:text-white transition-colors border-t border-border-green/20">
              View All Activity
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
