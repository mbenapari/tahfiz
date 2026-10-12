import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  RotateCcw, 
  Star, 
  PenTool, 
  Calendar, 
  ChevronDown, 
  CheckCircle2,
  ArrowLeft,
  History,
  Loader2,
  AlertCircle,
  Search
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useNotification } from '../../context/NotificationContext';

interface Student {
  daily_revision_target: number;
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  student_identifier: string;
}

interface Surah {
  number: number;
  name: string;
  ayah_count: number;
}

interface HifzHistoryRecord {
  id: number;
  sessionDate: string;
  surahName: string;
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  isFullSurah: boolean;
  rating: number | null;
  notes: string | null;
  instructorNotes: string | null;
}

interface RevisionHistoryRecord {
  id: number;
  sessionDate: string;
  type: string;
  startSurah: string | null;
  endSurah: string | null;
  surahName: string | null;
  startAyah: number | null;
  endAyah: number | null;
  startPage: number | null;
  endPage: number | null;
  isFullSurah: boolean;
  rating: number | null;
  notes: string | null;
}

export const DailySession: React.FC = () => {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const { showNotification } = useNotification();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const todayStr = new Date().toISOString().split('T')[0];
  const [hifzDate, setHifzDate] = useState(todayStr);
  const [revisionDate, setRevisionDate] = useState(todayStr);
  
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [isSurahDropdownOpen, setIsSurahDropdownOpen] = useState(false);
  const [surahSearch, setSurahSearch] = useState('');

  const [selectedRevisionSurah, setSelectedRevisionSurah] = useState<Surah | null>(null);
  const [selectedEndRevisionSurah, setSelectedEndRevisionSurah] = useState<Surah | null>(null);
  const [isRevisionSurahDropdownOpen, setIsRevisionSurahDropdownOpen] = useState(false);
  const [isEndRevisionSurahDropdownOpen, setIsEndRevisionSurahDropdownOpen] = useState(false);
  const [revisionSurahSearch, setRevisionSurahSearch] = useState('');
  const [endRevisionSurahSearch, setEndRevisionSurahSearch] = useState('');
  
  // Click outside listener for surah dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.surah-dropdown-container')) {
        setIsSurahDropdownOpen(false);
      }
      if (!target.closest('.revision-surah-dropdown-container')) {
        setIsRevisionSurahDropdownOpen(false);
      }
      if (!target.closest('.end-revision-surah-dropdown-container')) {
        setIsEndRevisionSurahDropdownOpen(false);
      }
    };

    if (isSurahDropdownOpen || isRevisionSurahDropdownOpen || isEndRevisionSurahDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSurahDropdownOpen, isRevisionSurahDropdownOpen, isEndRevisionSurahDropdownOpen]);

  const filteredSurahs = surahs.filter(s => 
    s.name.toLowerCase().includes(surahSearch.toLowerCase()) || 
    s.number.toString().includes(surahSearch)
  );

  const filteredRevisionSurahs = surahs.filter(s => 
    s.name.toLowerCase().includes(revisionSurahSearch.toLowerCase()) || 
    s.number.toString().includes(revisionSurahSearch)
  );

  const filteredEndRevisionSurahs = surahs.filter(s => 
    s.name.toLowerCase().includes(endRevisionSurahSearch.toLowerCase()) || 
    s.number.toString().includes(endRevisionSurahSearch)
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: 'hifz' | 'revision' = searchParams.get('tab') === 'revision' ? 'revision' : 'hifz';
  const setActiveTab = (tab: 'hifz' | 'revision') => {
    setSearchParams(tab === 'hifz' ? {} : { tab }, { replace: true });
  };

  const [rating, setRating] = useState(3);
  const [isSubmittingHifz, setIsSubmittingHifz] = useState(false);
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);
  // Prevent duplicate saves of the same record; cleared when the inputs change
  const [hifzSaved, setHifzSaved] = useState(false);
  const [revisionSaved, setRevisionSaved] = useState(false);

  // Hifz states
  const [hifzStartAyah, setHifzStartAyah] = useState('1');
  const [hifzEndAyah, setHifzEndAyah] = useState('');
  const [isHifzCompleted, setIsHifzCompleted] = useState(false);

  // Revision states
  const [revisionTab, setRevisionTab] = useState<'page' | 'surah'>('page');
  const [revisionStart, setRevisionStart] = useState('');
  const [revisionEnd, setRevisionEnd] = useState('');
  const [isRevisionCompleted, setIsRevisionCompleted] = useState(false);

  const [revisionRating, setRevisionRating] = useState(3);
  const [revisionNoteContent, setRevisionNoteContent] = useState('');
  
  // Attendance state
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent' | 'late'>('present');
  
  const [instructorNotes, setInstructorNotes] = useState('');

  // History state
  const [hifzHistory, setHifzHistory] = useState<HifzHistoryRecord[]>([]);
  const [revisionHistory, setRevisionHistory] = useState<RevisionHistoryRecord[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<'hifz' | 'revision' | null>(null);
  const [isFirstSession, setIsFirstSession] = useState(false);

  // Pagination state
  const [hifzPage, setHifzPage] = useState(1);
  const [revisionPage, setRevisionPage] = useState(1);
  const [totalHifz, setTotalHifz] = useState(0);
  const [totalRevision, setTotalRevision] = useState(0);
  const HISTORY_LIMIT = 5;

  useEffect(() => {
    const fetchStudentAndSchedule = async () => {
      if (!studentId) {
        setError('Missing student ID');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const studentRes = await fetch(`/api/users/students/${studentId}`);

        if (!studentRes.ok) throw new Error('Failed to fetch student details');

        const studentData = await studentRes.json();

        if (!studentData.success) throw new Error(studentData.error || 'Failed to fetch student details');
        
        setStudent(studentData.data?.student ?? null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentAndSchedule();
  }, [studentId]);

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const response = await fetch('/api/surahs');
        if (!response.ok) throw new Error('Failed to fetch surahs');
        const data = await response.json();
        setSurahs(data.surahs);
      } catch (err: any) {
        console.error('Error fetching surahs:', err);
      }
    };

    fetchSurahs();
  }, []);

  // Fetch session history and check if first session
  const fetchHistory = async (type: 'hifz' | 'revision' | 'all' = 'all', page: number = 1) => {
    if (!studentId) return;
    
    setIsHistoryLoading(true);
    try {
      const offset = (page - 1) * HISTORY_LIMIT;
      const response = await fetch(`/api/sessions/history/${studentId}?type=${type}&limit=${HISTORY_LIMIT}&offset=${offset}`);
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      
      if (data.success) {
        if (type === 'all' || type === 'hifz') {
          setHifzHistory(data.data.hifzRecords || []);
          setTotalHifz(data.data.pagination.totalHifz || 0);
        }
        if (type === 'all' || type === 'revision') {
          setRevisionHistory(data.data.revisionRecords || []);
          setTotalRevision(data.data.pagination.totalRevision || 0);
        }
        
        if (type === 'all') {
          setIsFirstSession(
            data.data.pagination.totalHifz === 0 &&
            data.data.pagination.totalRevision === 0
          );
        }
      }
    } catch (err: any) {
      console.error('Error fetching session history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory('all', 1);
  }, [studentId]);

  useEffect(() => {
    if (hifzPage > 1 || totalHifz > HISTORY_LIMIT) {
      fetchHistory('hifz', hifzPage);
    }
  }, [hifzPage]);

  useEffect(() => {
    if (revisionPage > 1 || totalRevision > HISTORY_LIMIT) {
      fetchHistory('revision', revisionPage);
    }
  }, [revisionPage]);

  const isValidDateString = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(new Date(`${date}T00:00:00.000Z`).getTime());

  useEffect(() => { setHifzSaved(false); }, [hifzDate, selectedSurah, hifzStartAyah, hifzEndAyah, isHifzCompleted, rating, instructorNotes]);
  useEffect(() => {
    setRevisionSaved(false);
  }, [revisionDate, revisionTab, selectedRevisionSurah, selectedEndRevisionSurah, revisionStart, revisionEnd, isRevisionCompleted, revisionRating, revisionNoteContent]);

  const handleSaveHifz = async () => {
    if (!studentId) {
      showNotification('error', 'Action Required', 'Student ID is missing');
      return;
    }

    // Attendance check
    if (attendanceStatus === 'absent') {
      showNotification('error', 'Action Required', 'Cannot save Hifz record for an absent student');
      return;
    }

    // Hifz field validation
    if (!selectedSurah) {
      showNotification('error', 'Action Required', 'Please select a surah for Hifz');
      return;
    }
    if (!hifzStartAyah || !hifzEndAyah) {
      showNotification('error', 'Action Required', 'Please specify the ayah range for Hifz');
      return;
    }
    const startAyah = Number(hifzStartAyah);
    const endAyah = Number(hifzEndAyah);
    if (!Number.isInteger(startAyah) || !Number.isInteger(endAyah)) {
      showNotification('error', 'Action Required', 'Ayah numbers must be whole numbers');
      return;
    }
    if (startAyah <= 0 || endAyah <= 0) {
      showNotification('error', 'Action Required', 'Ayah numbers must be positive');
      return;
    }
    if (startAyah > endAyah) {
      showNotification('error', 'Action Required', 'Hifz start ayah cannot be greater than end ayah');
      return;
    }
    if (endAyah > selectedSurah.ayah_count) {
      showNotification('error', 'Action Required', `Hifz end ayah cannot be more than ${selectedSurah.ayah_count} (total ayahs in ${selectedSurah.name})`);
      return;
    }

    // Rating validation
    if (rating < 1 || rating > 5) {
      showNotification('error', 'Action Required', 'Please provide a valid performance rating');
      return;
    }

    if (!isValidDateString(hifzDate)) {
      showNotification('error', 'Invalid Date', 'Please provide a valid Hifz session date in YYYY-MM-DD format.');
      return;
    }

    setIsSubmittingHifz(true);
    try {
      const sessionData = {
        studentId: Number(studentId),
        sessionDate: hifzDate,
        recordingDate: hifzDate,
        attendance: { status: attendanceStatus },
        notes: instructorNotes,
        hifzRecord: {
          surahNumber: selectedSurah.number,
          startAyah,
          endAyah,
          isFullSurah: isHifzCompleted,
          notes: instructorNotes,
        },
        revisionRecord: null,
        rating,
      };

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save Hifz session');
      }

      setHifzSaved(true);
      showNotification('success', 'Saved Successfully', `Hifz saved — ${selectedSurah?.name || ''} (${startAyah}-${endAyah})`);
    } catch (err: any) {
      showNotification('error', 'Error Saving Hifz', err.message);
    } finally {
      setIsSubmittingHifz(false);
    }
  };

  /**
   * Validate and save only the Revision record.
   */
  const handleSaveRevision = async () => {
    if (!studentId) {
      showNotification('error', 'Action Required', 'Student ID is missing');
      return;
    }

    // Attendance check
    if (attendanceStatus === 'absent') {
      showNotification('error', 'Action Required', 'Cannot save Revision record for an absent student');
      return;
    }

    // Revision field validation
    if (revisionTab === 'surah') {
      if (!selectedRevisionSurah || !selectedEndRevisionSurah) {
        showNotification('error', 'Action Required', 'Please select both start and end surahs for revision');
        return;
      }
      if (selectedRevisionSurah.number > selectedEndRevisionSurah.number) {
        showNotification('error', 'Action Required', 'Start surah cannot be after end surah');
        return;
      }
      if (!revisionStart || !revisionEnd) {
        showNotification('error', 'Action Required', 'Please specify the ayah range for Revision');
        return;
      }
      const startAyah = Number(revisionStart);
      const endAyah = Number(revisionEnd);
      if (!Number.isInteger(startAyah) || !Number.isInteger(endAyah)) {
        showNotification('error', 'Action Required', 'Ayah numbers must be whole numbers');
        return;
      }
      if (startAyah <= 0 || endAyah <= 0) {
        showNotification('error', 'Action Required', 'Ayah numbers must be positive');
        return;
      }
      if (selectedRevisionSurah.number === selectedEndRevisionSurah.number) {
        if (startAyah > endAyah) {
          showNotification('error', 'Action Required', 'Revision start ayah cannot be greater than end ayah');
          return;
        }
        if (endAyah > selectedRevisionSurah.ayah_count) {
          showNotification('error', 'Action Required', `Revision end ayah cannot be more than ${selectedRevisionSurah.ayah_count} (total ayahs in ${selectedRevisionSurah.name})`);
          return;
        }
      }
    } else if (revisionTab === 'page') {
      if (!revisionStart || !revisionEnd) {
        showNotification('error', 'Action Required', 'Please specify the page range for Revision');
        return;
      }
      const startPage = Number(revisionStart);
      const endPage = Number(revisionEnd);
      if (!Number.isInteger(startPage) || !Number.isInteger(endPage)) {
        showNotification('error', 'Action Required', 'Page numbers must be whole numbers');
        return;
      }
      if (startPage <= 0 || endPage <= 0) {
        showNotification('error', 'Action Required', 'Page numbers must be positive');
        return;
      }
      if (startPage > endPage) {
        showNotification('error', 'Action Required', 'Revision start page cannot be greater than end page');
        return;
      }
    }

    // Rating validation (revision-specific)
    if (revisionRating < 1 || revisionRating > 5) {
      showNotification('error', 'Action Required', 'Please provide a valid revision performance rating');
      return;
    }

    if (!isValidDateString(revisionDate)) {
      showNotification('error', 'Invalid Date', 'Please provide a valid Revision session date in YYYY-MM-DD format.');
      return;
    }

    setIsSubmittingRevision(true);
    try {
      const sessionData = {
        studentId: Number(studentId),
        sessionDate: revisionDate,
        recordingDate: revisionDate,
        attendance: { status: attendanceStatus },
        notes: '',
        hifzRecord: null,
        revisionRecord: {
          surahNumber: undefined,
          startSurahNumber: revisionTab === 'surah' ? selectedRevisionSurah?.number : undefined,
          endSurahNumber: revisionTab === 'surah' ? selectedEndRevisionSurah?.number : undefined,
          startAyah: revisionTab === 'surah' ? Number(revisionStart) : undefined,
          endAyah: revisionTab === 'surah' ? Number(revisionEnd) : undefined,
          startPage: revisionTab === 'page' ? Number(revisionStart) : undefined,
          endPage: revisionTab === 'page' ? Number(revisionEnd) : undefined,
          isFullSurah: isRevisionCompleted,
          notes: revisionNoteContent.trim(),
        },
        revisionRating,
        revisionInstructorNotes: revisionNoteContent.trim() 
          ? [{ content: revisionNoteContent.trim() }] 
          : undefined,
      };

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save Revision session');
      }

      setRevisionSaved(true);
      showNotification('success', 'Saved Successfully', 'Revision saved successfully');
    } catch (err: any) {
      showNotification('error', 'Error Saving Revision', err.message);
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-text-muted min-h-[400px]">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="font-medium">Loading student data...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-red-400 p-8 text-center min-h-[400px]">
        <AlertCircle size={40} />
        <div>
          <p className="font-bold text-lg">Error</p>
          <p className="text-sm opacity-80 mt-1">{error || 'Student not found'}</p>
        </div>
        <button 
          onClick={() => navigate('/students')}
          className="mt-2 px-6 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-sm font-bold transition-all"
        >
          Back to Roster
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => navigate('/students')}
            className="p-2 hover:bg-white/5 rounded-lg text-text-muted hover:text-white transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/20 p-1 bg-surface-dark">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.first_name}`} 
              alt={`${student.first_name} ${student.last_name}`} 
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{student.first_name} {student.last_name}</h1>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                ID: {student.student_identifier || `USR-${student.id}`}
              </span>
              <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                <History size={14} />
                View History
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Banner for First-Time Users */}
      {isFirstSession && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-sm font-medium text-primary">
            Welcome! Record today&apos;s Hifz progress and any revision work separately using the save buttons in each section.
          </p>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="flex flex-col gap-6">

          
          {/* Attendance Section */}
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <CheckCircle2 size={24} />
              </div>
              <h2 className="text-xl font-bold text-white">Attendance</h2>
            </div>

            <div className="flex bg-background-dark/50 p-1 rounded-xl border border-border-green/20">
              <button 
                onClick={() => setAttendanceStatus('present')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  attendanceStatus === 'present' 
                    ? 'bg-primary text-background-dark shadow-sm' 
                    : 'text-text-muted hover:text-white'
                }`}
              >
                Present
              </button>
              <button 
                onClick={() => setAttendanceStatus('absent')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  attendanceStatus === 'absent' 
                    ? 'bg-red-500 text-white shadow-sm' 
                    : 'text-text-muted hover:text-white'
                }`}
              >
                Absent
              </button>
              <button 
                onClick={() => setAttendanceStatus('late')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  attendanceStatus === 'late' 
                    ? 'bg-yellow-500 text-background-dark shadow-sm' 
                    : 'text-text-muted hover:text-white'
                }`}
              >
                Late
              </button>
            </div>
            
            {attendanceStatus === 'absent' && (
              <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-xl animate-in fade-in slide-in-from-top-1 duration-300">
                <AlertCircle size={16} />
                <p className="text-xs font-bold uppercase tracking-wider">Student is marked as absent. Lesson records are disabled.</p>
              </div>
            )}
          </div>

          {/* Hifz / Muraja'ah tabs */}
          <div role="tablist" className="flex bg-surface-dark p-1 rounded-xl border border-border-green/30">
            <button
              role="tab"
              aria-selected={activeTab === 'hifz'}
              onClick={() => setActiveTab('hifz')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'hifz' ? 'bg-primary text-background-dark shadow-sm' : 'text-text-muted hover:text-white'
              }`}
            >
              <BookOpen size={18} />
              Hifz
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'revision'}
              onClick={() => setActiveTab('revision')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'revision' ? 'bg-blue-500 text-white shadow-sm' : 'text-text-muted hover:text-white'
              }`}
            >
              <RotateCcw size={18} />
              Muraja'ah
            </button>
          </div>

          {/* Hifz panel */}
          <div className={activeTab === 'hifz' ? 'flex flex-col gap-6' : 'hidden'}>
          {/* New Lesson (Hifz) */}
          <div className={`bg-surface-dark border border-border-green/30 rounded-2xl p-8 flex flex-col gap-6 transition-all duration-300 ${attendanceStatus === 'absent' ? 'opacity-40 grayscale' : ''}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <BookOpen size={24} />
                </div>
                <h2 className="text-xl font-bold text-white">New Lesson (Hifz)</h2>
              </div>
            </div>

            {/* Hifz Session Date Picker */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-muted">Session Date</label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-4 py-2 bg-background-dark/50 border border-border-green/30 rounded-xl text-white font-bold focus-within:border-primary/50 transition-colors">
                  <Calendar size={16} className="text-text-muted" />
                  <input 
                    type="date" 
                    value={hifzDate}
                    onChange={(e) => setHifzDate(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm font-bold [color-scheme:dark] cursor-pointer"
                  />
                </div>
                {hifzDate === todayStr && (
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">Today</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2 surah-dropdown-container">
                <label className="text-sm font-medium text-text-muted">Surah</label>
                <div className="relative">
                  <div 
                    onClick={() => setIsSurahDropdownOpen(!isSurahDropdownOpen)}
                    className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3.5 px-4 text-white flex items-center justify-between cursor-pointer hover:border-primary/30 transition-colors"
                  >
                    <span className={selectedSurah ? "font-bold" : "text-text-muted/50 font-medium"}>
                      {selectedSurah ? `${selectedSurah.number}. ${selectedSurah.name}` : "Select Surah..."}
                    </span>
                    <ChevronDown size={20} className={`text-text-muted transition-transform ${isSurahDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {isSurahDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-surface-dark border border-border-green/30 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-3 border-b border-border-green/20">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                          <input 
                            autoFocus
                            type="text"
                            value={surahSearch}
                            onChange={(e) => setSurahSearch(e.target.value)}
                            placeholder="Search surah name or number..."
                            className="w-full bg-background-dark/50 border border-border-green/20 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                          />
                        </div>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {filteredSurahs.length > 0 ? (
                          filteredSurahs.map((surah) => (
                            <div 
                              key={surah.number}
                              onClick={() => {
                                setSelectedSurah(surah);
                                setIsSurahDropdownOpen(false);
                                setSurahSearch('');
                              }}
                              className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-primary/5 transition-colors ${selectedSurah?.number === surah.number ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-white'}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold w-6 h-6 flex items-center justify-center bg-background-dark/50 rounded-md border border-border-green/20">
                                  {surah.number}
                                </span>
                                <span className="font-bold">{surah.name}</span>
                              </div>
                              <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{surah.ayah_count} Ayahs</span>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-text-muted">
                            <p className="text-sm italic">No surahs found matching your search.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Start Ayah</label>
                  <input 
                    type="number" 
                    min="1"
                    max={selectedSurah?.ayah_count}
                    value={hifzStartAyah}
                    onChange={(e) => setHifzStartAyah(e.target.value)}
                    placeholder="1"
                    className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3.5 px-4 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-muted/20"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">End Ayah</label>
                  <input 
                    type="number" 
                    min="1"
                    max={selectedSurah?.ayah_count}
                    value={hifzEndAyah}
                    onChange={(e) => setHifzEndAyah(e.target.value)}
                    placeholder={selectedSurah?.ayah_count.toString() || "7"}
                    className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3.5 px-4 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-muted/20"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 p-4 bg-background-dark/30 border border-border-green/20 rounded-xl cursor-pointer hover:bg-background-dark/50 transition-colors group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    checked={isHifzCompleted}
                    onChange={(e) => setIsHifzCompleted(e.target.checked)}
                    className="peer appearance-none w-6 h-6 border-2 border-border-green/30 rounded-lg checked:bg-primary checked:border-primary transition-all cursor-pointer" 
                  />
                  <CheckCircle2 size={16} className="absolute left-1 top-1 text-background-dark opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                </div>
                <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">Mark Surah as Completed?</span>
              </label>
            </div>

            {/* Hifz History Panel */}
            <div className="border-t border-border-green/20 pt-4">
              <button
                onClick={() => setExpandedHistory(expandedHistory === 'hifz' ? null : 'hifz')}
                className="flex items-center gap-2 text-sm text-text-muted hover:text-white transition-colors"
              >
                <History size={16} />
                <span>View Previous Hifz ({totalHifz})</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${expandedHistory === 'hifz' ? 'rotate-180' : ''}`}
                />
              </button>

              {expandedHistory === 'hifz' && (
                <div className="mt-3 space-y-2">
                  {isHistoryLoading ? (
                    <div className="flex items-center gap-2 text-text-muted py-2">
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-xs">Loading history...</span>
                    </div>
                  ) : hifzHistory.length > 0 ? (
                    <>
                      {hifzHistory.map((record) => (
                        <div
                          key={record.id}
                          className="p-3 bg-background-dark/30 rounded-lg border border-border-green/10"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white text-sm">
                              {record.surahName}
                            </span>
                            <span className="text-xs text-text-muted">
                              {record.sessionDate}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted mt-1">
                            Ayahs {record.startAyah}-{record.endAyah}
                            {record.isFullSurah && ' (Full Surah)'}
                          </p>
                          {record.rating && (
                            <div className="flex items-center gap-0.5 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={12}
                                  className={star <= record.rating! ? 'text-primary' : 'text-text-muted/30'}
                                  fill={star <= record.rating! ? 'currentColor' : 'none'}
                                />
                              ))}
                            </div>
                          )}
                          {record.notes && (
                            <p className="text-xs text-text-muted/70 mt-1 italic">
                              {record.notes}
                            </p>
                          )}
                          {record.instructorNotes && (
                            <p className="text-xs text-text-muted/50 mt-0.5">
                              Instructor: {record.instructorNotes}
                            </p>
                          )}
                        </div>
                      ))}

                      {/* Pagination Controls */}
                      {totalHifz > HISTORY_LIMIT && (
                        <div className="flex items-center justify-between pt-2 px-1">
                          <button
                            disabled={hifzPage === 1 || isHistoryLoading}
                            onClick={() => setHifzPage(p => p - 1)}
                            className="text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            Previous
                          </button>
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                            Page {hifzPage} of {Math.ceil(totalHifz / HISTORY_LIMIT)}
                          </span>
                          <button
                            disabled={hifzPage >= Math.ceil(totalHifz / HISTORY_LIMIT) || isHistoryLoading}
                            onClick={() => setHifzPage(p => p + 1)}
                            className="text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-text-muted italic py-2">
                      No previous Hifz records found.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Grading & Notes */}
          <div className={`bg-surface-dark border border-border-green/30 rounded-2xl p-8 flex flex-col gap-6 transition-all duration-300 ${attendanceStatus === 'absent' ? 'opacity-40 grayscale' : ''}`}>
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
                <p className="text-xs font-bold text-orange-400 mt-1">
                  {rating === 1 ? 'Needs Much Improvement' : 
                   rating === 2 ? 'Needs Improvement' :
                   rating === 3 ? 'Average Performance' :
                   rating === 4 ? 'Good Performance' : 'Excellent Performance'}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-muted">Instructor Notes</label>
                <textarea 
                  value={instructorNotes}
                  onChange={(e) => setInstructorNotes(e.target.value)}
                  placeholder="Enter specific feedback..." 
                  className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl p-4 text-white placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-colors min-h-[100px] resize-none font-medium"
                ></textarea>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveHifz}
            disabled={isSubmittingHifz || hifzSaved}
            className="w-full py-4 bg-primary hover:bg-primary-hover text-background-dark rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/10 disabled:opacity-50"
          >
            {isSubmittingHifz ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
            {hifzSaved ? 'Hifz Saved' : 'Save Hifz Record'}
          </button>

          </div>

        {/* Muraja'ah panel */}
        <div className={`${activeTab === 'revision' ? '' : 'hidden '}bg-surface-dark border border-border-green/30 rounded-2xl p-8 flex flex-col gap-6 h-full transition-all duration-300 ${attendanceStatus === 'absent' ? 'opacity-40 grayscale' : ''}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <RotateCcw size={24} />
              </div>
              <h2 className="text-xl font-bold text-white">Revision (Muraja'ah)</h2>
            </div>
          </div>

          {/* Revision Session Date Picker */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-muted">Session Date</label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-background-dark/50 border border-border-green/30 rounded-xl text-white font-bold focus-within:border-primary/50 transition-colors">
                <Calendar size={16} className="text-text-muted" />
                <input 
                  type="date" 
                  value={revisionDate}
                  onChange={(e) => setRevisionDate(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm font-bold [color-scheme:dark] cursor-pointer"
                />
              </div>
              {revisionDate === todayStr && (
                <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">Today</span>
              )}
            </div>
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
            {/* <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-text-muted">Recent Weak Spots</label>
              <div className="flex flex-col items-center gap-2 py-3 bg-background-dark/20 rounded-xl border border-border-green/10">
                <p className="text-xs text-text-muted italic">No weak spots recorded yet.</p>
                <button className="text-xs text-primary hover:underline">Mark difficult ayahs</button>
              </div>
            </div> */}

            {revisionTab === 'surah' && (
              <div className="flex flex-col gap-6">
                {/* Start Surah & Ayah Row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end revision-surah-dropdown-container">
                  <div className="sm:col-span-3 flex flex-col gap-2">
                    <label className="text-sm font-medium text-text-muted">Start Surah</label>
                    <div className="relative">
                      <div 
                        onClick={() => setIsRevisionSurahDropdownOpen(!isRevisionSurahDropdownOpen)}
                        className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3.5 px-4 text-white flex items-center justify-between cursor-pointer hover:border-primary/30 transition-colors"
                      >
                        <span className={selectedRevisionSurah ? "font-bold" : "text-text-muted/50 font-medium"}>
                          {selectedRevisionSurah ? `${selectedRevisionSurah.number}. ${selectedRevisionSurah.name}` : "Select Start Surah..."}
                        </span>
                        <ChevronDown size={20} className={`text-text-muted transition-transform ${isRevisionSurahDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>

                      {isRevisionSurahDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-surface-dark border border-border-green/30 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="p-3 border-b border-border-green/20">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                              <input 
                                autoFocus
                                type="text"
                                value={revisionSurahSearch}
                                onChange={(e) => setRevisionSurahSearch(e.target.value)}
                                placeholder="Search surah..."
                                className="w-full bg-background-dark/50 border border-border-green/20 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                              />
                            </div>
                          </div>
                          <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                            {filteredRevisionSurahs.map((surah) => (
                              <div 
                                key={surah.number}
                                onClick={() => {
                                  setSelectedRevisionSurah(surah);
                                  setIsRevisionSurahDropdownOpen(false);
                                  setRevisionSurahSearch('');
                                  // Automatically set end surah if not set
                                  if (!selectedEndRevisionSurah) setSelectedEndRevisionSurah(surah);
                                  // Reset start ayah to 1 when surah changes
                                  setRevisionStart('1');
                                }}
                                className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-primary/5 transition-colors ${selectedRevisionSurah?.number === surah.number ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-white'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-bold w-6 h-6 flex items-center justify-center bg-background-dark/50 rounded-md border border-border-green/20">
                                    {surah.number}
                                  </span>
                                  <span className="font-bold">{surah.name}</span>
                                </div>
                                <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{surah.ayah_count} Ayahs</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="sm:col-span-1 flex flex-col gap-2">
                    <label className="text-sm font-medium text-text-muted">Start Ayah</label>
                    <input 
                      type="number" 
                      min="1"
                      max={selectedRevisionSurah?.ayah_count}
                      value={revisionStart}
                      onChange={(e) => setRevisionStart(e.target.value)}
                      placeholder="1"
                      className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3.5 px-4 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-muted/20"
                    />
                  </div>
                </div>

                {/* End Surah & Ayah Row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end end-revision-surah-dropdown-container">
                  <div className="sm:col-span-3 flex flex-col gap-2">
                    <label className="text-sm font-medium text-text-muted">End Surah</label>
                    <div className="relative">
                      <div 
                        onClick={() => setIsEndRevisionSurahDropdownOpen(!isEndRevisionSurahDropdownOpen)}
                        className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3.5 px-4 text-white flex items-center justify-between cursor-pointer hover:border-primary/30 transition-colors"
                      >
                        <span className={selectedEndRevisionSurah ? "font-bold" : "text-text-muted/50 font-medium"}>
                          {selectedEndRevisionSurah ? `${selectedEndRevisionSurah.number}. ${selectedEndRevisionSurah.name}` : "Select End Surah..."}
                        </span>
                        <ChevronDown size={20} className={`text-text-muted transition-transform ${isEndRevisionSurahDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>

                      {isEndRevisionSurahDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-surface-dark border border-border-green/30 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="p-3 border-b border-border-green/20">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                              <input 
                                autoFocus
                                type="text"
                                value={endRevisionSurahSearch}
                                onChange={(e) => setEndRevisionSurahSearch(e.target.value)}
                                placeholder="Search surah..."
                                className="w-full bg-background-dark/50 border border-border-green/20 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                              />
                            </div>
                          </div>
                          <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                            {filteredEndRevisionSurahs.map((surah) => (
                              <div 
                                key={surah.number}
                                onClick={() => {
                                  setSelectedEndRevisionSurah(surah);
                                  setIsEndRevisionSurahDropdownOpen(false);
                                  setEndRevisionSurahSearch('');
                                  // Set end ayah to total ayah count by default
                                  setRevisionEnd(surah.ayah_count.toString());
                                }}
                                className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-primary/5 transition-colors ${selectedEndRevisionSurah?.number === surah.number ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-white'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-bold w-6 h-6 flex items-center justify-center bg-background-dark/50 rounded-md border border-border-green/20">
                                    {surah.number}
                                  </span>
                                  <span className="font-bold">{surah.name}</span>
                                </div>
                                <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{surah.ayah_count} Ayahs</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="sm:col-span-1 flex flex-col gap-2">
                    <label className="text-sm font-medium text-text-muted">End Ayah</label>
                    <input 
                      type="number" 
                      min="1"
                      max={selectedEndRevisionSurah?.ayah_count}
                      value={revisionEnd}
                      onChange={(e) => setRevisionEnd(e.target.value)}
                      placeholder={selectedEndRevisionSurah?.ayah_count.toString() || "#"}
                      className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3.5 px-4 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-muted/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {revisionTab === 'page' && (
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Start Page</label>
                  <input 
                    type="number" 
                    min="1"
                    value={revisionStart}
                    onChange={(e) => setRevisionStart(e.target.value)}
                    placeholder="#"
                    className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3.5 px-4 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-muted/20"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">End Page</label>
                  <input 
                    type="number" 
                    min="1"
                    value={revisionEnd}
                    onChange={(e) => setRevisionEnd(e.target.value)}
                    placeholder="#"
                    className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3.5 px-4 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-muted/20"
                  />
                </div>
              </div>
            )}


            {/* Progress Section */}
            <div className="bg-background-dark/30 border border-border-green/20 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">Revision Progress</span>
                <span className="text-sm font-bold text-white">
                  {revisionTab === 'page' 
                    ? `${Number(revisionEnd) - Number(revisionStart) >= 0 && revisionStart !== '' ? Number(revisionEnd) - Number(revisionStart) + 1 : 0} Pages`
                    : selectedRevisionSurah && selectedEndRevisionSurah && selectedRevisionSurah.number !== selectedEndRevisionSurah.number
                      ? `${selectedEndRevisionSurah.number - selectedRevisionSurah.number + 1} Surahs`
                      : `${Number(revisionEnd) - Number(revisionStart) >= 0 && revisionStart !== '' ? Number(revisionEnd) - Number(revisionStart) + 1 : (selectedRevisionSurah?.ayah_count || 0)} Ayahs`
                  }
                </span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ 
                    width: revisionTab === 'page' 
                      ? `${Math.min(100, ((Number(revisionEnd) - Number(revisionStart) + 1) / 20) * 100)}%`
                      : selectedRevisionSurah && selectedEndRevisionSurah && selectedRevisionSurah.number !== selectedEndRevisionSurah.number
                        ? `${Math.min(100, ((selectedEndRevisionSurah.number - selectedRevisionSurah.number + 1) / 5) * 100)}%`
                        : selectedRevisionSurah 
                          ? `${Math.min(100, ((Number(revisionEnd) - Number(revisionStart) + 1) || selectedRevisionSurah.ayah_count) / selectedRevisionSurah.ayah_count * 100)}%`
                          : '0%'
                  }}
                ></div>
              </div>
              <p className="text-xs font-medium text-text-muted">
                {revisionTab === 'page' ? `Daily target: ${student?.daily_revision_target || 20} pages` : 
                 selectedRevisionSurah && selectedEndRevisionSurah && selectedRevisionSurah.number !== selectedEndRevisionSurah.number
                   ? 'Target: 5 Surahs'
                   : `Target: ${selectedRevisionSurah?.ayah_count || 0} Ayahs`}
              </p>
            </div>

            <label className="flex items-center gap-3 p-4 bg-background-dark/30 border border-border-green/20 rounded-xl cursor-pointer hover:bg-background-dark/50 transition-colors group">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  checked={isRevisionCompleted}
                  onChange={(e) => setIsRevisionCompleted(e.target.checked)}
                  className="peer appearance-none w-6 h-6 border-2 border-border-green/30 rounded-lg checked:bg-primary checked:border-primary transition-all cursor-pointer" 
                />
                <CheckCircle2 size={16} className="absolute left-1 top-1 text-background-dark opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
              </div>
              <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">Completed current revision target?</span>
            </label>

            {/* Revision Performance Rating */}
            <div className="border-t border-border-green/20 pt-4">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Revision Rating</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Revision performance rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      role="radio"
                      aria-checked={revisionRating === star}
                      aria-label={`Rate revision ${star} out of 5 — ${star === 1 ? 'Very Poor' : star === 2 ? 'Poor' : star === 3 ? 'Average' : star === 4 ? 'Good' : 'Excellent'}`}
                      onClick={() => setRevisionRating(star)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                        revisionRating >= star
                          ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-400/50'
                          : 'bg-background-dark/50 text-text-muted/40 border border-border-green/30 hover:border-blue-400/30 hover:text-blue-400/60'
                      }`}
                    >
                      <Star size={18} fill={revisionRating >= star ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-bold text-blue-400" aria-live="polite">
                  {revisionRating === 1 ? 'Very Poor — Major errors, unable to recall' :
                   revisionRating === 2 ? 'Poor — Frequent mistakes, needs prompting' :
                   revisionRating === 3 ? 'Average — Some errors, moderate fluency' :
                   revisionRating === 4 ? 'Good — Minor errors, good fluency' :
                   'Excellent — Flawless recitation, perfect tajweed'}
                </p>
                <details className="text-[10px] text-text-muted/60 leading-relaxed">
                  <summary className="cursor-pointer hover:text-text-muted transition-colors">Rating Criteria</summary>
                  <ul className="mt-1 space-y-0.5 pl-3 list-disc">
                    <li>1 — 5+ errors per page; needs constant correction</li>
                    <li>2 — 3-4 errors per page; frequent prompting</li>
                    <li>3 — 1-2 errors per page; occasional prompting</li>
                    <li>4 — Minor errors; mostly self-correcting</li>
                    <li>5 — No errors; perfect fluency and tajweed</li>
                  </ul>
                </details>
              </div>
            </div>

            <div className="border-t border-border-green/20 pt-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-muted">Revision Notes</label>
                <textarea
                  value={revisionNoteContent}
                  onChange={(e) => setRevisionNoteContent(e.target.value)}
                  placeholder="Enter specific feedback..."
                  className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl p-4 text-white placeholder:text-text-muted/30 focus:outline-none focus:border-blue-400/50 transition-colors min-h-[100px] resize-none font-medium"
                  maxLength={5000}
                ></textarea>
              </div>
            </div>

            {/* Revision History Panel */}
            <div className="border-t border-border-green/20 pt-4">
              <button
                onClick={() => setExpandedHistory(expandedHistory === 'revision' ? null : 'revision')}
                className="flex items-center gap-2 text-sm text-text-muted hover:text-white transition-colors"
              >
                <History size={16} />
                <span>View Previous Revision ({totalRevision})</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${expandedHistory === 'revision' ? 'rotate-180' : ''}`}
                />
              </button>

              {expandedHistory === 'revision' && (
                <div className="mt-3 space-y-2">
                  {isHistoryLoading ? (
                    <div className="flex items-center gap-2 text-text-muted py-2">
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-xs">Loading history...</span>
                    </div>
                  ) : revisionHistory.length > 0 ? (
                    <>
                      {revisionHistory.map((record) => (
                        <div
                          key={record.id}
                          className="p-3 bg-background-dark/30 rounded-lg border border-border-green/10"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white text-sm">
                              {record.type === 'page'
                                ? `Pages ${record.startPage}-${record.endPage}`
                                : record.startSurah && record.endSurah
                                  ? `${record.startSurah} - ${record.endSurah}`
                                  : record.surahName || `Surah`}
                            </span>
                            <span className="text-xs text-text-muted">
                              {record.sessionDate}
                            </span>
                          </div>
                          {record.type === 'surah' && record.startAyah && record.endAyah && (
                            <p className="text-xs text-text-muted mt-1">
                              Ayahs {record.startAyah}-{record.endAyah}
                            </p>
                          )}
                          {record.notes && (
                            <p className="text-xs text-text-muted/70 mt-1 italic">
                              {record.notes}
                            </p>
                          )}
                          {record.rating && (
                            <div className="flex items-center gap-0.5 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={10}
                                  className={star <= record.rating! ? 'text-blue-400' : 'text-text-muted/30'}
                                  fill={star <= record.rating! ? 'currentColor' : 'none'}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Pagination Controls */}
                      {totalRevision > HISTORY_LIMIT && (
                        <div className="flex items-center justify-between pt-2 px-1">
                          <button
                            disabled={revisionPage === 1 || isHistoryLoading}
                            onClick={() => setRevisionPage(p => p - 1)}
                            className="text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            Previous
                          </button>
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                            Page {revisionPage} of {Math.ceil(totalRevision / HISTORY_LIMIT)}
                          </span>
                          <button
                            disabled={revisionPage >= Math.ceil(totalRevision / HISTORY_LIMIT) || isHistoryLoading}
                            onClick={() => setRevisionPage(p => p + 1)}
                            className="text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-text-muted italic py-2">
                      No previous Revision records found.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleSaveRevision}
            disabled={isSubmittingRevision || revisionSaved}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/10 disabled:opacity-50"
          >
            {isSubmittingRevision ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
            {revisionSaved ? 'Revision Saved' : 'Save Revision Record'}
          </button>

        </div>

      </div>

      {/* Footer Actions */}
      <div className="flex flex-col gap-4 py-6 border-t border-border-green/20">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/students')}
            className="text-sm font-bold text-text-muted hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => navigate('/students')}
            className="px-8 py-3.5 bg-primary hover:bg-primary-hover text-background-dark rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
          >
            <CheckCircle2 size={20} />
            Done
          </button>
        </div>
      </div>

    </div>
  );
};
