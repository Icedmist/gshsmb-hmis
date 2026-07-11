import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Shield, Scale, ArrowLeft, Eye, EyeOff, KeyRound, Mail, Lock } from 'lucide-react';
import logo from '../../assets/logo.jpeg';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
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
      await api.post('/auth/reset-password', { email, code, new_password: newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 selection:bg-emerald-500/30"
      style={{ background: 'linear-gradient(135deg, #020617 0%, #022c22 25%, #064e3b 50%, #0c2d1a 75%, #0f172a 100%)' }}>
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />
      <div className="absolute -top-48 -left-48 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.08] bg-amber-500 pointer-events-none" />
      <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.08] bg-emerald-500 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[200px] opacity-[0.04] bg-emerald-600 pointer-events-none" />

      <div className="w-full max-w-[440px] relative z-10 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/25 overflow-hidden">
          <div className="relative overflow-hidden px-8 pt-8 pb-9 text-center"
            style={{ background: 'linear-gradient(160deg, #001a0f 0%, #022c22 40%, #064e3b 70%, #006838 100%)' }}>
            <div className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M20 0v40M0 20h40'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-2xl bg-white/[0.08] backdrop-blur border-2 border-amber-400/30 mb-5 shadow-[0_0_30px_rgba(251,191,36,0.15)] p-3 overflow-hidden mx-auto">
                <img src={logo} alt="GSHSMB Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-white text-xl font-bold leading-snug max-w-[280px] mx-auto">
                Gombe State Hospital Services<br />Management Board
              </h1>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 backdrop-blur">
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
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <KeyRound size={32} className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Password Reset Successfully!</h3>
                <p className="text-sm text-slate-500">Redirecting you to login...</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Enter Reset Code</h2>
                  <p className="text-slate-500 text-sm mt-0.5">Enter the code sent to your email, then set a new password</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm flex items-start gap-3 animate-fade-in">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0 mt-1.5" />
                      <span>{error}</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        className="block w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 transition-all duration-200"
                        placeholder="admin@gshsmb.gov.ng"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reset Code</label>
                    <input
                      type="text"
                      className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm text-center tracking-[0.25em] font-mono text-lg placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 transition-all duration-200"
                      placeholder="_ _ _ _ _ _"
                      maxLength={6}
                      value={code}
                      onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="block w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 transition-all duration-200"
                        placeholder="Min. 6 characters"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="block w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 transition-all duration-200"
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base font-semibold">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        Resetting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <KeyRound size={18} />
                        Reset Password
                      </span>
                    )}
                  </button>
                  <Link
                    to="/forgot-password"
                    className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 mt-4 transition-colors"
                  >
                    <ArrowLeft size={16} /> Request a new code
                  </Link>
                </form>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-emerald-200/40">
            Gombe State Hospital Services Management Board &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
