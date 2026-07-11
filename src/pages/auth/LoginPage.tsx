import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getPublicStats } from '../../lib/hospitals';
import { LogIn, Eye, EyeOff, Scale, Building2, Mail, Lock, Users, Sparkles, Shield, Activity, ArrowRight } from 'lucide-react';
import logo from '../../assets/logo.jpeg';

function FloatingShape({ className, size, color, duration, delay, initialX, initialY }: any) {
  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{
        width: size, height: size,
        left: `${initialX}%`, top: `${initialY}%`,
        background: color,
        borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
        animation: `float-shape ${duration}s ease-in-out ${delay}s infinite alternate`,
        opacity: 0.06,
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
  const cardRef = useRef<HTMLDivElement>(null);

  const shapes = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => ({
      id: i, size: Math.random() * 200 + 100,
      color: i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#008751' : '#84cc16',
      duration: Math.random() * 8 + 8, delay: Math.random() * 5,
      x: Math.random() * 100, y: Math.random() * 100,
    }))
  , []);

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

  const roles = ['Super Admin', 'Executive Secretary', 'Hospital Admin', 'HR Officer'];

  useEffect(() => {
    const interval = setInterval(() => setRoleIndex(p => (p + 1) % roles.length), 2500);
    return () => clearInterval(interval);
  }, [roles.length]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 8,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * -8,
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

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 selection:bg-emerald-500/30"
      style={{ background: 'linear-gradient(135deg, #020617 0%, #022c22 25%, #064e3b 50%, #0c2d1a 75%, #0f172a 100%)' }}>
      <style>{`
        @keyframes float-shape {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); }
          100% { transform: translate(30px, -30px) rotate(180deg) scale(1.1); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes border-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes slide-up {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          0% { opacity: 0; transform: translateY(-8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes shimmer-slide {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(300%) skewX(-15deg); }
        }
        @keyframes ripple {
          to { transform: scale(4); opacity: 0; }
        }
        @keyframes breathe {
          0%, 100% { box-shadow: 0 0 20px rgba(0,135,81,0.15), 0 0 60px rgba(0,135,81,0.05); }
          50% { box-shadow: 0 0 30px rgba(0,135,81,0.25), 0 0 80px rgba(0,135,81,0.1); }
        }
        @keyframes logo-spin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(5deg) scale(1.02); }
          100% { transform: rotate(0deg) scale(1); }
        }
      `}</style>

      {/* Animated gradient overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-[8s]"
        style={{
          background: 'linear-gradient(-45deg, #020617, #022c22, #064e3b, #0c2d1a, #1a1a2e)',
          backgroundSize: '400% 400%',
          animation: 'gradient-shift 15s ease infinite',
        }}
      />

      {/* Blob shapes */}
      {shapes.map(s => (
        <FloatingShape key={s.id} size={s.size} color={s.color} duration={s.duration} delay={s.delay} initialX={s.x} initialY={s.y} />
      ))}

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Orbs */}
      <div className="absolute -top-48 -left-48 w-[600px] h-[600px] rounded-full blur-[150px] opacity-[0.06] bg-amber-500 pointer-events-none animate-pulse-soft" />
      <div className="absolute -bottom-48 -right-48 w-[600px] h-[600px] rounded-full blur-[150px] opacity-[0.06] bg-emerald-500 pointer-events-none animate-pulse-soft" style={{ animationDelay: '2s' }} />

      {/* Floating dots */}
      {Array.from({ length: 30 }, (_, i) => (
        <div
          key={i}
          className="absolute pointer-events-none rounded-full"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#84cc16' : '#008751',
            opacity: Math.random() * 0.15 + 0.03,
            animation: `float-shape ${Math.random() * 10 + 10}s ease-in-out ${Math.random() * 5}s infinite alternate`,
          }}
        />
      ))}

      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full max-w-[420px] relative z-10"
        style={{
          perspective: '1200px',
        }}
      >
        <div
          className="relative transition-all duration-200 ease-out"
          style={{
            transform: `rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg)`,
          }}
        >
          {/* Glow behind card */}
          <div
            className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl transition-opacity duration-500"
            style={{
              background: 'linear-gradient(135deg, #008751, #fbbf24, #008751)',
              animation: 'pulse-glow 4s ease-in-out infinite',
            }}
          />

          {/* Card */}
          <div className="relative bg-white/[0.96] backdrop-blur-xl rounded-3xl shadow-[0_8px_60px_rgba(0,0,0,0.4)] overflow-hidden group">
            {/* Animated border */}
            <div className="absolute inset-0 rounded-3xl p-[1px] pointer-events-none">
              <div className="absolute inset-0 rounded-3xl overflow-hidden">
                <div
                  className="absolute -inset-[100%] w-[300%] h-[300%] opacity-30"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent, #008751, #fbbf24, #008751, transparent)',
                    animation: 'border-rotate 4s linear infinite',
                  }}
                />
              </div>
            </div>

            {/* Header */}
            <div className="relative overflow-hidden px-7 pt-7 pb-8 text-center"
              style={{ background: 'linear-gradient(160deg, #001a0f 0%, #022c22 40%, #064e3b 70%, #006838 100%)' }}>
              <div className="absolute inset-0 opacity-[0.05]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-emerald-500/10 blur-[60px]" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-amber-500/10 blur-[60px]" />

              <div className="relative z-10">
                {/* Logo */}
                <div className="relative inline-flex mb-5">
                  <div className="absolute -inset-3 rounded-2xl bg-emerald-500/10 blur-md" />
                  <div className="relative w-24 h-24 rounded-2xl bg-white/[0.06] backdrop-blur border border-white/10 p-2.5 overflow-hidden group/logo"
                    style={{ animation: 'breathe 3s ease-in-out infinite' }}>
                    <img src={logo} alt="GSHSMB Logo" className="w-full h-full object-contain transition-all duration-500 group-hover/logo:scale-110" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 border-2 border-emerald-900 flex items-center justify-center shadow-lg">
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
                <div className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 backdrop-blur-sm group/badge hover:bg-amber-400/15 hover:border-amber-400/30 transition-all duration-300 cursor-default">
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

            {/* Form Body */}
            <div className="px-7 pt-6 pb-7 relative">
              {/* Welcome */}
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    Welcome Back
                    <Sparkles size={14} className="text-amber-500" />
                  </h2>
                  <p className="text-slate-500 text-xs mt-0.5">Sign in to your account to continue</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center border border-emerald-200/60">
                  <Shield size={16} className="text-emerald-600" />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 bg-red-50/90 backdrop-blur border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-3"
                  style={{ animation: 'slide-down 0.3s ease-out' }}>
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0 mt-1.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <div className={`absolute left-0 top-0 h-full w-10 flex items-center justify-center pointer-events-none transition-colors duration-300 ${
                      focusedField === 'email' || email ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      <Mail size={15} />
                    </div>
                    <input
                      type="email"
                      className={`block w-full rounded-xl border bg-white/80 pl-10 pr-4 py-2.5 text-sm shadow-sm placeholder:text-slate-400 outline-none transition-all duration-300 ${
                        focusedField === 'email' || email
                          ? 'border-emerald-500 ring-2 ring-emerald-500/15'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      placeholder="admin@gshsmb.gov.ng"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      autoComplete="email"
                      required
                    />
                    {focusedField === 'email' && (
                      <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 rounded-full"
                        style={{ width: '100%', backgroundSize: '200% 100%', animation: 'gradient-shift 2s linear infinite' }} />
                    )}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Password</label>
                    <Link to="/forgot-password" className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium transition-colors hover:underline underline-offset-2">
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className={`absolute left-0 top-0 h-full w-10 flex items-center justify-center pointer-events-none transition-colors duration-300 ${
                      focusedField === 'password' || password ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      <Lock size={15} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`block w-full rounded-xl border bg-white/80 pl-10 pr-10 py-2.5 text-sm shadow-sm placeholder:text-slate-400 outline-none transition-all duration-300 ${
                        focusedField === 'password' || password
                          ? 'border-emerald-500 ring-2 ring-emerald-500/15'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    onMouseEnter={() => setHoverBtn(true)}
                    onMouseLeave={() => setHoverBtn(false)}
                    className="relative w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-300 outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer overflow-hidden group/btn shadow-lg"
                    style={{
                      background: hoverBtn
                        ? 'linear-gradient(135deg, #006838, #008751)'
                        : 'linear-gradient(135deg, #008751, #006838)',
                      boxShadow: hoverBtn ? '0 8px 25px rgba(0,135,81,0.35)' : '0 4px 15px rgba(0,135,81,0.25)',
                    }}
                  >
                    <span className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"
                      style={{ background: 'linear-gradient(135deg, #006838, #00502a)' }}
                    />
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-[0.8s] ease-in-out" />
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

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-[10px] text-slate-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Secured with 256-bit encryption
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
            { icon: Building2, label: 'Hospitals', value: `${statsDisplay.total_hospitals}+`, color: '#fbbf24' },
            { icon: Users, label: 'Staff Records', value: `${statsDisplay.total_employees.toLocaleString()}+`, color: '#84cc16' },
            { icon: Activity, label: 'Departments', value: `${statsDisplay.total_departments}+`, color: '#008751' },
          ].map((stat, idx) => (
            <div
              key={stat.label}
              className="relative group/stats rounded-2xl border border-white/10 p-3.5 text-center overflow-hidden transition-all duration-300 hover:border-amber-400/30 hover:-translate-y-0.5"
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(8px)',
                animation: `slide-up 0.5s ease-out ${0.1 + idx * 0.1}s both`,
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
          style={{ animation: 'slide-up 0.5s ease-out 0.5s both' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 transition-all duration-300 hover:bg-white/5 hover:border-white/20"
            style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)' }}>
            <span className="text-emerald-200/50 text-[10px] font-medium">Portal for</span>
            <span className="relative h-4 w-[130px] inline-flex items-center overflow-hidden">
              {roles.map((r, i) => (
                <span
                  key={r}
                  className={`absolute text-white text-[10px] font-semibold tracking-wide transition-all duration-500 ${
                    i === roleIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                  }`}
                >
                  {r}
                </span>
              ))}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 text-center"
          style={{ animation: 'slide-up 0.5s ease-out 0.6s both' }}>
          <p className="text-[10px] text-emerald-200/30 font-medium tracking-wide">
            Gombe State Hospital Services Management Board &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
