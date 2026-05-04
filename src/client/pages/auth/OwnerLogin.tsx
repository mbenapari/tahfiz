import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';

const OwnerLogin: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/owner/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.identifier,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Backend returns { owner, token }
      const owner = data.owner || data.user;
      if (!owner || !owner.id) throw new Error('Invalid response from server');
      setUser({ id: owner.id, email: owner.email, role: owner.role });
      navigate('/owner');

    } catch (err: any) {
      console.error('Owner login error:', err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background-dark font-display overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface-dark flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-surface-dark via-surface-dark to-primary/20 z-0"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-primary/20 p-2 rounded-lg backdrop-blur-sm border border-primary/30">
              <Logo className="text-primary w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-wide">Tahfiz App</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <blockquote className="text-2xl font-medium leading-relaxed text-white mb-6">
            "Administration — manage and configure the platform settings and tenants."
          </blockquote>
          <cite className="text-text-muted not-italic font-medium block">— System Owner</cite>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 relative">
        <div className="w-full max-w-md flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">System Owner Sign In</h1>
            <p className="text-text-muted">Sign in with your owner account to manage the platform.</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-white" htmlFor="identifier">
                Owner Email
              </label>
              <div className="relative">
                <input 
                  id="identifier"
                  name="identifier"
                  type="email" 
                  value={formData.identifier}
                  onChange={handleChange}
                  className="h-12 w-full rounded-lg bg-surface-dark border border-border-green px-4 pl-11 text-white placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="owner@example.com"
                  required
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-white" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input 
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"} 
                  value={formData.password}
                  onChange={handleChange}
                  className="h-12 w-full rounded-lg bg-surface-dark border border-border-green px-4 pl-11 pr-11 text-white placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="••••••••"
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                Forgot Password?
              </Link>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="mt-2 flex items-center justify-center gap-2 h-12 bg-primary text-background-dark rounded-lg font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-background-dark border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

          </form>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-border-green/50"></div>
            <span className="flex-shrink-0 mx-4 text-text-muted text-sm">or</span>
            <div className="flex-grow border-t border-border-green/50"></div>
          </div>

          <div className="text-center">
            <p className="text-text-muted">
              Need general access?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline transition-all">
                Sign in as user
              </Link>
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 mt-8 text-xs text-text-muted">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OwnerLogin;
