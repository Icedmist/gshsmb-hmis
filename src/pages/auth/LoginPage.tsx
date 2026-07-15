import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getPublicStats } from '../../lib/hospitals';
import { LogIn, Eye, EyeOff, Building2, Mail, Lock, Users, Shield, Activity, ArrowRight } from 'lucide-react';
import logo from '../../assets/logo.jpeg';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [publicStats, setPublicStats] = useState({ total_hospitals: 0, total_departments: 0, total_employees: 0 });

  useEffect(() => {
    getPublicStats().then(setPublicStats).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800">
      {/* Animated gradient orbs */}
      <div className="absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full bg-emerald-400/20 blur-[120px] animate-pulse-soft" />
      <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full bg-emerald-500/15 blur-[120px] animate-pulse-soft" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-emerald-600/20 blur-[150px]" />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0H0v40' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-emerald-900/20 overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="relative px-8 pt-10 pb-8 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-emerald-400/10 blur-[60px]" />
            <div className="relative">
              <div className="inline-flex mb-4">
                <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur border border-white/10 p-2.5 ring-1 ring-white/5">
                  <img src={logo} alt="GSHSMB Logo" className="w-full h-full object-contain" />
                </div>
              </div>
              <h1 className="text-lg font-bold text-white">GSHSMB HMIS Portal</h1>
              <p className="text-sm text-emerald-300/80 mt-1">Gombe State Hospital Services Management Board</p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-700/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping-soft" />
                <span className="text-emerald-300 text-xs font-medium">Secure Access</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="px-8 pt-7 pb-8">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">Welcome Back</h2>
              <p className="text-slate-500 text-sm mt-0.5">Sign in to your account</p>
            </div>

            {error && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <Shield size={14} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                <div className="input-group">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    className="input input-icon-left"
                    placeholder="admin@gshsmb.gov.ng"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700">Password</label>
                  <Link to="/forgot-password" className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                    Forgot?
                  </Link>
                </div>
                <div className="input-group">
                  <Lock size={16} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pl-10 pr-10"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3"
              >
                {loading ? (
                  <>
                    <span className="spinner w-4 h-4" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    Sign In
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <Shield size={12} />
                Secured with 256-bit encryption
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { icon: Building2, label: 'Hospitals', value: publicStats.total_hospitals },
            { icon: Users, label: 'Staff Records', value: publicStats.total_employees },
            { icon: Activity, label: 'Departments', value: publicStats.total_departments },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-3 text-center hover:bg-white/10 transition-colors"
            >
              <stat.icon size={16} className="text-emerald-300/80 mx-auto mb-1" />
              <p className="text-lg font-bold text-white tabular-nums">{stat.value}</p>
              <p className="text-[10px] text-emerald-300/60 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/20 mt-6">
          &copy; {new Date().getFullYear()} GSHSMB. All rights reserved.
        </p>
      </div>
    </div>
  );
}
