import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  RotateCcw, 
  Star, 
  PenTool, 
  Calendar, 
  ChevronDown, 
  CheckCircle2,
  X,
  ArrowLeft,
  History,
  Loader2,
  AlertCircle,
  Search
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router';

interface Student {
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

export const DailySession: React.FC = () => {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [isSurahDropdownOpen, setIsSurahDropdownOpen] = useState(false);
  const [surahSearch, setSurahSearch] = useState('');

  const [selectedRevisionSurah, setSelectedRevisionSurah] = useState<Surah | null>(null);
  const [isRevisionSurahDropdownOpen, setIsRevisionSurahDropdownOpen] = useState(false);
  const [revisionSurahSearch, setRevisionSurahSearch] = useState('');
  
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
    };

    if (isSurahDropdownOpen || isRevisionSurahDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSurahDropdownOpen, isRevisionSurahDropdownOpen]);

  const filteredSurahs = surahs.filter(s => 
    s.name.toLowerCase().includes(surahSearch.toLowerCase()) || 
    s.number.toString().includes(surahSearch)
  );

  const filteredRevisionSurahs = surahs.filter(s => 
    s.name.toLowerCase().includes(revisionSurahSearch.toLowerCase()) || 
    s.number.toString().includes(revisionSurahSearch)
  );

  const [rating, setRating] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hifz states
  const [hifzStartAyah, setHifzStartAyah] = useState('1');
  const [hifzEndAyah, setHifzEndAyah] = useState('');
  const [isHifzCompleted, setIsHifzCompleted] = useState(false);
  const [hifzNotes, setHifzNotes] = useState('');

  // Revision states
  const [revisionTab, setRevisionTab] = useState<'page' | 'surah'>('page');
  const [revisionStart, setRevisionStart] = useState('');
  const [revisionEnd, setRevisionEnd] = useState('');
  const [isRevisionCompleted, setIsRevisionCompleted] = useState(false);
  
  // Attendance state
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent' | 'late'>('present');
  
  const [instructorNotes, setInstructorNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      if (!studentId) {
        setError('Missing student ID');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/users/students/${studentId}`);
        if (!response.ok) throw new Error('Failed to fetch student details');
        const data = await response.json();
        setStudent(data.student);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudent();
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

  const handleSaveSession = async () => {
    if (!studentId) {
      setValidationError('Student ID is missing');
      return;
    }
    
    const studentIdNum = Number(studentId);
    if (!Number.isInteger(studentIdNum) || studentIdNum <= 0) {
      setValidationError('Invalid student ID');
      return;
    }
    
    setValidationError(null);

    // Validation
    const isAbsent = attendanceStatus === 'absent';
    const hasHifz = !isAbsent && !!selectedSurah && hifzStartAyah !== '' && hifzEndAyah !== '';
    const hasRevision = !isAbsent && ((revisionTab === 'surah' && !!selectedRevisionSurah && revisionStart !== '' && revisionEnd !== '') || 
                        (revisionTab === 'page' && revisionStart !== '' && revisionEnd !== ''));

    if (!isAbsent && !hasHifz && !hasRevision) {
      setValidationError('Please provide at least a Hifz or Revision record with all required fields');
      return;
    }

    // Hifz validation
    if (!isAbsent && hasHifz) {
      if (!hifzStartAyah || !hifzEndAyah) {
        setValidationError('Please specify the ayah range for Hifz');
        return;
      }
      const startAyah = Number(hifzStartAyah);
      const endAyah = Number(hifzEndAyah);
      
      if (!Number.isInteger(startAyah) || !Number.isInteger(endAyah)) {
        setValidationError('Ayah numbers must be whole numbers');
        return;
      }
      if (startAyah <= 0 || endAyah <= 0) {
        setValidationError('Ayah numbers must be positive');
        return;
      }
      if (startAyah > endAyah) {
        setValidationError('Hifz start ayah cannot be greater than end ayah');
        return;
      }
      if (endAyah > selectedSurah.ayah_count) {
        setValidationError(`Hifz end ayah cannot be more than ${selectedSurah.ayah_count} (total ayahs in ${selectedSurah.name})`);
        return;
      }
      // Validate Hifz notes length if provided
      if (hifzNotes.trim() !== '' && hifzNotes.trim().length < 3) {
        setValidationError('Hifz notes should be at least 3 characters long');
        return;
      }
    }

    // Revision validation
    if (hasRevision) {
      if (revisionTab === 'page') {
        if (!revisionStart || !revisionEnd) {
          setValidationError('Please specify the page range for Revision');
          return;
        }
        const startPage = Number(revisionStart);
        const endPage = Number(revisionEnd);
        
        if (!Number.isInteger(startPage) || !Number.isInteger(endPage)) {
          setValidationError('Page numbers must be whole numbers');
          return;
        }
        // Additional validation for page numbers
        if (startPage <= 0 || endPage <= 0) {
          setValidationError('Page numbers must be positive');
          return;
        }
        if (startPage > endPage) {
          setValidationError('Revision start page cannot be greater than end page');
          return;
        }
      } else if (revisionTab === 'surah') {
        if (!selectedRevisionSurah) {
          setValidationError('Please select a revision surah');
          return;
        }
        if (!revisionStart || !revisionEnd) {
          setValidationError('Please specify the ayah range for Revision');
          return;
        }
        const startAyah = Number(revisionStart);
        const endAyah = Number(revisionEnd);
        
        if (!Number.isInteger(startAyah) || !Number.isInteger(endAyah)) {
          setValidationError('Ayah numbers must be whole numbers');
          return;
        }
        if (startAyah <= 0 || endAyah <= 0) {
          setValidationError('Ayah numbers must be positive');
          return;
        }
        if (startAyah > endAyah) {
          setValidationError('Revision start ayah cannot be greater than end ayah');
          return;
        }
        if (endAyah > selectedRevisionSurah.ayah_count) {
          setValidationError(`Revision end ayah cannot be more than ${selectedRevisionSurah.ayah_count} (total ayahs in ${selectedRevisionSurah.name})`);
          return;
        }
      }
    }
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      setValidationError('Please provide a valid performance rating');
      return;
    }
    
    // Validate instructor notes (optional but if provided, should not be just whitespace)
    if (instructorNotes.trim() !== '' && instructorNotes.trim().length < 3) {
      setValidationError('Instructor notes should be at least 3 characters long');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const isAbsent = attendanceStatus === 'absent';
      const sessionData = {
        studentId: Number(studentId),
        sessionDate: new Date().toISOString().split('T')[0],
        attendance: {
          status: attendanceStatus
        },
        notes: instructorNotes,
        hifzRecord: (!isAbsent && selectedSurah) ? {
          surahNumber: selectedSurah.number,
          startAyah: Number(hifzStartAyah),
          endAyah: Number(hifzEndAyah) || selectedSurah.ayah_count,
          isFullSurah: isHifzCompleted,
          notes: hifzNotes
        } : null,
        revisionRecord: (!isAbsent && hasRevision) ? {
          surahNumber: revisionTab === 'surah' && selectedRevisionSurah ? selectedRevisionSurah.number : null,
          startAyah: revisionTab === 'surah' ? (revisionStart ? Number(revisionStart) : 1) : null,
          endAyah: revisionTab === 'surah' && selectedRevisionSurah ? (revisionEnd ? Number(revisionEnd) : selectedRevisionSurah.ayah_count) : null,
          startPage: revisionTab === 'page' ? (revisionStart ? Number(revisionStart) : null) : null,
          endPage: revisionTab === 'page' ? (revisionEnd ? Number(revisionEnd) : null) : null,
          isFullSurah: isRevisionCompleted,
          notes: revisionTab === 'page' ? 'Revision by page' : ''
        } : null,
        rating: rating
      };

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save session');
      }

      // Confirm what was saved from backend
      const memorizationInfo = data.memorizationRecordId ? `Memorization ID: ${data.memorizationRecordId}` : 'No memorization record created';
      const revisionInfo = data.revisionRecordId ? `Revision ID: ${data.revisionRecordId}` : 'No revision record created';
      alert(`Session saved successfully!\n${memorizationInfo}\n${revisionInfo}`);

      navigate('/students');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
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

        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Session Date</span>
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-dark border border-border-green/30 rounded-xl text-white font-bold">
            <Calendar size={18} className="text-text-muted" />
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Hifz & Grading */}
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

          {/* New Lesson (Hifz) */}
          <div className={`bg-surface-dark border border-border-green/30 rounded-2xl p-8 flex flex-col gap-6 transition-all duration-300 ${attendanceStatus === 'absent' ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <BookOpen size={24} />
              </div>
              <h2 className="text-xl font-bold text-white">New Lesson (Hifz)</h2>
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
          </div>

          {/* Grading & Notes */}
          <div className={`bg-surface-dark border border-border-green/30 rounded-2xl p-8 flex flex-col gap-6 transition-all duration-300 ${attendanceStatus === 'absent' ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
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

        </div>

        {/* Right Column: Revision */}
        <div className={`bg-surface-dark border border-border-green/30 rounded-2xl p-8 flex flex-col gap-6 h-full transition-all duration-300 ${attendanceStatus === 'absent' ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <RotateCcw size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Revision (Muraja'ah)</h2>
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
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-text-muted">Recent Weak Spots</label>
              <div className="flex flex-wrap gap-2">
                <p className="text-xs text-text-muted italic">No weak spots recorded yet.</p>
              </div>
            </div>

            {revisionTab === 'surah' && (
              <div className="flex flex-col gap-2 revision-surah-dropdown-container">
                <label className="text-sm font-medium text-text-muted">Revision Surah</label>
                <div className="relative">
                  <div 
                    onClick={() => setIsRevisionSurahDropdownOpen(!isRevisionSurahDropdownOpen)}
                    className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3.5 px-4 text-white flex items-center justify-between cursor-pointer hover:border-primary/30 transition-colors"
                  >
                    <span className={selectedRevisionSurah ? "font-bold" : "text-text-muted/50 font-medium"}>
                      {selectedRevisionSurah ? `${selectedRevisionSurah.number}. ${selectedRevisionSurah.name}` : "Select Surah..."}
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
                            placeholder="Search surah name or number..."
                            className="w-full bg-background-dark/50 border border-border-green/20 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                          />
                        </div>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {filteredRevisionSurahs.length > 0 ? (
                          filteredRevisionSurahs.map((surah) => (
                            <div 
                              key={surah.number}
                              onClick={() => {
                                setSelectedRevisionSurah(surah);
                                setIsRevisionSurahDropdownOpen(false);
                                setRevisionSurahSearch('');
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
            )}

            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Start {revisionTab === 'page' ? 'Page' : 'Ayah'}</label>
                <input 
                  type="number" 
                  min="1"
                  max={revisionTab === 'surah' && selectedRevisionSurah ? selectedRevisionSurah.ayah_count : undefined}
                  value={revisionStart}
                  onChange={(e) => setRevisionStart(e.target.value)}
                  placeholder="#"
                  className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3.5 px-4 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-muted/20"
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">End {revisionTab === 'page' ? 'Page' : 'Ayah'}</label>
                <input 
                  type="number" 
                  min="1"
                  max={revisionTab === 'surah' && selectedRevisionSurah ? selectedRevisionSurah.ayah_count : undefined}
                  value={revisionEnd}
                  onChange={(e) => setRevisionEnd(e.target.value)}
                  placeholder={revisionTab === 'surah' && selectedRevisionSurah ? selectedRevisionSurah.ayah_count.toString() : "#"}
                  className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3.5 px-4 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-muted/20"
                />
              </div>
            </div>

            {/* Progress Section */}
            <div className="bg-background-dark/30 border border-border-green/20 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">Revision Progress</span>
                <span className="text-sm font-bold text-white">
                  {revisionTab === 'page' 
                    ? `${Number(revisionEnd) - Number(revisionStart) >= 0 && revisionStart !== '' ? Number(revisionEnd) - Number(revisionStart) + 1 : 0} Pages`
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
                      : selectedRevisionSurah 
                        ? `${Math.min(100, ((Number(revisionEnd) - Number(revisionStart) + 1) || selectedRevisionSurah.ayah_count) / selectedRevisionSurah.ayah_count * 100)}%`
                        : '0%'
                  }}
                ></div>
              </div>
              <p className="text-xs font-medium text-text-muted">
                {revisionTab === 'page' ? 'Daily target: 20 pages' : `Target: ${selectedRevisionSurah?.ayah_count || 0} Ayahs`}
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
          </div>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="flex flex-col gap-4 py-6 border-t border-border-green/20">
        {validationError && (
          <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 px-4 py-3 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle size={18} />
            <p className="text-sm font-medium">{validationError}</p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/students')}
            className="text-sm font-bold text-text-muted hover:text-white transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-4">
            <button 
              disabled={isSubmitting}
              className="px-8 py-3.5 rounded-xl text-sm font-bold text-white border border-border-green/30 hover:bg-white/5 transition-all disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button 
              onClick={handleSaveSession}
              disabled={isSubmitting}
              className="px-8 py-3.5 bg-primary hover:bg-primary-hover text-background-dark rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <CheckCircle2 size={20} />
              )}
              Save Session
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

const Plus: React.FC<{ size?: number, className?: string }> = ({ size = 16, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
