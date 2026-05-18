import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';

const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/owner/manage/users', { credentials: 'include' });
      const result = await res.json();
      setUsers(result.data || result || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const remove = async (id: number) => {
    if (!confirm('Delete user?')) return;
    await apiFetch(`/api/owner/manage/users/${id}`, { method: 'DELETE', credentials: 'include' });
    await fetchUsers();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Manage Users</h2>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="bg-surface-dark p-3 rounded flex justify-between items-center">
              <div>
                <div className="font-bold">{u.first_name} {u.last_name || ''}</div>
                <div className="text-text-muted text-sm">{u.email}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>remove(u.id)} className="text-red-400">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <div className="text-red-400 mt-3">{error}</div>}
    </div>
  );
};

export default ManageUsers;
