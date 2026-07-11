import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import logoSrc from '../../assets/logo.jpeg';

export default function Layout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen"
        style={{ background: 'linear-gradient(135deg, #001a0f 0%, #022c22 30%, #064e3b 70%, #006838 100%)' }}>
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl p-3 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <img src={logoSrc} alt="GSHSMB" className="w-full h-full object-contain" />
          </div>
          <div className="absolute -bottom-2 -right-2">
            <div className="w-5 h-5 rounded-full bg-amber-400 border-2 border-emerald-900 flex items-center justify-center">
              <svg className="animate-spin h-3 w-3 text-emerald-900" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          </div>
        </div>
        <p className="mt-5 text-emerald-200/80 text-sm font-semibold tracking-wide">GSHSMB HMIS Platform</p>
        <p className="mt-6 flex items-center gap-2 text-emerald-300/50 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping-soft relative">
            <span className="absolute inset-0 rounded-full bg-emerald-400" />
          </span>
          Loading&hellip;
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#d9eab3' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
