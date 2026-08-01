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

      if (hasRole('super_admin', 'executive_secretary')) {
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
          const allUsers = await getDocsAll('users');
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
    if (hasRole('super_admin', 'executive_secretary', 'hospital_admin', 'hr_officer', 'director_hr')) {
      loadDashboardData();
    } else {
      const dirRedirect: Record<string, string> = {
        director_medical_services: '/medical-dashboard',
        director_nursing_services: '/nursing-dashboard',
        director_pharmaceutical_services: '/pharmaceutical-dashboard',
        director_laboratory_services: '/laboratory-dashboard',
        director_prs: '/prs-dashboard',
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
  const isHighLevel = isSuper || isExecSec;

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
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-800 px-1 flex items-center gap-2">
          <Activity size={20} className="text-emerald-600" /> Core System Metrics
        </h2>
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isSuper ? 'lg:grid-cols-7' : 'lg:grid-cols-4'} gap-5`}>
          
          <div className="group relative overflow-hidden bg-white rounded-3xl p-6 border border-slate-200/60 shadow-[0_8px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-100 transition-colors" />
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                  <Building2 size={24} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Hospitals</p>
                <h3 className="text-3xl font-bold text-slate-800 tabular-nums">{stats?.total_hospitals || 0}</h3>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white rounded-3xl p-6 border border-slate-200/60 shadow-[0_8px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-100 transition-colors" />
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                  <Building size={24} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Departments</p>
                <h3 className="text-3xl font-bold text-slate-800 tabular-nums">{stats?.total_departments || 0}</h3>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white rounded-3xl p-6 border border-slate-200/60 shadow-[0_8px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 group-hover:bg-sky-100 transition-colors" />
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-100 group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                  <Users size={24} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Employees</p>
                <h3 className="text-3xl font-bold text-slate-800 tabular-nums">{totalEmployees}</h3>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white rounded-3xl p-6 border border-slate-200/60 shadow-[0_8px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 group-hover:bg-teal-100 transition-colors" />
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-2xl bg-teal-50 text-teal-600 ring-1 ring-teal-100 group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-white transition-all duration-300">
                  <UserCheck size={24} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Active Employees</p>
                <div className="flex items-end gap-3">
                  <h3 className="text-3xl font-bold text-slate-800 tabular-nums">{activeEmployees}</h3>
                  <span className="text-sm font-semibold text-teal-600 mb-1 bg-teal-50 px-2 py-0.5 rounded-lg">{activePercent}% active</span>
                </div>
              </div>
            </div>
          </div>

          {isSuper && (
            <>
              <div className="group relative overflow-hidden bg-white rounded-3xl p-6 border border-slate-200/60 shadow-[0_8px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-100 transition-colors" />
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 ring-1 ring-purple-100 w-fit group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all">
                    <UserCog size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Total System Users</p>
                    <h3 className="text-3xl font-bold text-slate-800 tabular-nums">{totalUsers}</h3>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden bg-white rounded-3xl p-6 border border-slate-200/60 shadow-[0_8px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-100 transition-colors" />
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 w-fit group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Active Users</p>
                    <h3 className="text-3xl font-bold text-slate-800 tabular-nums">{activeUsers}</h3>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden bg-white rounded-3xl p-6 border border-slate-200/60 shadow-[0_8px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 group-hover:bg-rose-100 transition-colors" />
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100 w-fit group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all">
                    <UserX size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Inactive Users</p>
                    <h3 className="text-3xl font-bold text-slate-800 tabular-nums">{inactiveUsers}</h3>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Workforce Breakdown - Premium Design */}
      {isHighLevel && (
        <div className="space-y-4 pt-4 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
              <Users size={22} className="text-emerald-600" /> 
              Workforce Distribution by Role
            </h2>
            <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
              {totalEmployees} Total Staff
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {workforceData.map((item, index) => {
              const percentage = totalEmployees > 0 ? ((item.value / totalEmployees) * 100).toFixed(1) : '0.0';
              return (
                <div key={item.label} 
                  className="relative group bg-white rounded-3xl p-6 border border-slate-200/60 shadow-[0_8px_24px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all duration-300 overflow-hidden"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${item.color} opacity-80`} />
                  
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg ${item.shadow} group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon size={20} strokeWidth={2.5} />
                      </div>
                      <h3 className="text-base font-bold text-slate-700">{item.label}</h3>
                    </div>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-400 mb-1">Total Count</p>
                      <p className="text-4xl font-black text-slate-800 tabular-nums tracking-tight">
                        {item.value}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 mb-1">
                        <span className="text-sm font-bold text-slate-600">{percentage}%</span>
                      </div>
                      <p className="text-xs font-medium text-slate-400">of workforce</p>
                    </div>
                  </div>

                  <div className="mt-5 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${percentage}%` }}
                    />
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
