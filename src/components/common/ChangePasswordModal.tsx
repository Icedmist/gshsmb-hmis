import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Modal from './Modal';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function ChangePasswordModal({ onClose }: Props) {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      await changePassword(current, newPassword);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Change Password">
      {success ? (
        <div className="text-center py-6 space-y-3 animate-scale-in">
          <div className="relative inline-flex">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
              <KeyRound size={10} className="text-white" />
            </span>
          </div>
          <p className="text-emerald-700 font-semibold text-base">Password changed successfully!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-50/80 border border-red-200/80 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-3 shadow-sm animate-fade-in">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0 mt-1.5 animate-ping-soft" />
              <span className="flex-1">{error}</span>
            </div>
          )}
          <div>
            <label className="label">Current Password</label>
            <div className="relative group">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors duration-200 group-focus-within:text-emerald-600" />
              <input
                type={showCurrent ? 'text' : 'password'}
                className="input pl-10 pr-10"
                value={current}
                onChange={e => setCurrent(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">New Password</label>
            <div className="relative group">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors duration-200 group-focus-within:text-emerald-600" />
              <input
                type={showNew ? 'text' : 'password'}
                className="input pl-10 pr-10"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
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
            <label className="label">Confirm New Password</label>
            <div className="relative group">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors duration-200 group-focus-within:text-emerald-600" />
              <input
                type={showNew ? 'text' : 'password'}
                className={`input pl-10 ${
                  confirm && newPassword !== confirm
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                    : ''
                }`}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
            </div>
            {confirm && newPassword !== confirm && (
              <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 animate-fade-in-fast">
                <span className="w-1 h-1 rounded-full bg-red-500" />
                Passwords do not match
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Change Password</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
