import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Building2, Building, Users,
  Shield, ClipboardList, Settings, X,
  ArrowRight, ArrowRightLeft, FileText, ChevronRight, Sparkles,
  Stethoscope, Activity, AlertTriangle, Heart,
  GraduationCap, Target, BarChart3, TrendingUp,
  BookOpen, Pill, FlaskConical, Thermometer,
  Wrench, Syringe, AlertCircle, Microscope,
  ClipboardCheck, Award, DollarSign, Wallet,
  PiggyBank, CreditCard, Briefcase, Landmark,
  Scale, TrendingDown,
  Bell, ListTodo, MessageSquare,
} from 'lucide-react';
import { UserRole } from '../../types';
import { getUnreadCount } from '../../lib/notifications';
import { getUnreadMessageCount } from '../../lib/messaging';
import logoSrc from '../../assets/logo.jpeg';

interface NavItem {
  to: string;
  label: string;
  icon: any;
  roles: UserRole[];
  color: string;
  bg: string;
  lightBg: string;
  badgeKey?: 'notifications' | 'messages';
}

const sections: { label: string; color: string; items: NavItem[] }[] = [
  {
    label: 'General', color: '#008751',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin' as UserRole, 'executive_secretary' as UserRole, 'hospital_admin' as UserRole, 'hr_officer' as UserRole, 'director_hr' as UserRole], color: '#008751', bg: 'from-emerald-600 to-emerald-700', lightBg: 'bg-emerald-50' },
      { to: '/hospitals', label: 'Hospitals', icon: Building2, roles: ['super_admin' as UserRole, 'executive_secretary' as UserRole], color: '#0284c7', bg: 'from-sky-500 to-sky-600', lightBg: 'bg-sky-50' },
      { to: '/departments', label: 'Departments', icon: Building, roles: ['super_admin' as UserRole, 'executive_secretary' as UserRole, 'hospital_admin' as UserRole], color: '#d97706', bg: 'from-amber-500 to-amber-600', lightBg: 'bg-amber-50' },
      { to: '/employees', label: 'Employees', icon: Users, roles: ['super_admin' as UserRole, 'executive_secretary' as UserRole, 'hospital_admin' as UserRole, 'hr_officer' as UserRole, 'director_hr' as UserRole], color: '#0d9488', bg: 'from-teal-500 to-teal-600', lightBg: 'bg-teal-50' },
      { to: '/transfers', label: 'Transfers', icon: ArrowRightLeft, roles: ['super_admin' as UserRole, 'executive_secretary' as UserRole, 'hr_officer' as UserRole, 'director_hr' as UserRole], color: '#ea580c', bg: 'from-orange-500 to-orange-600', lightBg: 'bg-orange-50' },
      { to: '/reports', label: 'Reports', icon: FileText, roles: ['super_admin' as UserRole, 'executive_secretary' as UserRole, 'hospital_admin' as UserRole, 'hr_officer' as UserRole, 'director_hr' as UserRole, 'director_prs' as UserRole], color: '#7c3aed', bg: 'from-violet-500 to-violet-600', lightBg: 'bg-violet-50' },
    ],
  },
  {
    label: 'Locum Management', color: '#0891b2',
    items: [
      { to: '/locum-dashboard', label: 'Locum Dashboard', icon: Briefcase, roles: ['super_admin' as UserRole, 'executive_secretary' as UserRole, 'hospital_admin' as UserRole, 'hr_officer' as UserRole, 'director_hr' as UserRole], color: '#0891b2', bg: 'from-cyan-500 to-cyan-600', lightBg: 'bg-cyan-50' },
      { to: '/locum-requests', label: 'Locum Requests', icon: FileText, roles: ['super_admin' as UserRole, 'executive_secretary' as UserRole, 'hospital_admin' as UserRole], color: '#0e7490', bg: 'from-cyan-600 to-cyan-700', lightBg: 'bg-cyan-50' },
      { to: '/staffing-requests', label: 'Staffing Requests', icon: Users, roles: ['super_admin' as UserRole, 'executive_secretary' as UserRole, 'hospital_admin' as UserRole], color: '#0f766e', bg: 'from-teal-600 to-teal-700', lightBg: 'bg-teal-50' },
      { to: '/locum-assignments', label: 'Assignments', icon: ClipboardCheck, roles: ['super_admin' as UserRole, 'executive_secretary' as UserRole, 'hospital_admin' as UserRole, 'hr_officer' as UserRole, 'director_hr' as UserRole], color: '#6d28d9', bg: 'from-violet-500 to-violet-600', lightBg: 'bg-violet-50' },
    ],
  },
  {
    label: 'Medical Services', color: '#008751',
    items: [
      { to: '/medical-dashboard', label: 'Medical Dashboard', icon: Stethoscope, roles: ['director_medical_services' as UserRole, 'medical_admin' as UserRole], color: '#008751', bg: 'from-emerald-600 to-emerald-700', lightBg: 'bg-emerald-50' },
      { to: '/clinical-guidelines', label: 'Clinical Guidelines', icon: FileText, roles: ['director_medical_services' as UserRole, 'medical_admin' as UserRole], color: '#0d9488', bg: 'from-teal-500 to-teal-600', lightBg: 'bg-teal-50' },
      { to: '/clinical-audits', label: 'Clinical Audits', icon: ClipboardList, roles: ['director_medical_services' as UserRole, 'medical_admin' as UserRole], color: '#d97706', bg: 'from-amber-500 to-amber-600', lightBg: 'bg-amber-50' },
      { to: '/specialists', label: 'Specialists', icon: Activity, roles: ['director_medical_services' as UserRole, 'medical_admin' as UserRole, 'hr_officer' as UserRole, 'director_hr' as UserRole], color: '#0284c7', bg: 'from-sky-500 to-sky-600', lightBg: 'bg-sky-50' },
      { to: '/referral-reports', label: 'Referral Reports', icon: ArrowRight, roles: ['director_medical_services' as UserRole, 'medical_admin' as UserRole], color: '#ea580c', bg: 'from-orange-500 to-orange-600', lightBg: 'bg-orange-50' },
      { to: '/emergency-reports', label: 'Emergency Reports', icon: AlertTriangle, roles: ['director_medical_services' as UserRole, 'medical_admin' as UserRole], color: '#e11d48', bg: 'from-rose-500 to-rose-600', lightBg: 'bg-rose-50' },
    ],
  },
  {
    label: 'Nursing Services', color: '#e11d48',
    items: [
      { to: '/nursing-dashboard', label: 'Nursing Dashboard', icon: Heart, roles: ['director_nursing_services' as UserRole, 'nursing_admin' as UserRole], color: '#e11d48', bg: 'from-rose-500 to-rose-600', lightBg: 'bg-rose-50' },
      { to: '/nursing-workforce', label: 'Workforce Monitoring', icon: Users, roles: ['director_nursing_services' as UserRole, 'nursing_admin' as UserRole], color: '#0d9488', bg: 'from-teal-500 to-teal-600', lightBg: 'bg-teal-50' },
      { to: '/nursing-audits', label: 'Nursing Audits', icon: ClipboardList, roles: ['director_nursing_services' as UserRole, 'nursing_admin' as UserRole], color: '#6366f1', bg: 'from-indigo-500 to-indigo-600', lightBg: 'bg-indigo-50' },
      { to: '/nursing-training', label: 'Training Programmes', icon: GraduationCap, roles: ['director_nursing_services' as UserRole, 'nursing_admin' as UserRole, 'hr_officer' as UserRole, 'director_hr' as UserRole], color: '#7c3aed', bg: 'from-violet-500 to-violet-600', lightBg: 'bg-violet-50' },
      { to: '/nursing-certifications', label: 'Certifications', icon: Award, roles: ['director_nursing_services' as UserRole, 'nursing_admin' as UserRole], color: '#008751', bg: 'from-emerald-600 to-emerald-700', lightBg: 'bg-emerald-50' },
    ],
  },
  {
    label: 'PRS', color: '#0284c7',
    items: [
      { to: '/prs-dashboard', label: 'PRS Dashboard', icon: BarChart3, roles: ['director_prs' as UserRole, 'prs_admin' as UserRole], color: '#0284c7', bg: 'from-sky-500 to-sky-600', lightBg: 'bg-sky-50' },
      { to: '/kpis', label: 'KPI Management', icon: Target, roles: ['director_prs' as UserRole, 'prs_admin' as UserRole], color: '#008751', bg: 'from-emerald-600 to-emerald-700', lightBg: 'bg-emerald-50' },
      { to: '/performance-indicators', label: 'Performance Indicators', icon: TrendingUp, roles: ['director_prs' as UserRole, 'prs_admin' as UserRole], color: '#d97706', bg: 'from-amber-500 to-amber-600', lightBg: 'bg-amber-50' },
      { to: '/scorecards', label: 'Scorecards', icon: TrendingUp, roles: ['director_prs' as UserRole, 'prs_admin' as UserRole], color: '#0d9488', bg: 'from-teal-500 to-teal-600', lightBg: 'bg-teal-50' },
      { to: '/statistics', label: 'Statistics', icon: Activity, roles: ['director_prs' as UserRole, 'prs_admin' as UserRole], color: '#6366f1', bg: 'from-indigo-500 to-indigo-600', lightBg: 'bg-indigo-50' },
      { to: '/research', label: 'Research', icon: BookOpen, roles: ['director_prs' as UserRole, 'prs_admin' as UserRole], color: '#0284c7', bg: 'from-sky-500 to-sky-600', lightBg: 'bg-sky-50' },
    ],
  },
  {
    label: 'Pharmaceutical Services', color: '#008751',
    items: [
      { to: '/pharmaceutical-dashboard', label: 'Pharm. Dashboard', icon: Pill, roles: ['director_pharmaceutical_services' as UserRole, 'pharmacy_admin' as UserRole], color: '#008751', bg: 'from-emerald-600 to-emerald-700', lightBg: 'bg-emerald-50' },
      { to: '/medicine-registry', label: 'Medicine Registry', icon: ClipboardList, roles: ['director_pharmaceutical_services' as UserRole, 'pharmacy_admin' as UserRole, 'hospital_admin' as UserRole], color: '#0284c7', bg: 'from-sky-500 to-sky-600', lightBg: 'bg-sky-50' },
      { to: '/essential-medicines', label: 'Essential Medicines', icon: FileText, roles: ['director_pharmaceutical_services' as UserRole, 'pharmacy_admin' as UserRole], color: '#0d9488', bg: 'from-teal-500 to-teal-600', lightBg: 'bg-teal-50' },
      { to: '/pharmaceutical-audits', label: 'Pharm. Audits', icon: ClipboardCheck, roles: ['director_pharmaceutical_services' as UserRole, 'pharmacy_admin' as UserRole, 'hospital_admin' as UserRole], color: '#d97706', bg: 'from-amber-500 to-amber-600', lightBg: 'bg-amber-50' },
      { to: '/pharmaceutical-workforce', label: 'Workforce Registry', icon: Users, roles: ['director_pharmaceutical_services' as UserRole, 'pharmacy_admin' as UserRole, 'hr_officer' as UserRole, 'director_hr' as UserRole], color: '#6366f1', bg: 'from-indigo-500 to-indigo-600', lightBg: 'bg-indigo-50' },
      { to: '/pharmaceutical-quality', label: 'Quality Assurance', icon: Shield, roles: ['director_pharmaceutical_services' as UserRole, 'pharmacy_admin' as UserRole], color: '#7c3aed', bg: 'from-violet-500 to-violet-600', lightBg: 'bg-violet-50' },
      { to: '/pharmacovigilance', label: 'Pharmacovigilance', icon: AlertTriangle, roles: ['director_pharmaceutical_services' as UserRole, 'pharmacy_admin' as UserRole, 'hospital_admin' as UserRole], color: '#ea580c', bg: 'from-orange-500 to-orange-600', lightBg: 'bg-orange-50' },
      { to: '/pharmaceutical-reports', label: 'Pharm. Reports', icon: BarChart3, roles: ['director_pharmaceutical_services' as UserRole, 'pharmacy_admin' as UserRole, 'executive_secretary' as UserRole], color: '#64748b', bg: 'from-slate-500 to-slate-600', lightBg: 'bg-slate-50' },
    ],
  },
  {
    label: 'Laboratory Services', color: '#0d9488',
    items: [
      { to: '/laboratory-dashboard', label: 'Lab. Dashboard', icon: Microscope, roles: ['director_laboratory_services' as UserRole, 'lab_admin' as UserRole], color: '#0d9488', bg: 'from-teal-500 to-teal-600', lightBg: 'bg-teal-50' },
      { to: '/laboratory-registry', label: 'Lab. Registry', icon: FlaskConical, roles: ['director_laboratory_services' as UserRole, 'lab_admin' as UserRole, 'hospital_admin' as UserRole], color: '#0284c7', bg: 'from-sky-500 to-sky-600', lightBg: 'bg-sky-50' },
      { to: '/laboratory-audits', label: 'Lab. Audits', icon: ClipboardCheck, roles: ['director_laboratory_services' as UserRole, 'lab_admin' as UserRole, 'hospital_admin' as UserRole], color: '#d97706', bg: 'from-amber-500 to-amber-600', lightBg: 'bg-amber-50' },
      { to: '/laboratory-workforce', label: 'Workforce Registry', icon: Users, roles: ['director_laboratory_services' as UserRole, 'lab_admin' as UserRole, 'hr_officer' as UserRole, 'director_hr' as UserRole], color: '#6366f1', bg: 'from-indigo-500 to-indigo-600', lightBg: 'bg-indigo-50' },
      { to: '/equipment-registry', label: 'Equipment Registry', icon: Wrench, roles: ['director_laboratory_services' as UserRole, 'lab_admin' as UserRole, 'hospital_admin' as UserRole], color: '#0d9488', bg: 'from-teal-500 to-teal-600', lightBg: 'bg-teal-50' },
      { to: '/maintenance-records', label: 'Maintenance', icon: Thermometer, roles: ['director_laboratory_services' as UserRole, 'lab_admin' as UserRole], color: '#ea580c', bg: 'from-orange-500 to-orange-600', lightBg: 'bg-orange-50' },
      { to: '/reagents', label: 'Reagents', icon: Syringe, roles: ['director_laboratory_services' as UserRole, 'lab_admin' as UserRole, 'hospital_admin' as UserRole], color: '#7c3aed', bg: 'from-violet-500 to-violet-600', lightBg: 'bg-violet-50' },
      { to: '/disease-surveillance', label: 'Disease Surveillance', icon: Activity, roles: ['director_laboratory_services' as UserRole, 'lab_admin' as UserRole], color: '#e11d48', bg: 'from-rose-500 to-rose-600', lightBg: 'bg-rose-50' },
      { to: '/laboratory-reports', label: 'Lab. Reports', icon: BarChart3, roles: ['director_laboratory_services' as UserRole, 'lab_admin' as UserRole, 'executive_secretary' as UserRole], color: '#64748b', bg: 'from-slate-500 to-slate-600', lightBg: 'bg-slate-50' },
    ],
  },
  {
    label: 'Finance & Accounts', color: '#059669',
    items: [
      { to: '/finance-dashboard', label: 'Finance Dashboard', icon: DollarSign, roles: ['director_finance' as UserRole], color: '#059669', bg: 'from-emerald-600 to-emerald-700', lightBg: 'bg-emerald-50' },
      { to: '/budget-management', label: 'Budget Management', icon: PiggyBank, roles: ['director_finance' as UserRole], color: '#0284c7', bg: 'from-sky-500 to-sky-600', lightBg: 'bg-sky-50' },
      { to: '/revenue-management', label: 'Revenue Management', icon: TrendingUp, roles: ['director_finance' as UserRole], color: '#0d9488', bg: 'from-teal-500 to-teal-600', lightBg: 'bg-teal-50' },
      { to: '/expenditure-management', label: 'Expenditure Management', icon: TrendingDown, roles: ['director_finance' as UserRole], color: '#ea580c', bg: 'from-orange-500 to-orange-600', lightBg: 'bg-orange-50' },
      { to: '/payroll-monitoring', label: 'Payroll Monitoring', icon: Wallet, roles: ['director_finance' as UserRole, 'hr_officer' as UserRole, 'director_hr' as UserRole], color: '#7c3aed', bg: 'from-violet-500 to-violet-600', lightBg: 'bg-violet-50' },
      { to: '/treasury-management', label: 'Treasury Management', icon: Landmark, roles: ['director_finance' as UserRole], color: '#6366f1', bg: 'from-indigo-500 to-indigo-600', lightBg: 'bg-indigo-50' },
      { to: '/asset-management', label: 'Asset Management', icon: Briefcase, roles: ['director_finance' as UserRole], color: '#008751', bg: 'from-emerald-600 to-emerald-700', lightBg: 'bg-emerald-50' },
      { to: '/financial-compliance', label: 'Financial Compliance', icon: Scale, roles: ['director_finance' as UserRole], color: '#e11d48', bg: 'from-rose-500 to-rose-600', lightBg: 'bg-rose-50' },
      { to: '/financial-reports', label: 'Financial Reports', icon: FileText, roles: ['director_finance' as UserRole, 'executive_secretary' as UserRole], color: '#64748b', bg: 'from-slate-500 to-slate-600', lightBg: 'bg-slate-50' },
      { to: '/financial-analytics', label: 'Financial Analytics', icon: BarChart3, roles: ['director_finance' as UserRole, 'executive_secretary' as UserRole, 'director_prs' as UserRole], color: '#d97706', bg: 'from-amber-500 to-amber-600', lightBg: 'bg-amber-50' },
    ],
  },
  {
    label: 'Collaboration', color: '#7c3aed',
    items: [
      { to: '/notifications', label: 'Notifications', icon: Bell, roles: ['super_admin' as UserRole, 'executive_secretary' as UserRole, 'hospital_admin' as UserRole, 'hr_officer' as UserRole, 'director_hr' as UserRole, 'director_medical_services' as UserRole, 'director_nursing_services' as UserRole, 'director_prs' as UserRole, 'director_pharmaceutical_services' as UserRole, 'director_laboratory_services' as UserRole, 'director_finance' as UserRole, 'medical_admin' as UserRole, 'nursing_admin' as UserRole, 'pharmacy_admin' as UserRole, 'lab_admin' as UserRole, 'prs_admin' as UserRole], color: '#7c3aed', bg: 'from-violet-500 to-violet-600', lightBg: 'bg-violet-50', badgeKey: 'notifications' },
      { to: '/messages', label: 'Messages', icon: MessageSquare, roles: ['super_admin' as UserRole, 'executive_secretary' as UserRole, 'hospital_admin' as UserRole, 'hr_officer' as UserRole, 'director_hr' as UserRole, 'director_medical_services' as UserRole, 'director_nursing_services' as UserRole, 'director_prs' as UserRole, 'director_pharmaceutical_services' as UserRole, 'director_laboratory_services' as UserRole, 'director_finance' as UserRole, 'medical_admin' as UserRole, 'nursing_admin' as UserRole, 'pharmacy_admin' as UserRole, 'lab_admin' as UserRole, 'prs_admin' as UserRole], color: '#6366f1', bg: 'from-indigo-500 to-indigo-600', lightBg: 'bg-indigo-50', badgeKey: 'messages' },
      { to: '/tasks', label: 'Tasks', icon: ListTodo, roles: ['super_admin' as UserRole, 'executive_secretary' as UserRole, 'hospital_admin' as UserRole, 'hr_officer' as UserRole, 'director_hr' as UserRole, 'director_medical_services' as UserRole, 'director_nursing_services' as UserRole, 'director_prs' as UserRole, 'director_pharmaceutical_services' as UserRole, 'director_laboratory_services' as UserRole, 'director_finance' as UserRole, 'medical_admin' as UserRole, 'nursing_admin' as UserRole, 'pharmacy_admin' as UserRole, 'lab_admin' as UserRole, 'prs_admin' as UserRole], color: '#0d9488', bg: 'from-teal-500 to-teal-600', lightBg: 'bg-teal-50' },
    ],
  },
  {
    label: 'Administration', color: '#6366f1',
    items: [
      { to: '/users', label: 'Users', icon: Shield, roles: ['super_admin' as UserRole], color: '#6366f1', bg: 'from-indigo-500 to-indigo-600', lightBg: 'bg-indigo-50' },
      { to: '/audit-logs', label: 'Audit Logs', icon: ClipboardList, roles: ['super_admin' as UserRole], color: '#e11d48', bg: 'from-rose-500 to-rose-600', lightBg: 'bg-rose-50' },
      { to: '/settings', label: 'Settings', icon: Settings, roles: ['super_admin' as UserRole, 'executive_secretary' as UserRole, 'hospital_admin' as UserRole, 'hr_officer' as UserRole, 'director_hr' as UserRole], color: '#64748b', bg: 'from-slate-500 to-slate-600', lightBg: 'bg-slate-50' },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, hasRole } = useAuth();
  const [badges, setBadges] = useState<Record<string, number>>({ notifications: 0, messages: 0 });

  useEffect(() => {
    if (!user?.id) return;
    const fetchBadges = async () => {
      try {
        const [notifCount, msgCount] = await Promise.all([
          getUnreadCount(user.id),
          getUnreadMessageCount(user.id),
        ]);
        setBadges({ notifications: notifCount, messages: msgCount });
      } catch { /* ignore */ }
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 10000);
    return () => clearInterval(interval);
  }, [user?.id]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto shadow-xl lg:shadow-none flex flex-col ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: '#f1f5ee' }}
      >
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          <div className="flex-1 bg-emerald-600" />
          <div className="flex-1 bg-lime-500" />
          <div className="flex-1 bg-emerald-600" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center justify-between h-16 px-5 border-b border-emerald-200/40 flex-shrink-0 bg-white/60 backdrop-blur-sm">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm overflow-hidden bg-white p-1.5 ring-2 ring-emerald-700/15 group-hover:ring-emerald-600/30 transition-all">
              <img src={logoSrc} alt="GSHSMB" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-emerald-900 leading-tight">GSHSMB</h1>
              <p className="text-[10px] text-emerald-600/50 leading-tight tracking-wide font-medium">HMIS Portal</p>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden text-emerald-600/50 hover:text-emerald-800 transition-colors p-1 rounded-lg hover:bg-white/60">
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <div className="relative flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          <nav className="space-y-3">
            {sections.map((section) => {
              const visibleItems = section.items.filter(item => hasRole(...item.roles));
              if (visibleItems.length === 0) return null;
              return (
                <div key={section.label}>
                  <div className="flex items-center gap-2 px-3 mb-1">
                    <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${section.color}40, transparent)` }} />
                    <span className="text-[9px] uppercase tracking-[0.2em] font-semibold px-1" style={{ color: section.color }}>
                      {section.label}
                    </span>
                    <div className="h-px flex-1" style={{ background: `linear-gradient(to left, ${section.color}40, transparent)` }} />
                  </div>
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }: { isActive: boolean }) =>
                          `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                            isActive
                              ? 'text-white shadow-md shadow-emerald-900/15'
                              : 'text-emerald-800/80 hover:text-emerald-950'
                          }`
                        }
                      >
                        {({ isActive }: { isActive: boolean }) => (
                          <>
                            {isActive && (
                              <>
                                <span className={`absolute inset-0 rounded-xl bg-gradient-to-r ${item.bg}`} />
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-white/80" />
                              </>
                            )}
                            {!isActive && (
                              <span className="absolute inset-0 rounded-xl bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm" />
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
                            {item.badgeKey && badges[item.badgeKey] > 0 && (
                              <span className="relative z-10 ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none shadow-lg">
                                {badges[item.badgeKey] > 99 ? '99+' : badges[item.badgeKey]}
                              </span>
                            )}
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
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

      </aside>
    </>
  );
}
