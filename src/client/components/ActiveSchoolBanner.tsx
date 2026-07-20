import React from 'react';
import { useSchoolContext } from '../context/SchoolContext';
import { GitBranch } from 'lucide-react';

export const ActiveSchoolBanner: React.FC = () => {
  const { currentSchool } = useSchoolContext();

  if (!currentSchool) return null;

  // Only show banner when in branch context
  if (!currentSchool.is_branch) return null;

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-2 mb-4 flex items-center gap-2">
      <GitBranch size={16} className="text-primary" />
      <div className="flex-1">
        <span className="text-primary font-medium text-sm">Current School: </span>
        <span className="text-white text-sm">{currentSchool.name}</span>
        {currentSchool.branch_code && (
          <span className="text-text-muted text-xs ml-2">({currentSchool.branch_code})</span>
        )}
      </div>
      {!currentSchool.is_active && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-medium">
          Inactive
        </span>
      )}
    </div>
  );
};

export default ActiveSchoolBanner;
