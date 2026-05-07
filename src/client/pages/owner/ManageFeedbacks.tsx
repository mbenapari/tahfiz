import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Trash2, 
  Search,
  Filter,
  MessageCircle,
  Bug,
  Lightbulb,
  HelpCircle,
  ChevronDown,
  Loader2,
  AlertCircle,
  MoreVertical,
  Phone
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

enum FeedbackStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

enum FeedbackCategory {
  BUG = 'bug',
  FEATURE_REQUEST = 'feature_request',
  GENERAL = 'general',
  UX = 'ux',
  OTHER = 'other',
}

interface FeedbackItem {
  id: number;
  user_id: number;
  tenant_id: number | null;
  category: FeedbackCategory;
  subject: string;
  message: string;
  status: FeedbackStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string | null;
  };
  tenant?: {
    name: string;
  };
}

const ManageFeedbacks: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<FeedbackItem | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchFeedbacks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/api/owner/manage/feedbacks');
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data.feedbacks);
      } else {
        throw new Error('Failed to fetch feedbacks');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching feedbacks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleUpdateStatus = async (id: number, status: FeedbackStatus, adminNotes?: string) => {
    setIsUpdating(true);
    try {
      const response = await apiFetch(`/api/owner/manage/feedbacks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
      });

      if (response.ok) {
        await fetchFeedbacks();
        setEditingItem(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update feedback');
      }
    } catch (err) {
      alert('An error occurred during update');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const response = await apiFetch(`/api/owner/manage/feedbacks/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFeedbacks(feedbacks.filter(f => f.id !== id));
      } else {
        alert('Failed to delete feedback');
      }
    } catch (err) {
      alert('An error occurred during deletion');
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesSearch = 
      f.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || f.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case FeedbackStatus.PENDING:
        return <span className="flex items-center gap-1.5 text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full"><Clock size={12} /> Pending</span>;
      case FeedbackStatus.REVIEWED:
        return <span className="flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full"><MessageSquare size={12} /> Reviewed</span>;
      case FeedbackStatus.RESOLVED:
        return <span className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full"><CheckCircle2 size={12} /> Resolved</span>;
      case FeedbackStatus.DISMISSED:
        return <span className="flex items-center gap-1.5 text-xs font-bold text-text-muted bg-white/5 px-2 py-1 rounded-full"><XCircle size={12} /> Dismissed</span>;
    }
  };

  const getCategoryIcon = (category: FeedbackCategory) => {
    switch (category) {
      case FeedbackCategory.BUG: return <Bug size={16} className="text-red-400" />;
      case FeedbackCategory.FEATURE_REQUEST: return <Lightbulb size={16} className="text-yellow-400" />;
      case FeedbackCategory.UX: return <MessageSquare size={16} className="text-blue-400" />;
      case FeedbackCategory.GENERAL: return <MessageCircle size={16} className="text-primary" />;
      default: return <HelpCircle size={16} className="text-text-muted" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Feedback</h1>
          <p className="text-text-muted">Review and manage feedback submitted by academy users.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-surface-dark p-4 border border-border-green/20 rounded-2xl">
        <div className="md:col-span-2 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search feedback, users, email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-2.5 pl-11 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div>
          <div className="relative">
            <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-2.5 pl-11 pr-4 text-white appearance-none focus:outline-none focus:border-primary/50"
            >
              <option value="all">All Status</option>
              <option value={FeedbackStatus.PENDING}>Pending</option>
              <option value={FeedbackStatus.REVIEWED}>Reviewed</option>
              <option value={FeedbackStatus.RESOLVED}>Resolved</option>
              <option value={FeedbackStatus.DISMISSED}>Dismissed</option>
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
        </div>
        <button 
          onClick={fetchFeedbacks}
          className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl font-bold py-2.5 transition-all flex items-center justify-center gap-2"
        >
          Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 size={40} className="text-primary animate-spin" />
          <p className="text-text-muted font-medium">Loading feedback...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center flex flex-col items-center gap-4">
          <AlertCircle size={40} className="text-red-400" />
          <div className="text-white font-bold text-lg">{error}</div>
          <button onClick={fetchFeedbacks} className="text-primary font-bold hover:underline">Try Again</button>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="bg-surface-dark border border-border-green/20 rounded-2xl p-12 text-center flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-white/5">
            <MessageSquare size={32} className="text-text-muted" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">No feedback found</p>
            <p className="text-text-muted">Try adjusting your search or filters.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredFeedbacks.map((item) => (
            <div 
              key={item.id} 
              className="bg-surface-dark border border-border-green/20 rounded-2xl overflow-hidden hover:border-primary/30 transition-all group"
            >
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(item.status)}
                      <div className="flex items-center gap-1.5 text-xs font-bold text-text-muted uppercase tracking-wider">
                        {getCategoryIcon(item.category)}
                        {item.category.replace('_', ' ')}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-2">{item.subject}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setEditingItem(item)}
                      className="p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                      <MoreVertical size={20} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="text-text-muted leading-relaxed whitespace-pre-wrap">
                  {item.message}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border-green/10 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {item.user.first_name[0]}{item.user.last_name[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">{item.user.first_name} {item.user.last_name}</span>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-xs text-text-muted">{item.user.email}</span>
                        {item.user.phone && (
                          <span className="text-xs text-text-muted flex items-center gap-1">
                            <Phone size={10} className="text-primary" />
                            {item.user.phone}
                          </span>
                        )}
                        {item.tenant && (
                          <span className="text-xs text-text-muted">• {item.tenant.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-text-muted font-medium">
                    Submitted on {new Date(item.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </div>
                </div>

                {item.admin_notes && (
                  <div className="mt-4 p-4 bg-primary/5 border border-primary/10 rounded-xl flex flex-col gap-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">Admin Note</span>
                    <p className="text-sm text-text-muted italic">"{item.admin_notes}"</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Action Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-surface-dark border border-border-green/30 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border-green/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Manage Feedback</h2>
              <button onClick={() => setEditingItem(null)} className="p-2 text-text-muted hover:text-white rounded-lg">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-white uppercase tracking-widest">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {[FeedbackStatus.PENDING, FeedbackStatus.REVIEWED, FeedbackStatus.RESOLVED, FeedbackStatus.DISMISSED].map((status) => (
                    <button
                      key={status}
                      onClick={() => setEditingItem({ ...editingItem, status })}
                      className={`
                        py-2.5 px-4 rounded-xl border font-bold text-sm transition-all
                        ${editingItem.status === status 
                          ? 'bg-primary text-background-dark border-primary' 
                          : 'bg-background-dark/30 border-border-green/10 text-text-muted hover:border-border-green/30'
                        }
                      `}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-white uppercase tracking-widest">Admin Notes</label>
                <textarea
                  value={editingItem.admin_notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, admin_notes: e.target.value })}
                  placeholder="Internal notes about this feedback..."
                  className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl p-4 text-white focus:outline-none focus:border-primary/50 min-h-[120px] resize-none"
                ></textarea>
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-text-muted hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleUpdateStatus(editingItem.id, editingItem.status, editingItem.admin_notes || '')}
                  disabled={isUpdating}
                  className="flex-1 py-3 px-4 bg-primary hover:bg-primary-hover text-background-dark rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 size={20} className="animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageFeedbacks;
