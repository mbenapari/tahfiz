import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';

const ManageSchools: React.FC = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', study_days: JSON.stringify([1,2,3]) });

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/owner/manage/schools', { credentials: 'include' });
      const result = await res.json();
      setSchools(result.data || result || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchSchools(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { name: form.name, slug: form.slug, study_days: JSON.parse(form.study_days) };
      const res = await apiFetch('/api/owner/manage/schools', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Create failed');
      await fetchSchools();
      setShowCreate(false);
    } catch (err: any) { setError(err.message); }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete school?')) return;
    await apiFetch(`/api/owner/manage/schools/${id}`, { method: 'DELETE', credentials: 'include' });
    await fetchSchools();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Manage Schools</h2>
        <button onClick={() => setShowCreate(s => !s)} className="px-4 py-2 bg-primary rounded">{showCreate ? 'Cancel' : 'Create School'}</button>
      </div>

      {showCreate && (
        <form onSubmit={create} className="mb-6 bg-surface-dark p-4 rounded">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Name" className="p-2 bg-background-dark rounded" required />
            <input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} placeholder="Slug" className="p-2 bg-background-dark rounded" required />
            <input value={form.study_days} onChange={e=>setForm({...form,study_days:e.target.value})} placeholder='Study days JSON' className="p-2 bg-background-dark rounded" />
          </div>
          <div className="mt-3"><button className="px-4 py-2 bg-primary rounded">Create</button></div>
        </form>
      )}

      {loading ? <div>Loading...</div> : (
        <div className="space-y-3">
          {schools.map(s => (
            <div key={s.id} className="bg-surface-dark p-3 rounded flex justify-between items-center">
              <div>
                <div className="font-bold">{s.name}</div>
                <div className="text-text-muted text-sm">{s.slug}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>remove(s.id)} className="text-red-400">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <div className="text-red-400 mt-3">{error}</div>}
    </div>
  );
};

export default ManageSchools;
