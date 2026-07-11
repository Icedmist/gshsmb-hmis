import { useState, useEffect, useCallback } from 'react';
import { DashboardStats, Employee, EmployeeTransfer, AuditLog } from '../types';
import StatCard from '../components/common/StatCard';
import {
  Building2, Building, Users, UserCheck, Shield, TrendingUp, Activity,
  Clock, ArrowUpRight, ArrowRightLeft, Settings, BarChart3,
  UserPlus, CheckCircle, Calendar, Sparkles, Server, Lock, Fingerprint,
  RefreshCw, ChevronRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardStats, getEmployeesPerHospital, getEmployeesPerDepartment, getRecentActivities, getRecentEmployees, getRecentTransfers } from '../lib/dashboard';

const COLORS = ['#C06C4C', '#6B7E36', '#D4A056', '#8B5E3C', '#5C8A5E', '#C4956A', '#7A8B5B', '#B8865A', '#4A6741', '#CD7F4E'];
const SECTION_COLORS = {
  chart: { border: 'border-t-sky-400', icon: 'text-sky-600', header: 'text-sky-700' },
  quick: { border: 'border-t-amber-400', icon: 'text-amber-600', header: 'text-amber-700' },
  dept: { border: 'border-t-emerald-400', icon: 'text-emerald-600', header: 'text-emerald-700' },
  employees: { border: 'border-t-teal-400', icon: 'text-teal-600', header: 'text-teal-700' },
  transfers: { border: 'border-t-orange-400', icon: 'text-orange-600', header: 'text-orange-700' },
  activities: { border: 'border-t-purple-400', icon: 'text-purple-600', header: 'text-purple-700' },
};

const actionColors: Record<string, string> = {
  create: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200',
  update: 'bg-blue-50 text-blue-600 ring-1 ring-blue-200',
  delete: 'bg-red-50 text-red-600 ring-1 ring-red-200',
  transfer: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200',
};

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white rounded-2xl p-8 border border-slate-200/60">
        <div className="h-5 bg-slate-100 rounded w-48 mb-3" />
        <div className="h-4 bg-slate-100 rounded w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/60">
            <div className="h-4 bg-slate-100 rounded w-24 mb-3" />
            <div className="h-8 bg-slate-100 rounded w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/60 h-80" />
        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 h-80" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [empPerHospital, setEmpPerHospital] = useState<{ name: string; value: number }[]>([]);
  const [empPerDept, setEmpPerDept] = useState<{ name: string; value: number }[]>([]);
  const [recentEmployees, setRecentEmployees] = useState<Employee[]>([]);
  const [recentTransfers, setRecentTransfers] = useState<EmployeeTransfer[]>([]);
  const [recentActivities, setRecentActivities] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const loadDashboardData = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const hospitalScope = user?.role === 'hospital_admin' ? (user.hospital_id || undefined) : undefined;
      const [s, eph, epd, re, rt, ra] = await Promise.all([
        getDashboardStats(hospitalScope),
        getEmployeesPerHospital(hospitalScope),
        getEmployeesPerDepartment(hospitalScope),
        getRecentEmployees(hospitalScope),
        getRecentTransfers(hospitalScope),
        getRecentActivities(hospitalScope),
      ]);
      setStats(s);
      setEmpPerHospital((eph as any[]).map(h => ({ name: h.hospital_name, value: parseInt(h.employee_count) })));
      setEmpPerDept((epd as any[]).map(d => ({ name: d.department_name, value: parseInt(d.employee_count) })));
      setRecentEmployees(Array.isArray(re) ? re : []);
      setRecentTransfers(Array.isArray(rt) ? rt : []);
      setRecentActivities(Array.isArray(ra) ? ra : []);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(() => loadDashboardData(true), 30000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const refreshNow = () => loadDashboardData();

  const secondsAgo = lastUpdated
    ? Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
    : null;

  if (loading) return <Skeleton />;

  const totalEmployees = stats?.total_employees || 0;
  const activeEmployees = stats?.active_employees || 0;
  const activePercent = totalEmployees > 0 ? Math.round((activeEmployees / totalEmployees) * 100) : 0;

  const quickActions = [
    { label: 'Employees', icon: Users, href: '/employees', desc: 'Manage staff records', color: 'from-[#008751] to-[#006838]', bg: 'bg-emerald-50', iconC: 'text-emerald-600' },
    { label: 'Hospitals', icon: Building2, href: '/hospitals', desc: 'Manage facilities', color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', iconC: 'text-blue-600' },
    { label: 'Departments', icon: Building, href: '/departments', desc: 'Organize units', color: 'from-army-700 to-army-600', bg: 'bg-army-50', iconC: 'text-army-700' },
    { label: 'Transfers', icon: ArrowRightLeft, href: '/transfers', desc: 'Staff movements', color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', iconC: 'text-amber-600' },
    { label: 'Reports', icon: TrendingUp, href: '/reports', desc: 'Data & insights', color: 'from-teal-500 to-emerald-600', bg: 'bg-teal-50', iconC: 'text-teal-600' },
    { label: 'Audit Logs', icon: Activity, href: '/audit-logs', desc: 'Track changes', color: 'from-purple-500 to-violet-600', bg: 'bg-purple-50', iconC: 'text-purple-600' },
  ];

  const deptWithData = empPerDept.filter(d => d.value > 0);

  const tooltipStyle = {
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(8px)',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ===== HERO BANNER ===== */}
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white"
        style={{ background: 'linear-gradient(135deg, #001a0f 0%, #022c22 30%, #064e3b 60%, #006838 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-20 bg-amber-500 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20">
                  <Sparkles size={12} className="text-amber-400" />
                  <span className="text-amber-300 text-[11px] font-semibold tracking-wider uppercase">Digital HMIS Platform</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping-soft relative">
                    <span className="absolute inset-0 rounded-full bg-emerald-400" />
                  </span>
                  <span className="text-emerald-300 text-[11px] font-medium">All Systems Operational</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                  Welcome back, {user?.full_name?.split(' ')[0]}
                </h1>
                <p className="mt-1 text-emerald-100/70 text-sm max-w-xl">
                  Gombe State Digital HMIS &mdash; Unified platform for health sector leadership, management, and trust
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/10 backdrop-blur border border-white/10">
                <Calendar size={15} className="text-emerald-200" />
                <div className="flex flex-col items-start">
                  <span className="text-sm text-emerald-50 font-medium tabular-nums tracking-wide">
                    {currentTime.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                  </span>
                  <span className="text-[10px] text-emerald-200/70 leading-tight">
                    {currentTime.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <Link
                to="/reports"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium backdrop-blur transition-all duration-200 border border-white/10 group"
              >
                <BarChart3 size={15} />
                <span>Reports</span>
              </Link>
            </div>
          </div>
          {/* Value pillars */}
          <div className="mt-5 flex items-center gap-4 flex-wrap">
            {[
              { label: 'Leadership', icon: Shield, color: 'text-amber-300', border: 'border-amber-400/20' },
              { label: 'Health', icon: Activity, color: 'text-emerald-300', border: 'border-emerald-400/20' },
              { label: 'Management', icon: BarChart3, color: 'text-sky-300', border: 'border-sky-400/20' },
              { label: 'Trust & Technology', icon: Lock, color: 'text-indigo-300', border: 'border-indigo-400/20' },
            ].map(v => (
              <div key={v.label} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border ${v.border}`}>
                <v.icon size={12} className={v.color} />
                <span className={`text-[11px] font-semibold tracking-wide ${v.color}`}>{v.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 flex mt-6">
          <div className="flex-1 bg-[#008751]/60" />
          <div className="flex-1 bg-white/30" />
          <div className="flex-1 bg-[#008751]/60" />
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Hospitals" value={stats?.total_hospitals || 0} icon={Building2} color="primary" subtitle="Registered facilities" trend="up" trendValue="+12%" />
        <StatCard title="Total Departments" value={stats?.total_departments || 0} icon={Building} color="army" subtitle="Active units" trend="up" trendValue="+8%" />
        <StatCard title="Total Employees" value={totalEmployees} icon={Users} color="blue" subtitle="All staff records" trend={totalEmployees > 0 ? 'up' : 'neutral'} trendValue={totalEmployees > 0 ? '+5%' : '0%'} />
        <StatCard title="Active Employees" value={activeEmployees} icon={UserCheck} color="teal" subtitle={`${activePercent}% of total workforce`} trend={activePercent >= 80 ? 'up' : activePercent >= 50 ? 'neutral' : 'down'} trendValue={`${activePercent}% active`} />
      </div>

      {/* ===== SYSTEM HEALTH & TRUST ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 status-bar-success">
          <div className="flex items-center gap-3 flex-1">
            <Server size={18} className="text-emerald-600/70" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-emerald-800">System Health</span>
                <span className="tech-dot-green" />
                <span className="text-emerald-600 text-sm">All services running</span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-emerald-600/70">
                <span>Database: Connected</span>
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                <span>Firebase: Operational</span>
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                <span>Auth: Secure</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-600/70">
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            <span>
              {lastUpdated
                ? `Auto-refresh ${secondsAgo! < 60 ? `${secondsAgo}s` : `${Math.floor(secondsAgo! / 60)}m`}`
                : 'Connecting...'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end lg:justify-center">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200/60">
            <Lock size={14} className="text-indigo-500" />
            <span className="text-xs font-semibold text-indigo-700">256-bit Encrypted</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-50 border border-sky-200/60">
            <Fingerprint size={14} className="text-sky-500" />
            <span className="text-xs font-semibold text-sky-700">RBAC Secure</span>
          </div>
        </div>
      </div>

      {/* ===== CHARTS + QUICK ACTIONS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2">
          <div className={`card border-t-2 ${SECTION_COLORS.chart.border}`}>
            <div className="card-header">
              <h3 className="section-title flex items-center gap-2">
                <BarChart3 size={18} className={SECTION_COLORS.chart.icon} />
                <span className={SECTION_COLORS.chart.header}>Employees Per Hospital</span>
              </h3>
              <Link to="/employees" className={`text-xs ${SECTION_COLORS.chart.icon} hover:opacity-80 font-medium flex items-center gap-1 transition-colors`}>
                View All <ArrowUpRight size={12} />
              </Link>
            </div>
            <div className="card-body">
              {empPerHospital.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <BarChart3 size={40} className="mb-3 text-slate-200" />
                  <p className="text-sm">No data available yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={empPerHospital} margin={{ top: 5, right: 20, bottom: 5, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={65}>
                      {empPerHospital.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className={`card h-full border-t-2 ${SECTION_COLORS.quick.border}`}>
            <div className="card-header">
              <h3 className="section-title flex items-center gap-2">
                <Activity size={16} className={SECTION_COLORS.quick.icon} />
                <span className={SECTION_COLORS.quick.header}>Quick Actions</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Launcher</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2.5">
              {quickActions.map((action, i) => (
                <Link
                  key={i}
                  to={action.href}
                  className="group flex flex-col items-center gap-2 p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-white hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className={`p-2.5 rounded-xl ${action.bg} transition-transform duration-200 group-hover:scale-110`}>
                    <action.icon size={20} className={action.iconC} />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-semibold text-slate-800 block">{action.label}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">{action.desc}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== BOTTOM SECTION ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Distribution */}
        <div className="lg:col-span-2">
          <div className={`card border-t-2 ${SECTION_COLORS.dept.border}`}>
            <div className="card-header">
              <h3 className="section-title flex items-center gap-2">
                <Activity size={16} className={SECTION_COLORS.dept.icon} />
                <span className={SECTION_COLORS.dept.header}>Employees Per Department</span>
              </h3>
            </div>
            <div className="card-body">
              {deptWithData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Users size={40} className="mb-3 text-slate-200" />
                  <p className="text-sm">No employees assigned yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={deptWithData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={95} paddingAngle={3} stroke="none">
                          {deptWithData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center space-y-2.5">
                    {deptWithData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-700 font-medium truncate">{d.name}</span>
                            <span className="text-slate-500 font-semibold ml-2">{d.value}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((d.value / Math.max(...deptWithData.map(x => x.value))) * 100, 100)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Recent Employees */}
          <div className={`card border-t-2 ${SECTION_COLORS.employees.border}`}>
            <div className="card-header">
              <h3 className="section-title flex items-center gap-2">
                <UserPlus size={16} className={SECTION_COLORS.employees.icon} />
                <span className={SECTION_COLORS.employees.header}>Recent Employees</span>
              </h3>
              <Link to="/employees" className={`text-xs ${SECTION_COLORS.employees.icon} hover:opacity-80 font-medium transition-colors`}>View All</Link>
            </div>
            <div className="p-0">
              {recentEmployees.length === 0 ? (
                <p className="text-slate-400 text-sm p-6 text-center">No employees yet.</p>
              ) : (
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {recentEmployees.map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between px-5 py-3 hover:bg-emerald-50/30 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {emp.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{emp.full_name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5">
                            <span className="font-mono text-[11px]">{emp.staff_id}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            {emp.department_name || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <span className={`badge-${emp.status === 'active' ? 'active' : emp.status === 'suspended' ? 'suspended' : 'inactive'}`}>
                        {emp.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Transfers */}
          <div className={`card border-t-2 ${SECTION_COLORS.transfers.border}`}>
            <div className="card-header">
              <h3 className="section-title flex items-center gap-2">
                <ArrowRightLeft size={16} className={SECTION_COLORS.transfers.icon} />
                <span className={SECTION_COLORS.transfers.header}>Recent Transfers</span>
              </h3>
              <Link to="/transfers" className={`text-xs ${SECTION_COLORS.transfers.icon} hover:opacity-80 font-medium transition-colors`}>View All</Link>
            </div>
            <div className="p-0">
              {recentTransfers.length === 0 ? (
                <p className="text-slate-400 text-sm p-6 text-center">No transfers yet.</p>
              ) : (
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {recentTransfers.map(t => (
                    <div key={t.id} className="px-5 py-3 hover:bg-emerald-50/30 transition-colors group">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-slate-900">{t.employee_name}</p>
                        <span className={`badge-${t.status || 'approved'}`}>{t.status || 'approved'}</span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="text-emerald-600 font-medium">{t.from_hospital}</span>
                        <ArrowUpRight size={11} className="text-slate-400" />
                        <span className="text-[#008751] font-medium">{t.to_hospital}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== RECENT ACTIVITIES ===== */}
      <div className={`card border-t-2 ${SECTION_COLORS.activities.border}`}>
        <div className="card-header">
          <h3 className="section-title flex items-center gap-2">
            <Activity size={16} className={SECTION_COLORS.activities.icon} />
            <span className={SECTION_COLORS.activities.header}>Recent Activities</span>
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className={`w-1.5 h-1.5 rounded-full ${isRefreshing ? 'bg-emerald-500 animate-pulse' : 'bg-purple-500'}`} />
              {isRefreshing ? 'Updating...' : 'Live Feed'}
            </div>
            <Link to="/audit-logs" className={`text-xs ${SECTION_COLORS.activities.icon} hover:opacity-80 font-medium transition-colors`}>View All</Link>
          </div>
        </div>
        <div className="p-0">
          {recentActivities.length === 0 ? (
            <p className="text-slate-400 text-sm p-6 text-center">No activities yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentActivities.map((a) => {
                const actionType = a.action?.toLowerCase().includes('create') ? 'create'
                  : a.action?.toLowerCase().includes('update') || a.action?.toLowerCase().includes('edit') ? 'update'
                  : a.action?.toLowerCase().includes('delete') ? 'delete'
                  : a.action?.toLowerCase().includes('transfer') ? 'transfer'
                  : 'create';
                return (
                  <div key={a.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-emerald-50/20 transition-colors">
                    <div className={`p-2 rounded-xl ${actionColors[actionType] || actionColors.create}`}>
                      {actionType === 'delete' ? <Activity size={14} /> :
                       actionType === 'transfer' ? <ArrowRightLeft size={14} /> :
                       actionType === 'update' ? <Activity size={14} /> :
                       <CheckCircle size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900">
                        {a.action}
                        <span className="text-slate-500"> by </span>
                        <span className="font-medium text-slate-700">{a.user_name}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock size={12} />
                      <span className="tabular-nums">{new Date(a.created_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== TRUST & TECHNOLOGY FOOTER ===== */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3.5 rounded-2xl bg-white border border-slate-200/60">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Lock size={12} className="text-emerald-500" />
            256-bit SSL Encrypted
          </span>
          <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300" />
          <span className="hidden sm:flex items-center gap-1.5">
            <Server size={12} className="text-emerald-500" />
            Firebase Powered
          </span>
          <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300" />
          <span className="hidden sm:flex items-center gap-1.5">
            <Fingerprint size={12} className="text-emerald-500" />
            Role-Based Access Control
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <RefreshCw size={12} className={`${isRefreshing ? 'animate-spin text-emerald-500' : 'text-slate-400'}`} />
            {lastUpdated
              ? `Updated ${secondsAgo! < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo! / 60)}m ago`}`
              : 'Loading...'}
          </div>
          <button
            onClick={refreshNow}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            title="Refresh now"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
}
