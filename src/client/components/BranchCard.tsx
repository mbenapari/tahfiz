import React from 'react';
import { Link } from 'react-router';
import { Building2, Users, MapPin, Clock, MoreVertical, CheckCircle, XCircle } from 'lucide-react';
import type { Branch } from '../hooks/useBranchManagement';

interface BranchCardProps {
  branch: Branch;
  onToggleStatus?: (branchId: number, isActive: boolean) => void;
  onDelete?: (branchId: number) => void;
}

export const BranchCard: React.FC<BranchCardProps> = ({ branch, onToggleStatus, onDelete }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className={`relative bg-surface-dark rounded-xl border p-6 transition-all hover:border-primary/30 ${
      branch.is_active ? 'border-border-green/20' : 'border-red-500/20 opacity-70'
    }`}>
      {/* Status indicator */}
      <div className="absolute top-4 right-4">
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
          >
            <MoreVertical size={18} className="text-text-muted" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-background-dark border border-border-green/20 rounded-lg shadow-xl z-20 py-1">
                <Link
                  to={`/branches/${branch.id}`}
                  className="block px-4 py-2 text-sm text-text-muted hover:text-white hover:bg-white/5 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  View Details
                </Link>
                {onToggleStatus && (
                  <button
                    onClick={() => { onToggleStatus(branch.id, !branch.is_active); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-text-muted hover:text-white hover:bg-white/5 transition-colors"
                  >
                    {branch.is_active ? 'Deactivate' : 'Reactivate'}
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => { onDelete(branch.id); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`p-3 rounded-xl ${branch.is_active ? 'bg-primary/10' : 'bg-red-500/10'}`}>
          <Building2 size={24} className={branch.is_active ? 'text-primary' : 'text-red-400'} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-lg truncate pr-8">{branch.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {branch.branch_code}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
              branch.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {branch.is_active ? <CheckCircle size={10} /> : <XCircle size={10} />}
              {branch.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        {branch.address && (
          <div className="flex items-center gap-2 text-text-muted text-sm">
            <MapPin size={14} />
            <span className="truncate">{branch.address}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-text-muted text-sm">
          <Clock size={14} />
          <span className="capitalize">{branch.schedule_mode === 'advanced' ? 'Advanced Schedule' : 'Simple Schedule'}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-border-green/10">
        <Link
          to={`/branches/${branch.id}`}
          className="flex-1 text-center px-3 py-2 text-sm rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
        >
          Manage
        </Link>
      </div>
    </div>
  );
};

export default BranchCard;
