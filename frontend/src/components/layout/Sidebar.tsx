import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Building2, Building, Users,
  Shield, ClipboardList, Settings, X,
  ArrowRightLeft, FileText, ChevronRight, Sparkles,
} from 'lucide-react';
import { UserRole } from '../../types';
import logoSrc from '../../assets/logo.jpeg';

interface NavItem {
  to: string;
  label: string;
  icon: any;
  roles: UserRole[];
  color: string;
  bg: string;
  lightBg: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin' as UserRole, 'executive_secretary' as UserRole, 'hospital_admin' as UserRole, 'hr_officer' as UserRole], color: '#008751', bg: 'from-emerald-600 to-emerald-700', lightBg: 'bg-emerald-50' },
  { to: '/hospitals', label: 'Hospitals', icon: Building2, roles: ['super_admin' as UserRole, 'executive_secretary' as UserRole], color: '#0284c7', bg: 'from-sky-500 to-sky-600', lightBg: 'bg-sky-50' },
  { to: '/departments', label: 'Departments', icon: Building, roles: ['super_admin' as UserRole, 'executive_secretary' as UserRole, 'hospital_admin' as UserRole], color: '#d97706', bg: 'from-amber-500 to-amber-600', lightBg: 'bg-amber-50' },
  { to: '/employees', label: 'Employees', icon: Users, roles: ['super_admin' as UserRole, 'executive_secretary' as UserRole, 'hospital_admin' as UserRole, 'hr_officer' as UserRole], color: '#0d9488', bg: 'from-teal-500 to-teal-600', lightBg: 'bg-teal-50' },
  { to: '/transfers', label: 'Transfers', icon: ArrowRightLeft, roles: ['super_admin' as UserRole, 'executive_secretary' as UserRole, 'hr_officer' as UserRole], color: '#ea580c', bg: 'from-orange-500 to-orange-600', lightBg: 'bg-orange-50' },
  { to: '/reports', label: 'Reports', icon: FileText, roles: ['super_admin' as UserRole, 'executive_secretary' as UserRole, 'hospital_admin' as UserRole, 'hr_officer' as UserRole], color: '#7c3aed', bg: 'from-violet-500 to-violet-600', lightBg: 'bg-violet-50' },
  { to: '/users', label: 'Users', icon: Shield, roles: ['super_admin' as UserRole], color: '#6366f1', bg: 'from-indigo-500 to-indigo-600', lightBg: 'bg-indigo-50' },
  { to: '/audit-logs', label: 'Audit Logs', icon: ClipboardList, roles: ['super_admin' as UserRole], color: '#e11d48', bg: 'from-rose-500 to-rose-600', lightBg: 'bg-rose-50' },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['super_admin' as UserRole, 'executive_secretary' as UserRole, 'hospital_admin' as UserRole, 'hr_officer' as UserRole], color: '#64748b', bg: 'from-slate-500 to-slate-600', lightBg: 'bg-slate-50' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, hasRole } = useAuth();

  const filteredItems = navItems.filter(item => hasRole(...item.roles));

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto shadow-xl lg:shadow-none flex flex-col ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: '#d9eab3' }}
      >
        {/* Decorative top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          <div className="flex-1 bg-[#008751]" />
          <div className="flex-1 bg-[#84cc16]" />
          <div className="flex-1 bg-[#008751]" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center justify-between h-16 px-5 border-b border-emerald-700/10 flex-shrink-0 bg-white/70 backdrop-blur-sm">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm overflow-hidden bg-white p-1.5 ring-2 ring-emerald-700/20 group-hover:ring-emerald-600/40 transition-all">
              <img src={logoSrc} alt="GSHSMB" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-emerald-900 leading-tight">GSHSMB</h1>
              <p className="text-[10px] text-emerald-700/60 leading-tight tracking-wide flex items-center gap-1">
                HMIS Portal
                <Sparkles size={10} className="text-emerald-600" />
              </p>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden text-emerald-700/50 hover:text-emerald-800 transition-colors p-1 rounded-lg hover:bg-white/60">
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <div className="relative flex-1 overflow-y-auto px-3 py-5 scrollbar-thin">
          <div className="flex items-center gap-2 px-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-emerald-700/20 to-transparent" />
            <span className="text-[10px] uppercase tracking-[0.15em] text-emerald-800/50 font-semibold">Menu</span>
            <div className="h-px flex-1 bg-gradient-to-l from-emerald-700/20 to-transparent" />
          </div>
          <nav className="space-y-0.5">
            {filteredItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                    isActive
                      ? 'text-white shadow-md shadow-emerald-900/15'
                      : 'text-emerald-800 hover:text-emerald-950'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <>
                        <span className={`absolute inset-0 rounded-xl bg-gradient-to-r ${item.bg}`} />
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-white/80" />
                      </>
                    )}
                    {!isActive && (
                      <span className="absolute inset-0 rounded-xl bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm" />
                    )}
                    <div className={`flex-shrink-0 relative z-10 p-1.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-white/15'
                        : 'bg-white/50 group-hover:bg-white group-hover:shadow-sm group-hover:scale-110'
                    }`}>
                      <item.icon
                        size={16}
                        style={isActive ? { color: 'white' } : { color: item.color }}
                        className="transition-transform duration-200"
                      />
                    </div>
                    <span className="relative z-10">{item.label}</span>
                    {isActive && (
                      <ChevronRight size={14} className="relative z-10 ml-auto text-white/70" />
                    )}
                    {!isActive && (
                      <div
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 scale-0 group-hover:scale-100"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>


      </aside>
    </>
  );
}
