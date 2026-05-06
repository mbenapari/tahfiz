import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  MoreVertical, 
  Loader2,
  Trash2,
  AlertCircle,
  Edit2,
  Search,
  Mail,
  Phone,
  User
} from 'lucide-react';
import { Tooltip } from '../../components/Tooltip';

interface Instructor {
  id: number;
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  role: string;
  tenantId: number;
  created_at?: string;
}

export const Instructors: React.FC = () => {
  const [instructorsList, setInstructorsList] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInstructors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/users/instructors');
      if (!response.ok) {
        throw new Error('Failed to fetch instructors');
      }
      const data = await response.json();
      setInstructorsList(data.instructors || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching instructors:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  const filteredInstructors = instructorsList.filter(instructor =>
    instructor.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    instructor.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    instructor.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.firstName || !formData.email || (!editingInstructor && !formData.password)) {
      setFormError('First name, email, and password are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = editingInstructor 
        ? `/api/users/instructors/${editingInstructor.id}`
        : '/api/users/instructors';
      
      const method = editingInstructor ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save instructor');
      }

      if (editingInstructor) {
        // Update
        setInstructorsList(prev =>
          prev.map(i => i.id === editingInstructor.id ? data.instructor : i)
        );
      } else {
        // Create
        setInstructorsList(prev => [data.instructor, ...prev]);
      }

      resetForm();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this instructor? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/instructors/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setInstructorsList(prev => prev.filter(i => i.id !== id));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete instructor');
      }
    } catch (err) {
      console.error('Error deleting instructor:', err);
      alert('An error occurred while deleting the instructor');
    }
  };

  const handleEdit = (instructor: Instructor) => {
    setEditingInstructor(instructor);
    setFormData({
      firstName: instructor.first_name,
      lastName: instructor.last_name || '',
      email: instructor.email,
      phone: instructor.phone || '',
      password: '',
    });
    setShowCreateForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', phone: '', password: '' });
    setShowCreateForm(false);
    setEditingInstructor(null);
    setFormError(null);
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">Instructors</h1>
          <p className="text-sm md:text-base text-text-muted">Manage staff and lesson assignments.</p>
        </div>
        {!showCreateForm && (
          <button 
            onClick={() => {
              setShowCreateForm(true);
              setEditingInstructor(null);
              setFormData({ firstName: '', lastName: '', email: '', phone: '', password: '' });
            }}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-background-dark px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 w-full md:w-auto"
          >
            <Plus size={20} />
            Add Instructor
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-surface-dark border border-border-green/30 rounded-2xl p-5 md:p-8">
          <h2 className="text-xl font-bold text-white mb-6">
            {editingInstructor ? 'Edit Instructor' : 'Add New Instructor'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {formError && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {/* First Name */}
              <div className="flex flex-col gap-2">
                <label className="text-xs md:text-sm font-bold text-white">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                  className="bg-white/5 border border-border-green/20 rounded-xl px-4 py-2.5 text-sm md:text-base text-white placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
                  required
                />
              </div>

              {/* Last Name */}
              <div className="flex flex-col gap-2">
                <label className="text-xs md:text-sm font-bold text-white">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                  className="bg-white/5 border border-border-green/20 rounded-xl px-4 py-2.5 text-sm md:text-base text-white placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-xs md:text-sm font-bold text-white">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@school.com"
                  className="bg-white/5 border border-border-green/20 rounded-xl px-4 py-2.5 text-sm md:text-base text-white placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
                  required
                />
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-2">
                <label className="text-xs md:text-sm font-bold text-white">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="bg-white/5 border border-border-green/20 rounded-xl px-4 py-2.5 text-sm md:text-base text-white placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-1">
                <label className="text-xs md:text-sm font-bold text-white">
                  {editingInstructor ? 'New Password (leave blank to keep current)' : 'Password *'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="bg-white/5 border border-border-green/20 rounded-xl px-4 py-2.5 text-sm md:text-base text-white placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
                  required={!editingInstructor}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-background-dark px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 w-full sm:w-auto"
              >
                {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                {editingInstructor ? 'Update Instructor' : 'Create Instructor'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 rounded-xl font-bold text-text-muted hover:text-white hover:bg-white/5 transition-colors w-full sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      {!showCreateForm && (
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..." 
            className="w-full bg-surface-dark border border-border-green/30 rounded-xl py-2.5 pl-11 pr-4 text-sm md:text-base text-white placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      )}

      {/* Instructors List Container */}
      <div className="bg-surface-dark border border-border-green/30 rounded-2xl overflow-hidden min-h-[400px] flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-text-muted">
            <Loader2 size={40} className="animate-spin text-primary" />
            <p className="font-medium text-sm">Loading instructors...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-red-400 p-8 text-center">
            <AlertCircle size={40} />
            <div>
              <p className="font-bold text-lg">Failed to load instructors</p>
              <p className="text-sm opacity-80 mt-1">{error}</p>
            </div>
            <button 
              onClick={() => fetchInstructors()}
              className="mt-2 px-6 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-sm font-bold transition-all"
            >
              Try Again
            </button>
          </div>
        ) : filteredInstructors.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-text-muted p-8 text-center">
            <div className="p-4 rounded-full bg-white/5">
              <User size={32} />
            </div>
            <div>
              <p className="font-bold text-lg text-white">No instructors found</p>
              <p className="text-sm mt-1">
                {searchQuery ? `No results for "${searchQuery}"` : 'Get started by adding your first instructor.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-green/20">
                    <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Date Added</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-green/10">
                  {filteredInstructors.map((instructor) => (
                    <tr key={instructor.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-border-green/20 bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {instructor.first_name[0]}{instructor.last_name ? instructor.last_name[0] : ''}
                          </div>
                          <p className="text-sm font-bold text-white">
                            {instructor.first_name} {instructor.last_name || ''}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm text-text-muted">
                          <Mail size={14} />
                          {instructor.email}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm text-text-muted">
                          {instructor.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone size={14} />
                              {instructor.phone}
                            </div>
                          ) : (
                            <span className="text-text-muted/50">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm text-text-muted">
                          {instructor.created_at 
                            ? new Date(instructor.created_at).toLocaleDateString() 
                            : '-'}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <Tooltip text="Edit instructor" position="bottom">
                            <button
                              onClick={() => handleEdit(instructor)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-text-muted hover:text-primary"
                            >
                              <Edit2 size={16} />
                            </button>
                          </Tooltip>
                          <Tooltip text="Delete instructor" position="bottom">
                            <button
                              onClick={() => handleDelete(instructor.id)}
                              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-text-muted hover:text-red-400"
                            >
                              <Trash2 size={16} />
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
              {filteredInstructors.map((instructor) => (
                <div key={instructor.id} className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-border-green/20 bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {instructor.first_name[0]}{instructor.last_name ? instructor.last_name[0] : ''}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {instructor.first_name} {instructor.last_name || ''}
                        </p>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">Instructor</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(instructor)}
                        className="p-2 text-text-muted hover:text-primary"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(instructor.id)}
                        className="p-2 text-text-muted hover:text-red-400"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-text-muted">
                      <Mail size={14} className="text-primary/70" />
                      <span className="truncate">{instructor.email}</span>
                    </div>
                    {instructor.phone && (
                      <div className="flex items-center gap-2 text-xs md:text-sm text-text-muted">
                        <Phone size={14} className="text-primary/70" />
                        <span>{instructor.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-text-muted/70 italic sm:col-span-2">
                      <span>Added on {instructor.created_at ? new Date(instructor.created_at).toLocaleDateString() : '-'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
};