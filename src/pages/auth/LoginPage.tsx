import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getPublicStats } from '../../lib/hospitals';
import { LogIn, Eye, EyeOff, Building2, Mail, Lock, Users, Shield, Activity, ArrowRight, Hospital } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="w-full max-w-[440px] relative z-10">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-10 pb-8 text-center bg-emerald-950">
            <div className="inline-flex mb-4">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur border border-white/10 p-2.5">
                <img src={logo} alt="GSHSMB Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <h1 className="text-lg font-bold text-white">GSHSMB HMIS Portal</h1>
            <p className="text-sm text-emerald-300/80 mt-1">Gombe State Hospital Services Management Board</p>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/50 border border-emerald-700/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-300 text-xs font-medium">Secure Access</span>
            </div>
          </div>

          {/* Form */}
          <div className="px-8 pt-8 pb-8">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">Welcome Back</h2>
              <p className="text-slate-500 text-sm mt-0.5">Sign in to your account</p>
            </div>

            {error && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
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
                  <Link to="/forgot-password" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20"
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
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
              <div className="flex items-center justify-center gap-1 text-xs text-slate-400">
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
              className="bg-white/10 backdrop-blur rounded-xl border border-white/10 p-3 text-center"
            >
              <stat.icon size={16} className="text-emerald-300 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-emerald-300/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
