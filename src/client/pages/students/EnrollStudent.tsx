import React, { useState, useEffect, useCallback } from 'react';
import { 
  UserPlus, 
  Search, 
  X, 
  Calendar, 
  ChevronDown, 
  CheckCircle2,
  Users,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';

interface UserSearchResult {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export const EnrollStudent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth } = useAuth();
  
  const searchParams = new URLSearchParams(location.search);
  const isOnboarding = searchParams.get('mode') === 'onboarding';

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState({
    enrolledOn: new Date().toISOString().split('T')[0],
    status: 'Active',
    notes: ''
  });

  const [showCreateForm, setShowCreateForm] = useState(isOnboarding);
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    studentIdentifier: ''
  });

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/students/search?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        // The backend returns { students: [...] } for this endpoint
        setSearchResults(data.students || data.users || []);
      } else if (response.status === 403) {
        console.error('Search error: Forbidden (403). Possible missing tenant ID.');
        setSearchResults([]);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const handleEnroll = async () => {
    if (!selectedUser && !showCreateForm) {
      alert('Please select a student or create a new one');
      return;
    }

    setIsSubmitting(true);
    try {
      let body;
      if (showCreateForm) {
        body = {
          ...newUserData,
          enrolledOn: enrollmentData.enrolledOn,
          notes: enrollmentData.notes
        };
      } else if (selectedUser) {
        body = {
          userId: selectedUser.id,
          enrolledOn: enrollmentData.enrolledOn,
          notes: enrollmentData.notes
        };
      } else {
        alert('Please select a student or create a new one');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/users/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        if (isOnboarding) {
          try {
            await fetch('/api/users/onboarding/complete', { method: 'POST' });
            await checkAuth(); // Refresh user state to reflect onboarding completion
          } catch (err) {
            console.error('Failed to complete onboarding:', err);
          }
        }
        navigate('/students');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to enroll student');
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      alert('An error occurred during enrollment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-12">
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm">
        <Link to="/" className="text-text-muted hover:text-white transition-colors">Home</Link>
        <span className="text-text-muted">/</span>
        <Link to="/students" className="text-text-muted hover:text-white transition-colors">Students</Link>
        <span className="text-text-muted">/</span>
        <span className="text-primary font-medium">Enrollment</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Enroll New Student</h1>
        <p className="text-text-muted">Add a student to the current academic session and set their initial status.</p>
      </div>

      {/* Form Container */}
      <div className="bg-surface-dark border border-border-green/30 rounded-2xl overflow-hidden">
        
        <div className="p-8 flex flex-col gap-10">
          
          {/* Section 1: Student Identity */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Users size={20} />
                </div>
                <h2 className="text-lg font-bold text-white">Student Identity</h2>
              </div>
              {!isOnboarding && (
                <button 
                  onClick={() => {
                    setShowCreateForm(!showCreateForm);
                    setSelectedUser(null);
                  }}
                  className="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                  {showCreateForm ? '← Back to Search' : '+ Create New Student User '}
                </button>
              )}
            </div>

            {!showCreateForm ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Search Student */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-text-muted">Search Student</label>
                  <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or email..." 
                      className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                    {isSearching && (
                      <Loader2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary animate-spin" />
                    )}
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="mt-2 bg-background-dark border border-border-green/30 rounded-xl overflow-hidden shadow-2xl max-h-48 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div 
                          key={user.id}
                          onClick={() => {
                            setSelectedUser(user);
                            setSearchResults([]);
                            setSearchQuery('');
                          }}
                          className="p-3 hover:bg-white/5 cursor-pointer border-b border-border-green/10 last:border-0 transition-colors"
                        >
                          <p className="text-sm font-bold text-white">{user.first_name} {user.last_name}</p>
                          <p className="text-xs text-text-muted">{user.email}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-text-muted/60 mt-1">Search for an existing user account to enroll.</p>
                </div>

                {/* Selected User Display */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-text-muted">Selected User</label>
                  {selectedUser ? (
                    <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/30 rounded-xl group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/20 bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {selectedUser.first_name[0]}{selectedUser.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-tight">{selectedUser.first_name} {selectedUser.last_name}</p>
                          <p className="text-xs text-text-muted">{selectedUser.email}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedUser(null)}
                        className="p-1.5 text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-all"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-4 bg-background-dark/30 border border-dashed border-border-green/30 rounded-xl text-text-muted text-sm italic">
                      No user selected
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-6 rounded-2xl border border-border-green/20">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-text-muted">First Name</label>
                  <input 
                    type="text" 
                    value={newUserData.firstName}
                    onChange={(e) => setNewUserData({...newUserData, firstName: e.target.value})}
                    placeholder="Enter first name" 
                    className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-text-muted">Last Name</label>
                  <input 
                    type="text" 
                    value={newUserData.lastName}
                    onChange={(e) => setNewUserData({...newUserData, lastName: e.target.value})}
                    placeholder="Enter last name" 
                    className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-text-muted">Email Address</label>
                  <input 
                    type="email" 
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                    placeholder="Enter email address" 
                    className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-text-muted">Phone Number</label>
                  <input 
                    type="text" 
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData({...newUserData, phone: e.target.value})}
                    placeholder="Enter phone number" 
                    className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-medium text-text-muted">Student Identifier (Optional)</label>
                  <input 
                    type="text" 
                    value={newUserData.studentIdentifier}
                    onChange={(e) => setNewUserData({...newUserData, studentIdentifier: e.target.value})}
                    placeholder="e.g. ID-2024-001" 
                    className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Enrollment Details */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Calendar size={20} />
              </div>
              <h2 className="text-lg font-bold text-white">Enrollment Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Enrolled On */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-muted">Enrolled On</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={enrollmentData.enrolledOn}
                    onChange={(e) => setEnrollmentData({...enrollmentData, enrolledOn: e.target.value})}
                    className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                  />
                  <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              </div>

              {/* Initial Status */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-muted">Initial Status</label>
                <div className="relative">
                  <select 
                    value={enrollmentData.status}
                    onChange={(e) => setEnrollmentData({...enrollmentData, status: e.target.value})}
                    className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
                <div className="flex">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    {enrollmentData.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Notes & Hifz Goals */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <MessageSquare size={20} />
              </div>
              <h2 className="text-lg font-bold text-white">Notes & Hifz Goals</h2>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-muted">Additional Information</label>
              <textarea 
                value={enrollmentData.notes}
                onChange={(e) => setEnrollmentData({...enrollmentData, notes: e.target.value})}
                placeholder="Enter any initial notes about the student's memorization level, goals, or specific requirements..." 
                className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl p-4 text-white placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors min-h-[120px] resize-none"
              ></textarea>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-background-dark/30 border-t border-border-green/20 flex justify-end items-center gap-4">
          <button 
            onClick={() => navigate('/students')}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-text-muted hover:text-white hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleEnroll}
            disabled={isSubmitting || (!selectedUser && !showCreateForm)}
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-background-dark rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
          >
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <CheckCircle2 size={18} />
            )}
            {isSubmitting ? 'Processing...' : 'Confirm Enrollment'}
          </button>
        </div>

      </div>

    </div>
  );
};
