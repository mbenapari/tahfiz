import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  School
} from 'lucide-react';
import { Link } from 'react-router';
import { Logo } from '../../components/Logo';

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login submitted:', formData);
    // Add login logic here
  };

  return (
    <div className="flex min-h-screen bg-background-dark font-display overflow-hidden">
      
      {/* Left Side - Hero/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface-dark flex-col justify-between p-12 overflow-hidden">
        {/* Background Gradient/Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-dark via-surface-dark to-primary/20 z-0"></div>
        
        {/* Decorative Mosque Silhouette (CSS/SVG) */}
        <div className="absolute bottom-0 left-0 right-0 h-2/3 z-0 opacity-10 pointer-events-none">
           <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full text-primary fill-current">
              <path fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
           </svg>
           {/* Abstract Mosque Shape */}
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-3/4 bg-primary/20 rounded-t-[1000px] blur-3xl"></div>
        </div>

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
            "The best among you (Muslims) are those who learn the Quran and teach it."
          </blockquote>
          <cite className="text-text-muted not-italic font-medium block">— Sahih Al-Bukhari</cite>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 relative">
        <div className="w-full max-w-md flex flex-col gap-8">
          
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h1>
            <p className="text-text-muted">Please enter your details to access your hifz progress.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Identifier Field */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-white" htmlFor="identifier">
                Email or Phone Number
              </label>
              <div className="relative">
                <input 
                  id="identifier"
                  name="identifier"
                  type="text" 
                  value={formData.identifier}
                  onChange={handleChange}
                  className="h-12 w-full rounded-lg bg-surface-dark border border-border-green px-4 pl-11 text-white placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="student@example.com"
                  required
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              </div>
            </div>

            {/* Password Field */}
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
              className="mt-2 flex items-center justify-center gap-2 h-12 bg-primary text-background-dark rounded-lg font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-[0.99]"
            >
              <span>Sign In</span>
              <ArrowRight size={18} />
            </button>

          </form>

          {/* Divider */}
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-border-green/50"></div>
            <span className="flex-shrink-0 mx-4 text-text-muted text-sm">or</span>
            <div className="flex-grow border-t border-border-green/50"></div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-text-muted">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-bold hover:underline transition-all">
                Register here
              </Link>
            </p>
          </div>

          {/* Footer Links */}
          <div className="flex items-center justify-center gap-6 mt-8 text-xs text-text-muted">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Help Center</a>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
