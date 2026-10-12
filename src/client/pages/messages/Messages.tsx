import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, AlertCircle, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ContactParentModal } from '../../components/ContactParentModal';
import { apiFetch } from '../../utils/api';

interface StudentContact {
  id: number;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

const fullName = (s: StudentContact) => `${s.first_name} ${s.last_name || ''}`.trim();

export const Messages: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<StudentContact | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await apiFetch('/api/users/students');
        if (!response.ok) throw new Error('Failed to fetch students');
        const result = await response.json();
        setStudents(result.data?.students || result.data?.users || result.students || result.users || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [fullName(s), s.email, s.phone].some((v) => v?.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-0">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
        <p className="text-text-muted">Contact students' parents and guardians.</p>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email or phone"
          className="w-full bg-surface-dark border border-border-green/30 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-text-muted">
          <Loader2 size={24} className="animate-spin text-primary" />
          <span>Loading students...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 text-red-400 py-8">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-text-muted italic py-16 text-center">No students found.</div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => setSelected(s)}
                className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left bg-surface-dark border border-border-green/30 hover:border-primary/30 rounded-2xl p-4 transition-all"
              >
                <span className="text-white font-bold">{fullName(s)}</span>
                <span className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
                  <span className="flex items-center gap-1.5"><Mail size={14} />{s.email || 'No email'}</span>
                  <span className="flex items-center gap-1.5"><Phone size={14} />{s.phone || 'No phone'}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <ContactParentModal
          studentName={fullName(selected)}
          email={selected.email}
          phone={selected.phone}
          onClose={() => setSelected(null)}
          onEdit={() => navigate(`/students/${selected.id}`)}
        />
      )}
    </div>
  );
};
