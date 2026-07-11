import { Menu, LogOut, KeyRound, Shield, ChevronDown, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ChangePasswordModal from '../common/ChangePasswordModal';

interface TopNavProps {
  onMenuClick: () => void;
}

export default function TopNav({ onMenuClick }: TopNavProps) {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-slate-500 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="hidden lg:flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full relative">
              <div className="absolute inset-0 rounded-full bg-[#008751] animate-ping opacity-40" />
              <div className="absolute inset-0 rounded-full bg-emerald-500" />
            </div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              {user?.role?.replace('_', ' ') || 'Dashboard'}
            </span>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <span className="text-xs text-slate-300">
              {new Date().toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/settings"
            className="hidden sm:flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors font-medium"
          >
            <Shield size={14} className="text-[#008751]" />
            <span>Profile</span>
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-3 text-sm text-slate-700 hover:text-slate-900 transition-all rounded-xl hover:bg-slate-50 pl-3 pr-2 py-1.5 border border-transparent hover:border-slate-200 shadow-sm hover:shadow"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.full_name}</p>
                <p className="text-[11px] text-slate-400 capitalize">{user?.role?.replace(/_/g, ' ')}</p>
              </div>
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm ring-2 ring-slate-100 relative"
                style={{ background: 'linear-gradient(135deg, #008751, #006838)' }}>
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">{user?.full_name?.charAt(0) || 'U'}</span>
                  </div>
                )}
              </div>
              <ChevronDown size={14} className={`text-slate-400 hidden sm:block transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 py-1.5 overflow-hidden animate-scale-in">
                <div className="px-4 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl overflow-hidden ring-2 ring-[#008751]/20 shadow-sm relative"
                      style={{ background: 'linear-gradient(135deg, #008751, #006838)' }}>
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-white font-bold text-base">{user?.full_name?.charAt(0) || 'U'}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{user?.full_name}</p>
                      <p className="text-xs text-slate-400">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="px-2 py-1">
                  <Link
                    to="/settings"
                    onClick={() => setShowMenu(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 rounded-xl transition-colors font-medium"
                  >
                    <User size={16} className="text-slate-400" /> Profile Settings
                  </Link>
                  <button
                    onClick={() => { setShowChangePassword(true); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 rounded-xl transition-colors font-medium"
                  >
                    <KeyRound size={16} className="text-slate-400" /> Change Password
                  </button>
                </div>
                <div className="border-t border-slate-100 px-2 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </>
  );
}
