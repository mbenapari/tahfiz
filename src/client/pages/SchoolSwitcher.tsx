import React from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Building2, GitBranch, Check, Loader2, AlertCircle } from 'lucide-react';
import { useSchoolContext } from '../context/SchoolContext';

const SchoolSwitcher: React.FC = () => {
  const navigate = useNavigate();
  const { currentSchool, schoolTree, switchContext, loading } = useSchoolContext();

  const handleSwitch = async (schoolId: number) => {
    if (schoolId === currentSchool?.id) return;
    const success = await switchContext(schoolId);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-white">Switch School</h1>
        <p className="text-text-muted text-sm mt-1">
          Select a school or branch to work with
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      )}

      {!loading && schoolTree.length === 0 && (
        <div className="text-center py-12">
          <Building2 size={40} className="mx-auto text-text-muted/30 mb-3" />
          <p className="text-text-muted">No schools available</p>
        </div>
      )}

      <div className="space-y-4">
        {schoolTree.map((node) => (
          <div key={node.id} className="bg-surface-dark border border-border-green/20 rounded-2xl overflow-hidden">
            {/* Parent School */}
            <button
              onClick={() => handleSwitch(node.id)}
              disabled={currentSchool?.id === node.id}
              className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-colors ${
                currentSchool?.id === node.id
                  ? 'bg-primary/10'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${currentSchool?.id === node.id ? 'bg-primary/10' : 'bg-primary/5'}`}>
                <Building2 size={20} className={currentSchool?.id === node.id ? 'text-primary' : 'text-text-muted'} />
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">{node.name}</div>
                <div className="text-text-muted text-sm">Parent School</div>
              </div>
              {currentSchool?.id === node.id && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
                  <Check size={12} /> Current
                </span>
              )}
            </button>

            {/* Branches */}
            {node.branches.length > 0 && (
              <div className="border-t border-border-green/10">
                <div className="px-6 py-2 text-xs text-text-muted uppercase tracking-wider font-semibold">
                  Branches
                </div>
                {node.branches.map((branch) => (
                  <button
                    key={branch.id}
                    onClick={() => handleSwitch(branch.id)}
                    disabled={currentSchool?.id === branch.id}
                    className={`w-full flex items-center gap-4 px-6 py-3 pl-10 text-left transition-colors ${
                      currentSchool?.id === branch.id
                        ? 'bg-primary/10'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${currentSchool?.id === branch.id ? 'bg-primary/10' : 'bg-primary/5'}`}>
                      <GitBranch size={16} className={currentSchool?.id === branch.id ? 'text-primary' : 'text-text-muted'} />
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{branch.name}</div>
                      <div className="text-text-muted text-xs">
                        {branch.branch_code && <span className="mr-2">Code: {branch.branch_code}</span>}
                        {!branch.is_active && <span className="text-red-400">Inactive</span>}
                      </div>
                    </div>
                    {currentSchool?.id === branch.id && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
                        <Check size={12} /> Current
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchoolSwitcher;
