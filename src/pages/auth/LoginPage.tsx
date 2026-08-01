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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950">
      {/* Animated gradient orbs with savannah gold / emerald green mix */}
      <div className="absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full bg-amber-500/10 blur-[120px] animate-pulse-soft" />
      <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full bg-emerald-500/20 blur-[120px] animate-pulse-soft" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-emerald-600/10 blur-[150px]" />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0H0v40' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="w-full max-w-[460px] relative z-10 animate-scale-in">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_20px_50px_rgba(4,47,31,0.4)] border border-emerald-500/10 overflow-hidden">
          {/* Header */}
          <div className="relative px-8 pt-10 pb-8 text-center overflow-hidden border-b border-slate-100">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900" />
            {/* Savannah Gold light glow */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-amber-400/20 blur-[40px]" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-emerald-400/20 blur-[40px]" />
            
            <div className="relative flex flex-col items-center">
              <div className="inline-flex mb-4 relative group">
                {/* Gold glowing border */}
                <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-amber-400 to-emerald-500 opacity-60 blur-md group-hover:opacity-100 transition duration-300" />
                <div className="relative w-20 h-20 rounded-2xl bg-white p-2.5 shadow-xl">
                  <img src={logo} alt="GSHSMB Logo" className="w-full h-full object-contain" />
                </div>
              </div>
              <h1 className="text-xl font-extrabold text-white tracking-tight">GSHSMB HMIS</h1>
              <p className="text-xs text-amber-300 font-semibold uppercase tracking-wider mt-1">Gombe State Government</p>
              <p className="text-xs text-emerald-100/70 mt-0.5">Hospital Services Management Board</p>
              
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/20 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping-soft" />
                <span className="text-emerald-200 text-[11px] font-medium tracking-wide">Centralized Board Portal</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="px-8 pt-7 pb-8">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">Portal Security Verification</h2>
              <p className="text-slate-500 text-sm mt-0.5">Enter authorized administrative credentials</p>
            </div>

            {error && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-slide-up">
                <Shield size={14} className="text-red-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Administrative Email</label>
                <div className="input-group">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    className="input pl-10"
                    placeholder="name@gshsmb.gov.ph"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700">Access Key / Password</label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                    Forgot Key?
                  </Link>
                </div>
                <div className="input-group">
                  <Lock size={16} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pl-10 pr-10"
                    placeholder="••••••••••••"
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
                className="btn-primary w-full py-3 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 border-0 active:scale-[0.98] transition-transform shadow-lg shadow-emerald-700/20"
              >
                {loading ? (
                  <>
                    <span className="spinner w-4 h-4 border-white/30 border-t-white" />
                    Authenticating System...
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    Secure Login
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access (Presentation Assist Panel) */}
            <div className="mt-6 pt-5 border-t border-slate-100 bg-slate-50/50 -mx-8 px-8 pb-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-3">
                Presenter Quick Access Roles
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Super Admin', desc: 'Board Level Control', email: 'superadmin@gshsmb.gov.ph', pass: 'SuperAdmin123!' },
                  { label: 'Exec Secretary', desc: 'Executive Oversight', email: 'execsec@gshsmb.gov.ph', pass: 'ExecSec123!' },
                  { label: 'Hospital Admin', desc: 'General Hospital', email: 'hospadmin@gshsmb.gov.ph', pass: 'HospAdmin123!' },
                  { label: 'HR Officer', desc: 'Staffing & Transfers', email: 'hr@gshsmb.gov.ph', pass: 'HROfficer123!' },
                ].map((demo) => (
                  <button
                    key={demo.label}
                    type="button"
                    onClick={() => {
                      setEmail(demo.email);
                      setPassword(demo.pass);
                    }}
                    className="flex flex-col items-start p-2.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/30 text-left transition-all active:scale-[0.97]"
                  >
                    <span className="text-xs font-bold text-slate-700">{demo.label}</span>
                    <span className="text-[9px] text-slate-400 font-medium leading-tight">{demo.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { icon: Building2, label: 'Hospitals', value: publicStats.total_hospitals },
            { icon: Users, label: 'Total Staff', value: publicStats.total_employees },
            { icon: Activity, label: 'Departments', value: publicStats.total_departments },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-3 text-center hover:bg-white/10 transition-all hover:translate-y-[-2px]"
            >
              <stat.icon size={16} className="text-amber-300 mx-auto mb-1" />
              <p className="text-lg font-bold text-white tabular-nums">{stat.value || '...'}</p>
              <p className="text-[10px] text-emerald-200/70 font-semibold">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/40 mt-6 font-medium">
          &copy; {new Date().getFullYear()} Gombe State Hospital Services Management Board.
        </p>
      </div>
    </div>
  );
}
