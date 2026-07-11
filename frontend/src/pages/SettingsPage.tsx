import { useState, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS } from '../types';
import { Save, Camera, Shield, KeyRound, User } from 'lucide-react';
import Modal from '../components/common/Modal';

export default function SettingsPage() {
  const { user, changePassword, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const updatedUser: any = await api.put('/auth/profile', {
        full_name: fullName,
        email,
        phone_number: phone,
      });
      setAvatarUrl(updatedUser.avatar_url || '');
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response: any = await fetch('/api/auth/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${api.getToken()}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      setAvatarUrl(data.avatar_url);
      setMessage('Profile picture updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <User size={14} className="text-[#008751]" />
            <span>Account</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Settings</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage your personal information and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card p-6 text-center">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#008751]/20 mx-auto shadow-lg">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#008751] to-[#006838] flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">
                      {user?.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={triggerFileInput}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-10 h-10 bg-[#008751] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#006838] transition-colors disabled:opacity-50"
              >
                <Camera size={18} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            {uploading && <p className="text-sm text-slate-500 mt-3">Uploading...</p>}
            <h2 className="text-xl font-bold text-slate-900 mt-4">{user?.full_name}</h2>
            <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 bg-emerald-50 text-[#008751] text-xs font-medium rounded-full">
              <Shield size={12} />
              {ROLE_LABELS[user?.role || 'hr_officer']}
            </div>
            <p className="text-sm text-slate-500 mt-2">{user?.email}</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="section-title flex items-center gap-2">
                <User size={16} className="text-[#008751]" /> Personal Information
              </h3>
            </div>
            <div className="p-6">
              {message && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm mb-4">
                  {message}
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Email Address</label>
                    <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">Phone Number</label>
                    <input className="input" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="section-title flex items-center gap-2">
                <KeyRound size={16} className="text-[#008751]" /> Security
              </h3>
            </div>
            <div className="p-6">
              <button onClick={() => setShowPasswordModal(true)} className="btn-secondary">
                <KeyRound size={16} /> Change Password
              </button>
              <p className="text-xs text-slate-400 mt-2">Password must be at least 6 characters</p>
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordModal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </div>
  );
}

function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPw !== confirm) { setError('Passwords do not match.'); return; }
    if (newPw.length < 6) { setError('Password must be at least 6 characters.'); return; }
    try {
      await changePassword(current, newPw);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err: any) { setError(err.message); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Change Password">
      {success ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <KeyRound size={28} className="text-[#008751]" />
          </div>
          <p className="text-emerald-700 font-medium">Password changed successfully!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" value={current} onChange={e => setCurrent(e.target.value)} required />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" value={newPw} onChange={e => setNewPw(e.target.value)} required />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Change Password</button>
          </div>
        </form>
      )}
    </Modal>
  );
}