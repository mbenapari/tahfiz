import React, { useState } from 'react';
import { 
  School, 
  IdCard, 
  Shield, 
  Mail, 
  Phone, 
  CheckCircle2, 
  GraduationCap, 
  Presentation, 
  Contact,
  LayoutDashboard,
  ChevronRight,
  UserPlus,
  Lock
} from 'lucide-react';

import { Logo } from '../../components/Logo';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: 'admin',
    email: '',
    password: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      role,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setStatus({ type: 'success', message: 'User registered successfully!' });
      
      // Update global auth state
      setUser(data.user);

      if (data.user.role === 'admin' && !data.user.tenantId) {
        navigate('/schools/new');
      } else {
        navigate('/');
      }

      // Reset form on success
      setFormData({
        firstName: '',
        lastName: '',
        role: 'admin',
        email: '',
        password: '',
        phone: '',
      });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-dark text-white font-display overflow-x-hidden antialiased p-6 md:p-10">
      
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-8">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-text-muted text-sm font-medium">
          <div className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </div>
          <ChevronRight size={14} />
          <span className="hover:text-white transition-colors cursor-pointer">Users</span>
          <ChevronRight size={14} />
          <span className="text-white">Register</span>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">User Registration</h1>
          <div className="flex items-center gap-2 text-text-muted">
            <School size={20} />
            <p className="text-sm font-normal leading-normal">Registering for: <span className="text-primary font-medium">Al-Huda Academy</span></p>
          </div>
        </div>

        {status && (
          <div className={`p-4 rounded-lg border ${
            status.type === 'success' 
              ? 'bg-green-500/10 border-green-500/50 text-green-500' 
              : 'bg-red-500/10 border-red-500/50 text-red-500'
          }`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          {/* Identity Section */}
          <div className="bg-surface-dark rounded-xl p-6 border border-border-green/30 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <IdCard className="text-primary" size={24} />
              <h2 className="text-lg font-bold">Identity Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-white">First Name <span className="text-red-500">*</span></span>
                <input 
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="h-12 w-full rounded-lg bg-background-dark border border-border-green px-4 text-white placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g. Ahmed"
                  required
                />
              </label>
              
              <label className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-white">Last Name</span>
                  <span className="text-xs font-medium bg-border-green/30 text-text-muted px-2 py-1 rounded">Optional</span>
                </div>
                <input 
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="h-12 w-full rounded-lg bg-background-dark border border-border-green px-4 text-white placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g. Ali"
                />
              </label>
            </div>
          </div>

          {/* Role Section */}
          <div className="bg-surface-dark rounded-xl p-6 border border-border-green/30 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="text-primary" size={24} />
              <h2 className="text-lg font-bold">Assign Role</h2>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="group cursor-pointer relative">
                  <input 
                    type="radio" 
                    name="role_selection" 
                    className="peer invisible absolute" 
                    checked={formData.role === 'admin'} 
                    onChange={() => handleRoleChange('admin')}
                  />
                  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border-green p-6 text-white bg-background-dark peer-checked:border-primary peer-checked:bg-primary/5 transition-all hover:border-primary/50 h-full">
                    <Shield className="text-text-muted peer-checked:text-primary group-hover:text-white transition-colors" size={32} />
                    <span className="font-bold">Admin</span>
                    <div className="absolute top-3 right-3 opacity-0 peer-checked:opacity-100 transition-opacity text-primary">
                      <CheckCircle2 size={20} fill="currentColor" className="text-primary" />
                    </div>
                  </div>
                </label>

                <label className="group cursor-pointer relative">
                  <input 
                    type="radio" 
                    name="role_selection" 
                    className="peer invisible absolute" 
                    checked={formData.role === 'instructor'} 
                    onChange={() => handleRoleChange('instructor')}
                  />
                  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border-green p-6 text-white bg-background-dark peer-checked:border-primary peer-checked:bg-primary/5 transition-all hover:border-primary/50 h-full">
                    <Presentation className="text-text-muted peer-checked:text-primary group-hover:text-white transition-colors" size={32} />
                    <span className="font-bold">Instructor</span>
                    <div className="absolute top-3 right-3 opacity-0 peer-checked:opacity-100 transition-opacity text-primary">
                      <CheckCircle2 size={20} fill="currentColor" className="text-primary" />
                    </div>
                  </div>
                </label>

                <label className="group cursor-pointer relative">
                  <input 
                    type="radio" 
                    name="role_selection" 
                    className="peer invisible absolute" 
                    checked={formData.role === 'student'} 
                    onChange={() => handleRoleChange('student')}
                  />
                  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border-green p-6 text-white bg-background-dark peer-checked:border-primary peer-checked:bg-primary/5 transition-all hover:border-primary/50 h-full">
                    <GraduationCap className="text-text-muted peer-checked:text-primary group-hover:text-white transition-colors" size={32} />
                    <span className="font-bold">Student</span>
                    <div className="absolute top-3 right-3 opacity-0 peer-checked:opacity-100 transition-opacity text-primary">
                      <CheckCircle2 size={20} fill="currentColor" className="text-primary" />
                    </div>
                  </div>
                </label>
              </div>
              <p className="text-sm text-text-muted">Selected role defines the access level within the institution dashboard.</p>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-surface-dark rounded-xl p-6 border border-border-green/30 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Contact className="text-primary" size={24} />
              <h2 className="text-lg font-bold">Contact Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-white">Email Address</span>
                  <span className="text-xs font-medium bg-border-green/30 text-text-muted px-2 py-1 rounded">Optional</span>
                </div>
                <div className="relative">
                  <input 
                    name="email"
                    type="email" 
                    value={formData.email}
                    onChange={handleChange}
                    className="h-12 w-full rounded-lg bg-background-dark border border-border-green px-4 pl-11 text-white placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="name@example.com" 
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                </div>
              </label>

              <label className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-white">Password <span className="text-red-500">*</span></span>
                </div>
                <div className="relative">
                  <input 
                    name="password"
                    type="password" 
                    value={formData.password}
                    onChange={handleChange}
                    className="h-12 w-full rounded-lg bg-background-dark border border-border-green px-4 pl-11 text-white placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="••••••••" 
                    required
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                </div>
              </label>
              
              <label className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-white">Phone Number</span>
                  <span className="text-xs font-medium bg-border-green/30 text-text-muted px-2 py-1 rounded">Optional</span>
                </div>
                <div className="relative">
                  <input 
                    name="phone"
                    type="tel" 
                    value={formData.phone}
                    onChange={handleChange}
                    className="h-12 w-full rounded-lg bg-background-dark border border-border-green px-4 pl-11 text-white placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="+1 (555) 000-0000" 
                  />
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 mt-4">
            <button 
              type="button" 
              className="px-6 py-3 text-white font-medium hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-background-dark rounded-lg cursor-pointer font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-background-dark border-t-transparent rounded-full animate-spin" />
              ) : (
                <UserPlus size={20} />
              )}
              <span>{loading ? 'Creating...' : 'Create Account'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Register;
