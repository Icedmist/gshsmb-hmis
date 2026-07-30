import { Menu, LogOut, KeyRound, Shield, ChevronDown, User, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ChangePasswordModal from '../common/ChangePasswordModal';
import { getDocById } from '../../lib/firestore';
import { getHospitalScope } from '../../lib/scope';

interface TopNavProps {
  onMenuClick: () => void;
}

export default function TopNav({ onMenuClick }: TopNavProps) {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [hospitalName, setHospitalName] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hospitalScope = getHospitalScope(user);

  useEffect(() => {
    if (hospitalScope) {
      getDocById('hospitals', hospitalScope).then(doc => {
        if (doc?.hospital_name) setHospitalName(doc.hospital_name);
      });
    } else {
      setHospitalName(null);
    }
  }, [hospitalScope]);

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
      <header className="h-16 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 shadow-md flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 border-b border-emerald-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-emerald-100 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="hidden lg:flex items-center gap-3">
            <div className="w-2 h-2 rounded-full relative">
              <div className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-40" />
              <div className="absolute inset-0 rounded-full bg-amber-400" />
            </div>
            <span className="text-xs text-emerald-200 font-semibold uppercase tracking-wider">
              {user?.role?.replace(/_/g, ' ')}
            </span>
            {hospitalName && (
              <>
                <div className="w-px h-4 bg-emerald-700 mx-1" />
                <span className="text-xs text-emerald-100 flex items-center gap-1 font-medium">
                  <Building2 size={12} className="text-amber-400" /> {hospitalName}
                </span>
              </>
            )}
            <div className="w-px h-4 bg-emerald-700 mx-1" />
            <span className="text-xs text-emerald-300/70 tabular-nums font-medium">
              {new Date().toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/settings"
            className="hidden sm:flex items-center gap-2 text-xs text-emerald-100 hover:text-white px-3 py-2 rounded-xl hover:bg-white/10 transition-colors font-medium"
          >
            <Shield size={14} className="text-amber-400" />
            <span>Profile</span>
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2.5 text-sm hover:bg-white/5 transition-all rounded-xl pl-2.5 pr-2 py-1.5 border border-transparent hover:border-emerald-700/50"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-white leading-tight">{user?.full_name}</p>
                <p className="text-[11px] text-emerald-300/80 capitalize">
                  {user?.role?.replace(/_/g, ' ')}
                  {hospitalName && <span className="text-amber-400 ml-1">· {hospitalName}</span>}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md ring-2 ring-emerald-500/30 relative bg-gradient-to-br from-amber-400 to-amber-600">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm drop-shadow-md">{user?.full_name?.charAt(0) || 'U'}</span>
                  </div>
                )}
              </div>
              <ChevronDown size={14} className={`text-emerald-400 hidden sm:block transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200 z-50 py-1.5 overflow-hidden animate-scale-in">
                    <div className="px-4 py-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl overflow-hidden ring-2 ring-emerald-200/60 shadow-sm relative bg-gradient-to-br from-emerald-600 to-emerald-800">
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
                          {hospitalName && (
                            <p className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                              <Building2 size={10} /> {hospitalName}
                            </p>
                          )}
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
