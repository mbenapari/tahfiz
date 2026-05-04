import React, { useEffect, useState } from 'react';
import { Logo } from '../../components/Logo';
import { Link } from 'react-router-dom';

const MetricCard: React.FC<{ title: string; value: number; color?: string }> = ({ title, value, color }) => (
  <div className="bg-surface-dark border border-border-green/30 rounded-xl p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-text-muted">{title}</div>
        <div className="text-3xl font-bold text-white mt-2">{value}</div>
      </div>
      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
        <Logo className="w-6 h-6 text-primary" />
      </div>
    </div>
  </div>
);

const OwnerDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<{ totalUsers: number; totalSystemOwners: number; totalSchools: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/stats/platform', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load metrics');
        const data = await res.json();
        setMetrics(data);
      } catch (err: any) {
        setError(err.message || 'Error fetching metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <main className="max-w-6xl mx-auto p-6 md:p-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Owner Dashboard</h1>
        <div className="text-text-muted">Manage platform-wide settings and overview</div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard title="Total Users" value={metrics?.totalUsers ?? 0} />
          <MetricCard title="System Owners" value={metrics?.totalSystemOwners ?? 0} />
          <MetricCard title="Total Schools" value={metrics?.totalSchools ?? 0} />
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-bold mb-4">Quick Links</h2>
        <div className="flex gap-4 flex-wrap">
          <Link to="/schools" className="px-4 py-2 bg-surface-dark border border-border-green/30 rounded-md hover:bg-primary/5">Manage Schools</Link>
          <Link to="/users" className="px-4 py-2 bg-surface-dark border border-border-green/30 rounded-md hover:bg-primary/5">Manage Users</Link>
          <Link to="/settings" className="px-4 py-2 bg-surface-dark border border-border-green/30 rounded-md hover:bg-primary/5">Platform Settings</Link>
        </div>
      </div>
    </main>
  );
};

export default OwnerDashboard;
