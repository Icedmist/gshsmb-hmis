import { useState, useEffect, useCallback } from 'react';
import { DashboardStats } from '../types';
import {
  Building2, Building, Users, UserCheck, Calendar,
  UserCog, UserX, Stethoscope, Heart, Pill, FlaskConical, Briefcase, HeartHandshake, Sparkles, Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardStats } from '../lib/dashboard';
import { getDocsAll, countDocs } from '../lib/firestore';
import { useNavigate } from 'react-router-dom';
import AnimatedCounter from '../components/common/AnimatedCounter';

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-slate-100 rounded-3xl p-8 h-48 border border-slate-200/50" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-slate-100 rounded-3xl p-6 h-32 border border-slate-200/50" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [inactiveUsers, setInactiveUsers] = useState(0);

  const [workforce, setWorkforce] = useState({
    doctors: 0,
    nurses: 0,
    pharmacists: 0,
    labPersonnel: 0,
    adminStaff: 0,
    supportStaff: 0
  });

  const loadDashboardData = useCallback(async () => {
    try {
      const hospitalScope = user?.hospital_id || undefined;
      const s = await getDashboardStats(hospitalScope);
      if (s) setStats(s as DashboardStats);

      if (hasRole(
        'super_admin', 'executive_secretary', 'director_hr',
        'director_medical_services', 'director_nursing_services'
      )) {
        const results = await Promise.allSettled([
          countDocs('employees', [{ field: 'position', op: '==', value: 'Doctor' }]),
          countDocs('employees', [{ field: 'position', op: '==', value: 'Nurse' }]),
          countDocs('employees', [{ field: 'position', op: '==', value: 'Pharmacist' }]),
          countDocs('employees', [{ field: 'position', op: '==', value: 'Laboratory Personnel' }]),
          countDocs('employees', [{ field: 'position', op: '==', value: 'Administrative Staff' }]),
          countDocs('employees', [{ field: 'position', op: '==', value: 'Support Staff' }])
        ]);
        
        const [docs, nurs, pharms, labs, admins, supports] = results.map(r => r.status === 'fulfilled' ? (r.value as number) : 0);

        setWorkforce({
          doctors: docs,
          nurses: nurs,
          pharmacists: pharms,
          labPersonnel: labs,
          adminStaff: admins,
          supportStaff: supports
        });
      }

      if (hasRole('super_admin')) {
        try {
          const validRoles = [
            'super_admin', 'executive_secretary', 'hospital_admin', 'hr_officer', 'director_hr',
            'director_medical_services', 'director_nursing_services', 'director_prs',
            'director_pharmaceutical_services', 'director_laboratory_services', 'director_finance'
          ];
          const allDocs = await getDocsAll('users');
          const allUsers = allDocs.filter((u: any) => validRoles.includes(u.role));
          setTotalUsers(allUsers.length);
          setActiveUsers(allUsers.filter((u: any) => u.status === 'active').length);
          setInactiveUsers(allUsers.filter((u: any) => u.status === 'inactive').length);
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  }, [user, hasRole]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (hasRole(
      'super_admin', 'executive_secretary', 'hospital_admin', 'hr_officer', 'director_hr',
      'director_medical_services', 'director_nursing_services', 'director_prs',
      'director_pharmaceutical_services', 'director_laboratory_services'
    )) {
      loadDashboardData();
    } else {
      const dirRedirect: Record<string, string> = {
        director_finance: '/finance-dashboard',
      };
      for (const [role, path] of Object.entries(dirRedirect)) {
        if (hasRole(role as any)) {
          navigate(path, { replace: true });
          return;
        }
      }
      setLoading(false);
    }
  }, [hasRole, navigate, loadDashboardData]);

  if (loading) return <Skeleton />;

  const totalEmployees = stats?.total_employees || 0;
  const activeEmployees = stats?.active_employees || 0;
  const activePercent = totalEmployees > 0 ? Math.round((activeEmployees / totalEmployees) * 100) : 0;

  const isSuper = hasRole('super_admin');
  const isExecSec = hasRole('executive_secretary');
  const isHighLevel = isSuper || isExecSec || hasRole('director_hr', 'director_medical_services', 'director_nursing_services');

  const workforceData = [
    { label: 'Medical Doctors', value: workforce.doctors, icon: Stethoscope, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
    { label: 'Nurses', value: workforce.nurses, icon: Heart, color: 'from-rose-500 to-rose-600', shadow: 'shadow-rose-500/20' },
    { label: 'Pharmacists', value: workforce.pharmacists, icon: Pill, color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
    { label: 'Lab Personnel', value: workforce.labPersonnel, icon: FlaskConical, color: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/20' },
    { label: 'Admin Staff', value: workforce.adminStaff, icon: Briefcase, color: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/20' },
    { label: 'Support Staff', value: workforce.supportStaff, icon: HeartHandshake, color: 'from-slate-500 to-slate-600', shadow: 'shadow-slate-500/20' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10 text-white shadow-2xl transition-transform duration-500 hover:scale-[1.01]"
        style={{ background: 'linear-gradient(135deg, #022c22 0%, #064e3b 40%, #059669 100%)' }}>
        
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-400/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 mix-blend-screen pointer-events-none" />
        
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0H0v40' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")` }}
        />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-4">
              <Sparkles size={14} className="text-emerald-300" />
              <span className="text-xs font-semibold tracking-wider text-emerald-100 uppercase">
                {isSuper ? 'Administrator' : isExecSec ? 'Executive Secretary' : 'HR & Administration'}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
              Welcome back, {user?.full_name?.split(' ')[0] || 'User'}
            </h1>
            
            <p className="text-emerald-100/80 text-base md:text-lg max-w-xl font-medium leading-relaxed">
              {isSuper
                ? 'Here is a comprehensive overview of the entire health system operations and workforce.'
                : isExecSec
                ? 'Your executive summary of workforce distribution and systemic performance.'
                : 'Manage employee records, department distribution, and operational metrics.'}
            </p>
          </div>
          
          <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <Calendar size={24} className="text-emerald-200" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-2xl font-bold text-white tabular-nums tracking-tight">
                {currentTime.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
              <span className="text-sm font-medium text-emerald-200/80">
                {currentTime.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Core KPIs */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-800 px-2 flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100/50 text-emerald-600 rounded-lg shadow-sm border border-emerald-200/50">
            <Activity size={20} strokeWidth={2.5} />
          </div>
          Core System Metrics
        </h2>
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isSuper ? 'lg:grid-cols-4' : 'lg:grid-cols-4'} gap-4 md:gap-5`}>
          
          <div className="group bg-white rounded-2xl p-5 border border-emerald-100/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.1)] hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1 flex items-center gap-4 relative overflow-hidden cursor-pointer">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50/80 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-emerald-100/80 transition-colors duration-500" />
            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 relative z-10 shrink-0">
              <Building2 size={24} strokeWidth={2.5} />
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-500 mb-0.5 group-hover:text-emerald-700 transition-colors truncate">Total Hospitals</p>
              <AnimatedCounter value={stats?.total_hospitals || 0} className="text-2xl font-black text-slate-800 tabular-nums tracking-tight group-hover:text-emerald-900 transition-colors block" />
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-5 border border-emerald-100/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.1)] hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1 flex items-center gap-4 relative overflow-hidden cursor-pointer">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50/80 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-emerald-100/80 transition-colors duration-500" />
            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 relative z-10 shrink-0">
              <Building size={24} strokeWidth={2.5} />
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-500 mb-0.5 group-hover:text-emerald-700 transition-colors truncate">Total Departments</p>
              <AnimatedCounter value={stats?.total_departments || 0} className="text-2xl font-black text-slate-800 tabular-nums tracking-tight group-hover:text-emerald-900 transition-colors block" />
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-5 border border-emerald-100/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.1)] hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1 flex items-center gap-4 relative overflow-hidden cursor-pointer">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50/80 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-emerald-100/80 transition-colors duration-500" />
            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 relative z-10 shrink-0">
              <Users size={24} strokeWidth={2.5} />
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-500 mb-0.5 group-hover:text-emerald-700 transition-colors truncate">Total Employees</p>
              <AnimatedCounter value={totalEmployees} className="text-2xl font-black text-slate-800 tabular-nums tracking-tight group-hover:text-emerald-900 transition-colors block" />
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-5 border border-emerald-100/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.1)] hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1 flex items-center gap-4 relative overflow-hidden cursor-pointer">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50/80 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-emerald-100/80 transition-colors duration-500" />
            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 relative z-10 shrink-0">
              <UserCheck size={24} strokeWidth={2.5} />
            </div>
            <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-center">
              <p className="text-xs font-bold text-slate-500 mb-0.5 group-hover:text-emerald-700 transition-colors truncate">Active Employees</p>
              <div className="flex items-end gap-2">
                <AnimatedCounter value={activeEmployees} className="text-2xl font-black text-slate-800 tabular-nums tracking-tight group-hover:text-emerald-900 transition-colors block" />
                <span className="text-[10px] font-bold text-emerald-600 mb-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{activePercent}% active</span>
              </div>
            </div>
          </div>

          {isSuper && (
            <>
              <div className="group bg-white rounded-2xl p-5 border border-emerald-100/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.1)] hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1 flex items-center gap-4 relative overflow-hidden cursor-pointer">
                <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50/80 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-emerald-100/80 transition-colors duration-500" />
                <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 relative z-10 shrink-0">
                  <UserCog size={24} strokeWidth={2.5} />
                </div>
                <div className="relative z-10 flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-500 mb-0.5 group-hover:text-emerald-700 transition-colors truncate">Total System Users</p>
                  <AnimatedCounter value={totalUsers} className="text-2xl font-black text-slate-800 tabular-nums tracking-tight group-hover:text-emerald-900 transition-colors block" />
                </div>
              </div>

              <div className="group bg-white rounded-2xl p-5 border border-emerald-100/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.1)] hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1 flex items-center gap-4 relative overflow-hidden cursor-pointer">
                <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50/80 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-emerald-100/80 transition-colors duration-500" />
                <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 relative z-10 shrink-0">
                  <UserCheck size={24} strokeWidth={2.5} />
                </div>
                <div className="relative z-10 flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-500 mb-0.5 group-hover:text-emerald-700 transition-colors truncate">Active Users</p>
                  <AnimatedCounter value={activeUsers} className="text-2xl font-black text-slate-800 tabular-nums tracking-tight group-hover:text-emerald-900 transition-colors block" />
                </div>
              </div>

              <div className="group bg-white rounded-2xl p-5 border border-emerald-100/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.1)] hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1 flex items-center gap-4 relative overflow-hidden cursor-pointer">
                <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50/80 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-emerald-100/80 transition-colors duration-500" />
                <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 relative z-10 shrink-0">
                  <UserX size={24} strokeWidth={2.5} />
                </div>
                <div className="relative z-10 flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-500 mb-0.5 group-hover:text-emerald-700 transition-colors truncate">Inactive Users</p>
                  <AnimatedCounter value={inactiveUsers} className="text-2xl font-black text-slate-800 tabular-nums tracking-tight group-hover:text-emerald-900 transition-colors block" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Workforce Breakdown - Premium Design */}
      {isHighLevel && (
        <div className="mt-8 bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-900 rounded-3xl border border-emerald-700 shadow-[0_8px_30px_rgba(4,47,31,0.2)] hover:shadow-[0_20px_60px_rgba(4,47,31,0.3)] hover:-translate-y-1 transition-all duration-500 overflow-hidden animate-fade-in group/card relative" style={{ animationDelay: '150ms' }}>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none mix-blend-overlay" />
          
          <div className="p-6 md:p-8 border-b border-emerald-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2 tracking-tight drop-shadow-md">
                <div className="p-2.5 bg-white/10 backdrop-blur-sm text-emerald-100 rounded-xl group-hover/card:bg-white/20 group-hover/card:text-white group-hover/card:scale-110 group-hover/card:rotate-3 transition-all duration-500 shadow-sm border border-white/10">
                  <Users size={20} strokeWidth={2.5} />
                </div>
                Workforce Distribution
              </h2>
              <p className="text-sm font-medium text-emerald-100/70 mt-2">Comprehensive breakdown of healthcare professionals and personnel across the network.</p>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl hover:border-white/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4 cursor-pointer group/total">
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider group-hover/total:text-white transition-colors">Total Personnel</span>
                <AnimatedCounter value={totalEmployees} className="text-2xl font-black text-white tabular-nums leading-none drop-shadow-sm" />
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-950/40 flex items-center justify-center border border-emerald-500/30 shadow-inner group-hover/total:scale-110 transition-transform duration-300">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.8)]"></span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 md:p-8 relative z-10 bg-black/10">
            {workforceData.map((item, index) => {
              const percentage = totalEmployees > 0 ? ((item.value / totalEmployees) * 100).toFixed(1) : '0.0';
              return (
                <div key={item.label} 
                  className="p-6 md:p-7 rounded-[24px] border border-white/80 bg-white/95 backdrop-blur-xl shadow-xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:border-emerald-300 hover:-translate-y-1.5 group transition-all duration-500 cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className="relative z-10 flex items-center gap-4 mb-6">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg ${item.shadow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ring-4 ring-white`}>
                      <item.icon size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 group-hover:text-emerald-900 transition-colors tracking-tight">{item.label}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-[11px] font-bold text-slate-600 border border-slate-200 group-hover:bg-emerald-100 group-hover:text-emerald-800 group-hover:border-emerald-300 transition-colors shadow-sm">
                          {percentage}%
                        </span>
                        <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 transition-colors">of workforce</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative z-10 flex items-end justify-between gap-6">
                    <AnimatedCounter 
                      value={item.value} 
                      className="text-5xl font-black text-slate-800 tabular-nums tracking-tight group-hover:text-emerald-900 group-hover:scale-105 origin-left transition-all duration-300 block" 
                    />
                    <div className="flex-1 mb-2">
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner relative border border-slate-200/50">
                        <div 
                          className={`absolute top-0 left-0 h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000 ease-out group-hover:brightness-110 shadow-sm`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
