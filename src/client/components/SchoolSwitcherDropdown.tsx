import React, { useState, useRef, useEffect } from 'react';
import { useSchoolContext } from '../context/SchoolContext';
import { ChevronDown, Building2, GitBranch, Check, ArrowRightLeft } from 'lucide-react';

export const SchoolSwitcherDropdown: React.FC = () => {
  const { currentSchool, accessibleSchools, schoolTree, switchContext } = useSchoolContext();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = async (schoolId: number) => {
    if (schoolId === currentSchool?.id) return;
    setSwitching(true);
    await switchContext(schoolId);
    setSwitching(false);
    setIsOpen(false);
  };

  if (!currentSchool || accessibleSchools.length <= 1) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-dark transition-colors border border-border-green/20"
      >
        {currentSchool.is_branch ? (
          <GitBranch size={16} className="text-primary" />
        ) : (
          <Building2 size={16} className="text-primary" />
        )}
        <span className="text-white text-sm font-medium max-w-[120px] truncate hidden md:inline">
          {currentSchool.name}
        </span>
        <ChevronDown size={14} className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 bg-background-dark border border-border-green/20 rounded-xl shadow-2xl z-50 py-2 max-h-80 overflow-y-auto">
            {/* Parent Schools */}
            {schoolTree.map((node) => (
              <div key={node.id}>
                <button
                  onClick={() => handleSwitch(node.id)}
                  disabled={switching}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    currentSchool.id === node.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-white hover:bg-white/5'
                  }`}
                >
                  <Building2 size={16} />
                  <span className="flex-1 text-left truncate">{node.name}</span>
                  {currentSchool.id === node.id && <Check size={14} className="text-primary shrink-0" />}
                </button>

                {/* Branches under this parent */}
                {node.branches.length > 0 && (
                  <div className="border-t border-border-green/5 px-2 py-1">
                    <div className="px-2 py-1 text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                      Branches under {node.name}
                    </div>
                    {node.branches.filter(b => b.is_active).map((branch) => (
                      <button
                        key={branch.id}
                        onClick={() => handleSwitch(branch.id)}
                        disabled={switching}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors rounded-lg ml-2 ${
                          currentSchool.id === branch.id
                            ? 'bg-primary/10 text-primary'
                            : 'text-text-muted hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <GitBranch size={14} />
                        <span className="flex-1 text-left truncate">{branch.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-text-muted">
                          {branch.branch_code}
                        </span>
                        {currentSchool.id === branch.id && <Check size={12} className="text-primary shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Orphan branches (no parent in tree) */}
            {accessibleSchools.filter(s => s.is_branch && !schoolTree.some(n => n.branches.find(b => b.id === s.id))).length > 0 && (
              <div className="border-t border-border-green/5 px-2 py-1">
                <div className="px-4 py-1 text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                  Direct Access Branches
                </div>
                {accessibleSchools.filter(s => s.is_branch && !schoolTree.some(n => n.branches.find(b => b.id === s.id))).map((school) => (
                  <button
                    key={school.id}
                    onClick={() => handleSwitch(school.id)}
                    disabled={switching}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors rounded-lg ${
                      currentSchool.id === school.id
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-muted hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <GitBranch size={14} />
                    <span className="flex-1 text-left truncate">{school.name}</span>
                    {currentSchool.id === school.id && <Check size={12} className="text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SchoolSwitcherDropdown;
