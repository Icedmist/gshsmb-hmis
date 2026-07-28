import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Scale, ArrowLeft, Eye, EyeOff, KeyRound, Mail, Lock, CheckCircle2 } from 'lucide-react';
import logo from '../../assets/logo.jpeg';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
        @keyframes float-shape {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(30px, -30px) rotate(180deg); }
        }
        @keyframes rotate-border {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />
      <div className="absolute -top-48 -left-48 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.08] bg-amber-500 pointer-events-none animate-pulse-soft" />
      <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.08] bg-emerald-500 pointer-events-none animate-pulse-soft" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[200px] opacity-[0.04] bg-emerald-600 pointer-events-none" />

      <div className="w-full max-w-[440px] relative z-10 animate-fade-in">
        <div className="relative bg-white/[0.94] backdrop-blur-2xl rounded-3xl shadow-[0_8px_60px_rgba(0,0,0,0.35)] overflow-hidden">
          <div className="absolute inset-0 rounded-3xl p-[1px] pointer-events-none">
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              <div
                className="absolute -inset-[100%] w-[300%] h-[300%] opacity-30"
                style={{
                  background: 'conic-gradient(from 0deg, transparent, #008751, #fbbf24, #22c55e, #008751, transparent)',
                  animation: 'rotate-border 4s linear infinite',
                }}
              />
            </div>
          </div>

          <div className="relative overflow-hidden px-8 pt-8 pb-9 text-center"
            style={{ background: 'linear-gradient(160deg, #001a0f 0%, #022c22 40%, #064e3b 70%, #006838 100%)' }}>
            <div className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M20 0v40M0 20h40'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-emerald-500/10 blur-[60px]" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-amber-500/10 blur-[60px]" />
            <div className="relative z-10">
              <div className="relative inline-flex mb-5">
                <div className="absolute -inset-3 rounded-2xl bg-emerald-500/10 blur-md" />
                <div className="relative w-28 h-28 rounded-2xl bg-white/[0.08] backdrop-blur border-2 border-amber-400/30 shadow-[0_0_30px_rgba(251,191,36,0.15)] p-3 overflow-hidden mx-auto"
                  style={{ animation: 'float-shape 6s ease-in-out infinite' }}>
                  <img src={logo} alt="GSHSMB Logo" className="w-full h-full object-contain" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 border-2 border-emerald-900 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Shield size={12} className="text-emerald-900" />
                </div>
              </div>
              <h1 className="text-white text-xl font-bold leading-snug max-w-[280px] mx-auto">
                Gombe State Hospital Services<br />Management Board
              </h1>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 backdrop-blur transition-all duration-300 hover:bg-amber-400/15 hover:border-amber-400/30">
                <Scale size={14} className="text-amber-400" />
                <span className="text-amber-300 text-xs font-semibold tracking-widest uppercase">HMIS Portal</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 flex">
              <div className="flex-1 bg-[#008751]" />
              <div className="flex-1 bg-white" />
              <div className="flex-1 bg-[#008751]" />
            </div>
          </div>

          <div className="px-8 pt-7 pb-8">
            {success ? (
              <div className="text-center py-4 space-y-4"
                style={{ animation: 'slide-up 0.4s ease-out' }}>
                <div className="relative inline-flex">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <KeyRound size={32} className="text-emerald-600" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
                    <CheckCircle2 size={10} className="text-white" />
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Password Reset Successfully!</h3>
                <p className="text-sm text-slate-500">Redirecting you to login...</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Set New Password</h2>
                  <p className="text-slate-500 text-sm mt-0.5">Create a strong password for your account</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-gradient-to-r from-red-50 to-red-50/80 border border-red-200/80 text-red-700 px-4 py-3.5 rounded-xl text-sm flex items-start gap-3 shadow-sm animate-fade-in">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0 mt-1.5 animate-ping-soft" />
                      <span className="flex-1">{error}</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                    <div className="relative group">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors duration-200 group-focus-within:text-emerald-600" />
                      <input
                        type="email"
                        className="block w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-[3px] focus:ring-emerald-500/15 hover:border-slate-300 transition-all duration-200"
                        placeholder="admin@gshsmb.gov.ng"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
                    <div className="relative group">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors duration-200 group-focus-within:text-emerald-600" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="block w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-[3px] focus:ring-emerald-500/15 hover:border-slate-300 transition-all duration-200"
                        placeholder="Min. 6 characters"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors hover:bg-slate-100 p-1.5 rounded-lg"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {newPassword.length > 0 && newPassword.length < 6 && (
                      <p className="text-[11px] text-amber-500 mt-1 flex items-center gap-1 animate-fade-in-fast">
                        <span className="w-1 h-1 rounded-full bg-amber-500" />
                        Minimum 6 characters required
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
                    <div className="relative group">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors duration-200 group-focus-within:text-emerald-600" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={`block w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm shadow-sm placeholder:text-slate-400 outline-none transition-all duration-200 ${
                          confirmPassword && newPassword !== confirmPassword
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/15'
                            : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/15 hover:border-slate-300'
                        }`}
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 animate-fade-in-fast">
                        <span className="w-1 h-1 rounded-full bg-red-500" />
                        Passwords do not match
                      </p>
                    )}
                  </div>
                  <button type="submit" disabled={loading} className="relative w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-300 outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer overflow-hidden shadow-lg hover:shadow-[0_8px_25px_rgba(0,135,81,0.35)] active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, #008751 0%, #006838 50%, #00502a 100%)',
                      backgroundSize: '200% 200%',
                    }}>
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-[0.8s] ease-in-out" />
                    {loading ? (
                      <span className="relative z-10 flex items-center gap-2">
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        Resetting...
                      </span>
                    ) : (
                      <span className="relative z-10 flex items-center gap-2">
                        <KeyRound size={18} />
                        Reset Password
                      </span>
                    )}
                  </button>
                  <Link
                    to="/forgot-password"
                    className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 mt-4 transition-all group hover:gap-3"
                  >
                    <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> Request a new link
                  </Link>
                </form>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p className="text-xs text-emerald-200/40">
            Gombe State Hospital Services Management Board &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
