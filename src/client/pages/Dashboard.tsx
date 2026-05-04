import React, { useState, useEffect, useMemo } from 'react';
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
  MoreHorizontal,
  AlertCircle,
  Loader2
} from 'lucide-react';

const timezoneCoordinates: Record<string, { lat: number; lng: number }> = {
  'Asia/Riyadh': { lat: 24.7136, lng: 46.6753 },
  'Asia/Dubai': { lat: 25.2048, lng: 55.2708 },
  'Asia/Kuala_Lumpur': { lat: 3.1390, lng: 101.6869 },
  'Asia/Jakarta': { lat: -6.2088, lng: 106.8456 },
  'Asia/Tokyo': { lat: 35.6895, lng: 139.6917 },
  'Asia/Karachi': { lat: 24.8607, lng: 67.0011 },
  'Asia/Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Australia/Sydney': { lat: -33.8688, lng: 151.2093 },
  'Europe/London': { lat: 51.5074, lng: -0.1278 },
  'Europe/Paris': { lat: 48.8566, lng: 2.3522 },
  'Europe/Berlin': { lat: 52.5200, lng: 13.4050 },
  'Africa/Cairo': { lat: 30.0444, lng: 31.2357 },
  'Africa/Abidjan': { lat: 5.6037, lng: -0.1870 },
  'Africa/Accra': { lat: 5.6037, lng: -0.1870 },
  'Africa/Lagos': { lat: 6.5244, lng: 3.3792 },
  'America/New_York': { lat: 40.7128, lng: -74.0060 },
  'America/Chicago': { lat: 41.8781, lng: -87.6298 },
  'America/Los_Angeles': { lat: 34.0522, lng: -118.2437 },
  'America/Sao_Paulo': { lat: -23.5505, lng: -46.6333 },
  'Pacific/Auckland': { lat: -36.8485, lng: 174.7633 },
};

const degreesToRadians = (deg: number) => deg * (Math.PI / 180);
const radiansToDegrees = (rad: number) => rad * (180 / Math.PI);

const getTimeZoneCoordinates = (timeZone: string) => {
  return timezoneCoordinates[timeZone] || { lat: 21.3891, lng: 39.8579 };
};

const getJulianDate = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
};

const getSolarCoordinates = (julianDate: number) => {
  const d = julianDate - 2451545.0;
  const g = degreesToRadians((357.529 + 0.98560028 * d) % 360);
  const q = degreesToRadians((280.459 + 0.98564736 * d) % 360);
  const L = degreesToRadians((radiansToDegrees(q) + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) % 360);
  const e = degreesToRadians(23.439 - 0.00000036 * d);
  const sinDec = Math.sin(e) * Math.sin(L);
  const cosDec = Math.cos(Math.asin(sinDec));
  const declination = Math.asin(sinDec);
  const RA = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  const eqTime = radiansToDegrees(q) / 15 - radiansToDegrees(RA) / 15;
  return { declination, eqTime };
};

const getHourAngle = (latitude: number, declination: number, zenithAngle: number) => {
  const lat = degreesToRadians(latitude);
  const zenith = degreesToRadians(zenithAngle);
  const cosH = (Math.cos(zenith) - Math.sin(lat) * Math.sin(declination)) / (Math.cos(lat) * Math.cos(declination));
  return Math.acos(Math.min(Math.max(cosH, -1), 1));
};

const getAsrHourAngle = (latitude: number, declination: number) => {
  const lat = degreesToRadians(latitude);
  const decl = declination;
  const angle = Math.atan(1 / (1 + Math.tan(Math.abs(lat - decl))));
  const cosH = (Math.sin(angle) - Math.sin(lat) * Math.sin(decl)) / (Math.cos(lat) * Math.cos(decl));
  return Math.acos(Math.min(Math.max(cosH, -1), 1));
};

const decimalHoursToTime = (date: Date, decimalHours: number) => {
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  midnight.setTime(midnight.getTime() + Math.round(decimalHours * 3600 * 1000));
  return midnight.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getPrayerTimes = (date: Date, latitude: number, longitude: number) => {
  const julianDate = getJulianDate(date);
  const { declination, eqTime } = getSolarCoordinates(julianDate);
  const timezoneOffset = -date.getTimezoneOffset() / 60;
  const solarNoon = 12 + timezoneOffset - longitude / 15 - eqTime;
  const sunriseHourAngle = getHourAngle(latitude, declination, 90.833);
  const fajrHourAngle = getHourAngle(latitude, declination, 108);
  const sunsetHourAngle = sunriseHourAngle;
  const asrHourAngle = getAsrHourAngle(latitude, declination);
  const ishaHourAngle = getHourAngle(latitude, declination, 108);

  const sunrise = solarNoon - radiansToDegrees(sunriseHourAngle) / 15;
  const fajr = solarNoon - radiansToDegrees(fajrHourAngle) / 15;
  const dhuhr = solarNoon;
  const asr = solarNoon + radiansToDegrees(asrHourAngle) / 15;
  const maghrib = solarNoon + radiansToDegrees(sunsetHourAngle) / 15;
  const isha = solarNoon + radiansToDegrees(ishaHourAngle) / 15;

  return {
    fajr: decimalHoursToTime(date, fajr),
    sunrise: decimalHoursToTime(date, sunrise),
    dhuhr: decimalHoursToTime(date, dhuhr),
    asr: decimalHoursToTime(date, asr),
    maghrib: decimalHoursToTime(date, maghrib),
    isha: decimalHoursToTime(date, isha),
  };
};

const getFormattedGregorianDate = (date: Date, timeZone: string) => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone,
  }).format(date);
};

const getFormattedHijriDate = (date: Date, timeZone: string) => {
  return new Intl.DateTimeFormat('en-US-u-ca-islamic', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  }).format(date);
};

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
import { Navigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Redirect system owners away from user dashboard if they somehow land here
  if (user?.role === 'owner') {
    return <Navigate to="/owner" replace />;
  }

  const [activeStudents, setActiveStudents] = useState({ value: '...', trend: '' });
  const [totalHifz, setTotalHifz] = useState({ value: '...', trend: '' });
  const [todaySessions, setTodaySessions] = useState({ value: '...', completed: 0 });
  const [juzRevised, setJuzRevised] = useState({ daily: 0, weekly: 0, monthly: 0 });
  const [attendanceTrends, setAttendanceTrends] = useState({ 
    trends: [], 
    currentAverage: 0, 
    trendPercentage: 0,
    isLoading: true,
    error: null as string | null
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [activeRes, hifzRes, sessionsRes, revisedRes] = await Promise.all([
          axios.get('/api/stats/active-students'),
          axios.get('/api/stats/total-hifz'),
          axios.get('/api/stats/today-sessions'),
          axios.get('/api/metrics/juz-revised')
        ]);

        setActiveStudents(activeRes.data);
        setTotalHifz(hifzRes.data);
        setTodaySessions(sessionsRes.data);
        setJuzRevised(revisedRes.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    const fetchAttendanceTrends = async () => {
      try {
        const response = await axios.get('/api/stats/attendance-trends');
        setAttendanceTrends({
          ...response.data,
          isLoading: false,
          error: null
        });
      } catch (error: any) {
        console.error('Error fetching attendance trends:', error);
        setAttendanceTrends(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load attendance trends'
        }));
      }
    };

    fetchStats();
    fetchAttendanceTrends();

    // Set up polling for real-time updates every 5 minutes
    const pollInterval = setInterval(() => {
      fetchStats();
      fetchAttendanceTrends();
    }, 5 * 60 * 1000);

    return () => clearInterval(pollInterval);
  }, []);

  const currentTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const currentDate = new Date();
  const formattedGregorianDate = getFormattedGregorianDate(currentDate, currentTimeZone);
  const formattedHijriDate = getFormattedHijriDate(currentDate, currentTimeZone);
  const { lat, lng } = getTimeZoneCoordinates(currentTimeZone);
  const prayerTimes = useMemo(() => getPrayerTimes(currentDate, lat, lng), [currentDate, lat, lng]);

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
      label: 'Total Juz Revised',
      value: juzRevised.monthly.toString(),
      subtext: `${juzRevised.weekly} this week`,
      subtextColor: 'text-primary',
      subtextIcon: CheckCircle2,
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
          <p className="text-text-muted font-medium">
            {formattedGregorianDate} • {formattedHijriDate}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-surface-dark border border-border-green/30 rounded-xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-text-muted">
            <Sun size={16} className="text-orange-300" />
            <span>Fajr: <span className="text-white font-bold">{prayerTimes.fajr}</span></span>
          </div>
          <div className="w-px h-4 bg-border-green/50"></div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Clock size={16} className="text-yellow-300" />
            <span>Dhuhr: <span className="text-white font-bold">{prayerTimes.dhuhr}</span></span>
          </div>
          <div className="w-px h-4 bg-border-green/50"></div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Sun size={16} className="text-yellow-300" />
            <span>Asr: <span className="text-white font-bold">{prayerTimes.asr}</span></span>
          </div>
          <div className="w-px h-4 bg-border-green/50"></div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Moon size={16} className="text-blue-300" />
            <span>Maghrib: <span className="text-white font-bold">{prayerTimes.maghrib}</span></span>
          </div>
          <div className="w-px h-4 bg-border-green/50"></div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Moon size={16} className="text-slate-300" />
            <span>Isha: <span className="text-white font-bold">{prayerTimes.isha}</span></span>
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
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-6 min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Weekly Attendance Trends</h2>
                <p className="text-sm text-text-muted">Student presence over the last 8 weeks</p>
              </div>
              {!attendanceTrends.isLoading && !attendanceTrends.error && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">{attendanceTrends.currentAverage}%</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${attendanceTrends.trendPercentage >= 0 ? 'text-primary bg-primary/10' : 'text-red-400 bg-red-400/10'}`}>
                    {attendanceTrends.trendPercentage >= 0 ? '+' : ''}{attendanceTrends.trendPercentage}%
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 w-full relative">
              {attendanceTrends.isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-text-muted">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <p className="text-sm font-medium">Loading attendance data...</p>
                </div>
              ) : attendanceTrends.error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-red-400 p-6 text-center">
                  <AlertCircle size={32} />
                  <p className="text-sm font-bold">{attendanceTrends.error}</p>
                  <button 
                    onClick={() => {
                      setAttendanceTrends(prev => ({ ...prev, isLoading: true, error: null }));
                      // Trigger fetch logic would go here, but for simplicity we rely on the next poll
                    }}
                    className="text-xs font-bold text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-4 py-2 rounded-lg transition-all"
                  >
                    Try Again
                  </button>
                </div>
              ) : attendanceTrends.trends.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted italic">
                  No attendance records found for the selected period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceTrends.trends}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                    <XAxis 
                      dataKey="week" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      hide 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                      cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '4 4' }}
                      formatter={(value: any) => [`${value}%`, 'Attendance']}
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
              )}
            </div>
          </div>

          {/* Upcoming Sessions */}

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
                <span className="font-bold text-sm">Add Instructor</span>
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

        </div>

      </div>

    </div>
  );
};
