import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';

const ManageOwners: React.FC = () => {
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'super', password: '' });

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/owner/manage/owners', { credentials: 'include' });
      const result = await res.json();
      setOwners(result.data || result || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchOwners(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { name: form.name, email: form.email, phone: form.phone, role: form.role, password: form.password };
      const res = await apiFetch('/api/owner/manage/owners', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Create failed');
      await fetchOwners();
      setShowCreate(false);
    } catch (err: any) { setError(err.message); }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete owner?')) return;
    await apiFetch(`/api/owner/manage/owners/${id}`, { method: 'DELETE', credentials: 'include' });
    await fetchOwners();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Manage System Owners</h2>
        <button onClick={() => setShowCreate(s => !s)} className="px-4 py-2 bg-primary rounded">{showCreate ? 'Cancel' : 'Create Owner'}</button>
      </div>

      {showCreate && (
        <form onSubmit={create} className="mb-6 bg-surface-dark p-4 rounded">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Name" className="p-2 bg-background-dark rounded" required />
            <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Email" className="p-2 bg-background-dark rounded" required />
            <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="Phone" className="p-2 bg-background-dark rounded" />
            <input value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Password" className="p-2 bg-background-dark rounded" required />
          </div>
          <div className="mt-3"><button className="px-4 py-2 bg-primary rounded">Create</button></div>
        </form>
      )}

      {loading ? <div>Loading...</div> : (
        <div className="space-y-3">
          {owners.map(o => (
            <div key={o.id} className="bg-surface-dark p-3 rounded flex justify-between items-center">
              <div>
                <div className="font-bold">{o.name}</div>
                <div className="text-text-muted text-sm">{o.email} • {o.role}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>remove(o.id)} className="text-red-400">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <div className="text-red-400 mt-3">{error}</div>}
    </div>
  );
};

export default ManageOwners;
