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
      <header className="h-16 bg-white/70 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 border-b border-emerald-900/5 transition-all duration-300">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-emerald-800 hover:text-emerald-950 p-2 rounded-xl hover:bg-emerald-50 transition-colors shadow-sm"
          >
            <Menu size={20} />
          </button>
          <div className="hidden lg:flex items-center gap-3">
            <div className="w-2 h-2 rounded-full relative">
              <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-40" />
              <div className="absolute inset-0 rounded-full bg-emerald-500" />
            </div>
            <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
              {user?.role?.replace(/_/g, ' ')}
            </span>
            {hospitalName && (
              <>
                <div className="w-px h-4 bg-slate-200 mx-1" />
                <span className="text-xs text-slate-600 flex items-center gap-1.5 font-semibold bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">
                  <Building2 size={12} className="text-emerald-600" /> {hospitalName}
                </span>
              </>
            )}
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <span className="text-xs text-slate-500 tabular-nums font-semibold">
              {new Date().toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/settings"
            className="hidden sm:flex items-center gap-2 text-xs text-slate-600 hover:text-emerald-700 px-3 py-2 rounded-xl hover:bg-emerald-50 hover:shadow-sm border border-transparent hover:border-emerald-100 transition-all font-semibold"
          >
            <Shield size={14} className="text-emerald-500" />
            <span>Profile</span>
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-3 hover:bg-white transition-all rounded-2xl pl-3 pr-2 py-1.5 border border-transparent hover:border-slate-200 hover:shadow-sm active:scale-[0.98]"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-800 leading-tight">{user?.full_name}</p>
                <p className="text-[10px] text-slate-500 font-medium capitalize mt-0.5">
                  {user?.role?.replace(/_/g, ' ')}
                  {hospitalName && <span className="text-emerald-600 ml-1">· {hospitalName}</span>}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm ring-2 ring-emerald-100 relative bg-gradient-to-br from-emerald-50 to-emerald-100 flex-shrink-0">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-emerald-700 font-black text-sm drop-shadow-sm">{user?.full_name?.charAt(0) || 'U'}</span>
                  </div>
                )}
              </div>
              <ChevronDown size={14} className={`text-slate-400 hidden sm:block transition-transform duration-300 ${showMenu ? 'rotate-180' : ''}`} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-3 w-72 bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-slate-200/60 z-50 overflow-hidden animate-scale-in origin-top-right">
                    <div className="px-5 py-5 border-b border-slate-100 bg-gradient-to-br from-slate-50/50 to-white">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden ring-4 ring-emerald-50 shadow-md relative bg-gradient-to-br from-emerald-100 to-emerald-200 flex-shrink-0">
                          {user?.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-emerald-700 font-black text-xl">{user?.full_name?.charAt(0) || 'U'}</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-extrabold text-slate-800 truncate">{user?.full_name}</p>
                          <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{user?.email}</p>
                          {hospitalName && (
                            <p className="text-[10px] font-bold text-emerald-700 mt-1.5 flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-md w-fit border border-emerald-100">
                              <Building2 size={10} /> {hospitalName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                <div className="px-3 py-2">
                  <Link
                    to="/settings"
                    onClick={() => setShowMenu(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-emerald-50/80 hover:text-emerald-800 rounded-2xl transition-all font-semibold group"
                  >
                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                      <User size={16} />
                    </div>
                    Profile Settings
                  </Link>
                  <button
                    onClick={() => { setShowChangePassword(true); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-amber-50/80 hover:text-amber-800 rounded-2xl transition-all font-semibold group"
                  >
                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                      <KeyRound size={16} />
                    </div>
                    Change Password
                  </button>
                </div>
                <div className="border-t border-slate-100 px-3 py-2 bg-slate-50/50">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-2xl transition-all font-semibold group"
                  >
                    <div className="p-2 bg-rose-50 rounded-lg group-hover:bg-rose-100 group-hover:text-rose-700 transition-colors">
                      <LogOut size={16} />
                    </div>
                    Secure Logout
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
