import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getPublicStats } from '../../lib/hospitals';
import { LogIn, Eye, EyeOff, Scale, Building2, Mail, Lock, Users, Sparkles, Shield, Activity, ArrowRight, CheckCircle2, Fingerprint, Hospital } from 'lucide-react';
import logo from '../../assets/logo.jpeg';

function Particle({ index }: { index: number }) {
  const size = Math.random() * 4 + 1;
  const x = Math.random() * 100;
  const y = Math.random() * 100;
  const dur = Math.random() * 20 + 15;
  const del = Math.random() * 10;
  const colors = ['#008751', '#fbbf24', '#84cc16', '#4ade80', '#22c55e'];
  const color = colors[index % colors.length];
  return (
    <div
      className="absolute pointer-events-none rounded-full"
      style={{
        width: size, height: size,
        left: `${x}%`, top: `${y}%`,
        background: color,
        opacity: Math.random() * 0.2 + 0.05,
        animation: `particle-float ${dur}s ease-in-out ${del}s infinite alternate`,
      }}
    />
  );
}

function FloatingOrb({ index }: { index: number }) {
  const size = Math.random() * 300 + 150;
  const x = Math.random() * 100;
  const y = Math.random() * 100;
  const dur = Math.random() * 8 + 10;
  const del = Math.random() * 5;
  const colors = ['#008751', '#fbbf24', '#84cc16', '#22c55e', '#4ade80'];
  return (
    <div
      className="absolute pointer-events-none rounded-full blur-[120px]"
      style={{
        width: size, height: size,
        left: `${x}%`, top: `${y}%`,
        background: colors[index % colors.length],
        opacity: Math.random() * 0.06 + 0.02,
        animation: `orb-float ${dur}s ease-in-out ${del}s infinite alternate`,
      }}
    />
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [roleIndex, setRoleIndex] = useState(0);
  const [publicStats, setPublicStats] = useState({ total_hospitals: 0, total_departments: 0, total_employees: 0 });
  const [statsDisplay, setStatsDisplay] = useState({ total_hospitals: 0, total_departments: 0, total_employees: 0 });
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoverBtn, setHoverBtn] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const roles = ['Super Admin', 'Executive Secretary', 'Hospital Admin', 'HR Officer'];

  useEffect(() => {
    getPublicStats().then(data => {
      setPublicStats(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!publicStats.total_hospitals) return;
    const duration = 1800, steps = 36, interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setStatsDisplay({
        total_hospitals: Math.round((publicStats.total_hospitals * step) / steps),
        total_departments: Math.round((publicStats.total_departments * step) / steps),
        total_employees: Math.round((publicStats.total_employees * step) / steps),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [publicStats]);

  useEffect(() => {
    const interval = setInterval(() => setRoleIndex(p => (p + 1) % roles.length), 2500);
    return () => clearInterval(interval);
  }, [roles.length]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 6,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * -6,
    });
  }, []);

  const handleMouseLeave = useCallback(() => setMousePos({ x: 0, y: 0 }), []);

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

  const steps = [
    { icon: Shield, label: 'Secure', desc: 'Encrypted' },
    { icon: Fingerprint, label: 'Verified', desc: 'Authenticated' },
    { icon: CheckCircle2, label: 'Ready', desc: 'Dashboard' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 selection:bg-emerald-500/30">
      <div className="absolute inset-0"
        style={{
          background: 'linear-gradient(-45deg, #001a0f, #022c22, #064e3b, #0c2d1a, #1a1a2e, #022c22)',
          backgroundSize: '400% 400%',
          animation: 'bg-shift 20s ease infinite',
        }}
      />
      <style>{`
        @keyframes bg-shift {
          0% { background-position: 0% 50%; }
          25% { background-position: 100% 0%; }
          50% { background-position: 100% 100%; }
          75% { background-position: 0% 100%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes particle-float {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(40px, -40px) scale(1.5); opacity: 0; }
        }
        @keyframes orb-float {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(50px, -50px) scale(1.2); }
        }
        @keyframes border-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.08); }
        }
        @keyframes slide-down {
          0% { opacity: 0; transform: translateY(-8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes breathe {
          0%, 100% { box-shadow: 0 0 20px rgba(0,135,81,0.15), 0 0 60px rgba(0,135,81,0.05); }
          50% { box-shadow: 0 0 30px rgba(0,135,81,0.25), 0 0 80px rgba(0,135,81,0.1); }
        }
        @keyframes letter-in {
          0% { opacity: 0; transform: translateY(12px) rotateX(40deg); filter: blur(4px); }
          100% { opacity: 1; transform: translateY(0) rotateX(0deg); filter: blur(0); }
        }
      `}</style>

      {/* Orbs */}
      {Array.from({ length: 6 }, (_, i) => <FloatingOrb key={i} index={i} />)}

      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Particles */}
      {Array.from({ length: 15 }, (_, i) => <Particle key={i} index={i} />)}

      {/* Decorative floating icons */}
      <div className="absolute top-[15%] left-[10%] text-emerald-500/10 animate-float" style={{ animationDuration: '7s' }}>
        <Hospital size={48} />
      </div>
      <div className="absolute top-[30%] right-[12%] text-amber-500/10 animate-float" style={{ animationDuration: '9s', animationDelay: '2s' }}>
        <Building2 size={36} />
      </div>
      <div className="absolute bottom-[25%] left-[8%] text-emerald-400/10 animate-float" style={{ animationDuration: '8s', animationDelay: '4s' }}>
        <Shield size={32} />
      </div>
      <div className="absolute bottom-[35%] right-[10%] text-green-500/10 animate-float" style={{ animationDuration: '10s', animationDelay: '1s' }}>
        <Activity size={40} />
      </div>

      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full max-w-[460px] relative z-10"
        style={{ perspective: '1200px' }}
      >
        <div
          className="relative transition-all duration-200 ease-out"
          style={{
            transform: `rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg)`,
          }}
        >
          {/* Glow behind card */}
          <div
            className="absolute -inset-6 rounded-[2rem] opacity-20 blur-3xl transition-all duration-700 group-hover:opacity-30"
            style={{
              background: 'radial-gradient(ellipse at center, #008751 0%, #fbbf24 40%, #008751 70%, transparent 100%)',
              animation: 'pulse-glow 4s ease-in-out infinite',
            }}
          />

          {/* Card */}
          <div className="relative bg-white/[0.94] backdrop-blur-2xl rounded-3xl shadow-[0_8px_60px_rgba(0,0,0,0.35)] overflow-hidden group/card hover:shadow-[0_8px_80px_rgba(0,135,81,0.15)] transition-shadow duration-500">
            {/* Animated border */}
            <div className="absolute inset-0 rounded-3xl p-[1px] pointer-events-none">
              <div className="absolute inset-0 rounded-3xl overflow-hidden">
                <div
                  className="absolute -inset-[100%] w-[300%] h-[300%] opacity-40"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent, #008751, #fbbf24, #22c55e, #008751, transparent)',
                    animation: 'border-rotate 5s linear infinite',
                  }}
                />
              </div>
            </div>

            {/* Progress Steps - Left side */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-20">
              {steps.map((s, i) => (
                <div key={s.label} className="flex items-center gap-2 group/step">
                  <div className={`relative w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ${
                    i === 0 ? 'bg-emerald-500 shadow-[0_0_12px_rgba(0,135,81,0.3)]' :
                    i === 1 ? 'bg-amber-400/80' : 'bg-emerald-500/40'
                  }`}>
                    <s.icon size={11} className="text-white" />
                    <div className={`absolute -inset-1 rounded-full animate-ping opacity-30 ${
                      i === 0 ? 'bg-emerald-500' : 'bg-transparent'
                    }`} />
                  </div>
                  <div className={`transition-all duration-300 ${
                    i === 0 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover/step:opacity-100 group-hover/step:translate-x-0'
                  }`}>
                    <p className="text-[9px] font-bold text-emerald-300 leading-none">{s.label}</p>
                    <p className="text-[7px] text-emerald-400/50 leading-tight">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="relative overflow-hidden px-8 pt-8 pb-9 text-center"
              style={{ background: 'linear-gradient(160deg, #001a0f 0%, #022c22 25%, #064e3b 60%, #006838 100%)' }}>
              <div className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
              <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-emerald-500/10 blur-[80px]" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-amber-500/10 blur-[80px]" />

              <div className="relative z-10">
                {/* Logo with enhanced glow */}
                <div className="relative inline-flex mb-5">
                  <div className="absolute -inset-4 rounded-2xl bg-emerald-500/10 blur-xl" />
                  <div className="absolute -inset-2 rounded-2xl bg-emerald-400/5 blur-lg animate-pulse-soft" />
                  <div className="relative w-24 h-24 rounded-2xl bg-white/[0.08] backdrop-blur border border-white/10 p-2.5 overflow-hidden group/logo"
                    style={{ animation: 'breathe 3s ease-in-out infinite' }}>
                    <img src={logo} alt="GSHSMB Logo" className="w-full h-full object-contain transition-all duration-500 group-hover/logo:scale-110 group-hover/logo:rotate-2" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 border-2 border-emerald-900 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Shield size={12} className="text-emerald-900" />
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <p className="text-[9px] tracking-[0.25em] text-emerald-300/40 font-mono uppercase">
                    Government of Gombe State
                  </p>
                  <h1 className="text-base font-bold text-white leading-tight">
                    Gombe State Hospital Services
                  </h1>
                  <p className="text-sm font-semibold text-amber-300/90 tracking-wide">
                    Management Board
                  </p>
                </div>

                {/* Badge */}
                <div className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 backdrop-blur-sm group/badge hover:bg-amber-400/15 hover:border-amber-400/30 hover:shadow-[0_0_20px_rgba(251,191,36,0.1)] transition-all duration-300 cursor-default">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span className="text-amber-300 text-[10px] font-semibold tracking-[0.15em] uppercase">HMIS Portal</span>
                  <span className="w-px h-3 bg-amber-400/20" />
                  <span className="text-amber-300/50 text-[9px] font-mono">v2.0</span>
                </div>
              </div>
            </div>

            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none z-10">
              <div className="absolute top-0 left-0 w-8 h-[1px] bg-gradient-to-r from-transparent to-emerald-500/30" />
              <div className="absolute top-0 left-0 w-[1px] h-8 bg-gradient-to-b from-transparent to-emerald-500/30" />
            </div>
            <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none z-10">
              <div className="absolute top-0 right-0 w-8 h-[1px] bg-gradient-to-l from-transparent to-emerald-500/30" />
              <div className="absolute top-0 right-0 w-[1px] h-8 bg-gradient-to-b from-transparent to-emerald-500/30" />
            </div>

            {/* Form Body */}
            <div className="px-8 pt-6 pb-8 relative">
              {/* Welcome */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    Welcome Back
                    <Sparkles size={14} className="text-amber-500 animate-pulse-soft" />
                  </h2>
                  <p className="text-slate-500 text-xs mt-0.5">Sign in to your account to continue</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center border border-emerald-200/60 shadow-sm">
                  <Shield size={16} className="text-emerald-600" />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 bg-gradient-to-r from-red-50 to-red-50/80 backdrop-blur border border-red-200/80 text-red-700 px-4 py-3.5 rounded-xl text-sm flex items-start gap-3 shadow-sm"
                  style={{ animation: 'slide-down 0.3s ease-out' }}>
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0 mt-1.5 animate-ping-soft" />
                  <span className="flex-1">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4.5">
                {/* Email */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <div className={`absolute left-0 top-0 h-full w-10 flex items-center justify-center pointer-events-none transition-all duration-300 ${
                      focusedField === 'email' || email ? 'text-emerald-600 scale-110' : 'text-slate-400'
                    }`}>
                      <Mail size={15} />
                    </div>
                    <input
                      type="email"
                      className={`block w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm shadow-sm placeholder:text-slate-400 outline-none transition-all duration-300 ${
                        focusedField === 'email' || email
                          ? 'border-emerald-500 ring-[3px] ring-emerald-500/15 shadow-emerald-500/5'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      placeholder="admin@gshsmb.gov.ng"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setEmailTouched(true); }}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      autoComplete="email"
                      required
                    />
                    {focusedField === 'email' && (
                      <span className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 rounded-full"
                        style={{ width: '100%', backgroundSize: '200% 100%', animation: 'bg-shift 2s linear infinite' }} />
                    )}
                    {email && emailTouched && !email.includes('@') && focusedField !== 'email' && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-amber-500 font-medium">Invalid</span>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Password</label>
                    <Link to="/forgot-password" className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium transition-all hover:underline underline-offset-2 hover:gap-1 inline-flex items-center gap-0.5 group/link">
                      <Lock size={10} className="transition-all group-hover/link:scale-110" />
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className={`absolute left-0 top-0 h-full w-10 flex items-center justify-center pointer-events-none transition-all duration-300 ${
                      focusedField === 'password' || password ? 'text-emerald-600 scale-110' : 'text-slate-400'
                    }`}>
                      <Lock size={15} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`block w-full rounded-xl border bg-white pl-10 pr-10 py-2.5 text-sm shadow-sm placeholder:text-slate-400 outline-none transition-all duration-300 ${
                        focusedField === 'password' || password
                          ? 'border-emerald-500 ring-[3px] ring-emerald-500/15 shadow-emerald-500/5'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setPasswordTouched(true); }}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-all duration-200"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    {focusedField === 'password' && password.length > 0 && password.length < 6 && (
                      <span className="absolute right-12 top-1/2 -translate-y-1/2 text-[9px] text-amber-500 font-medium">Weak</span>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    onMouseEnter={() => setHoverBtn(true)}
                    onMouseLeave={() => setHoverBtn(false)}
                    className="relative w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-300 outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer overflow-hidden group/btn shadow-lg active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, #008751 0%, #006838 50%, #00502a 100%)',
                      backgroundSize: '200% 200%',
                      backgroundPosition: hoverBtn ? '100% 50%' : '0% 50%',
                      boxShadow: hoverBtn
                        ? '0 8px 30px rgba(0,135,81,0.4), 0 2px 10px rgba(0,135,81,0.2)'
                        : '0 4px 15px rgba(0,135,81,0.3)',
                    }}
                  >
                    <span className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"
                      style={{ background: 'linear-gradient(135deg, #006838, #00502a, #004020)' }}
                    />
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-[0.8s] ease-in-out" />
                    {hoverBtn && (
                      <span className="absolute -inset-1 rounded-xl opacity-20 blur-sm"
                        style={{ background: 'linear-gradient(135deg, #008751, #fbbf24, #008751)', animation: 'border-rotate 3s linear infinite' }} />
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <LogIn size={16} className="transition-transform duration-300 group-hover/btn:-translate-y-0.5" />
                          <span>Sign In</span>
                          <ArrowRight size={14} className="transition-all duration-300 group-hover/btn:translate-x-1 opacity-0 group-hover/btn:opacity-100" />
                        </>
                      )}
                    </span>
                  </button>
                </div>

                {/* Security notice */}
                <div className="relative pt-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-[10px] text-slate-400 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-emerald-400" />
                      Secured with 256-bit encryption
                      <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    </span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {[
            { icon: Building2, label: 'Hospitals', value: `${statsDisplay.total_hospitals}+`, color: '#fbbf24', delay: 0.1 },
            { icon: Users, label: 'Staff Records', value: `${statsDisplay.total_employees.toLocaleString()}+`, color: '#84cc16', delay: 0.2 },
            { icon: Activity, label: 'Departments', value: `${statsDisplay.total_departments}+`, color: '#008751', delay: 0.3 },
          ].map((stat) => (
            <div
              key={stat.label}
              className="relative group/stats rounded-2xl border border-white/10 p-3.5 text-center overflow-hidden transition-all duration-300 hover:border-amber-400/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10"
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(8px)',
                animation: `slide-up 0.5s ease-out ${stat.delay}s both`,
              }}
            >
              <div className="absolute inset-0 opacity-0 group-hover/stats:opacity-100 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${stat.color}15, transparent)`,
                }}
              />
              <stat.icon
                size={16}
                className="mx-auto mb-1.5 transition-all duration-300 group-hover/stats:scale-110 group-hover/stats:-translate-y-0.5"
                style={{ color: stat.color }}
              />
              <p className="text-white text-sm font-bold tabular-nums tracking-tight">{stat.value}</p>
              <p className="text-emerald-200/50 text-[10px] mt-0.5 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Role Rotator */}
        <div className="mt-4 text-center"
          style={{ animation: 'slide-up 0.5s ease-out 0.4s both' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 transition-all duration-300 hover:bg-white/5 hover:border-white/20 cursor-default"
            style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)' }}>
            <span className="text-emerald-200/50 text-[10px] font-medium">Portal for</span>
            <span className="relative h-5 inline-flex items-center overflow-hidden">
              <span className="inline-flex gap-[1px]">
                {roles[roleIndex].split('').map((letter, i) => (
                  <span
                    key={`${roleIndex}-${i}`}
                    className="text-white text-[11px] font-bold tracking-wide"
                    style={{
                      animation: `letter-in 0.4s ease-out ${i * 0.04}s both`,
                    }}
                  >
                    {letter}
                  </span>
                ))}
              </span>
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 text-center"
          style={{ animation: 'slide-up 0.5s ease-out 0.5s both' }}>
          <p className="text-[10px] text-emerald-200/30 font-medium tracking-wide">
            Gombe State Hospital Services Management Board &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
