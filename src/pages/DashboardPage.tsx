import { useState, useEffect, useCallback } from 'react';
import { DashboardStats, Employee, EmployeeTransfer, AuditLog, ROLE_LABELS } from '../types';
import StatCard from '../components/common/StatCard';
import {
  Building2, Building, Users, UserCheck, Shield, TrendingUp, Activity,
  Clock, ArrowUpRight, ArrowRightLeft, BarChart3,
  UserPlus, CheckCircle, Calendar, Sparkles, Server, Lock, Fingerprint,
  RefreshCw, Stethoscope, Heart, Target, Award, BookOpen, FileText, GraduationCap,
  UserCog, UserX, FlaskConical, LogIn, AlertTriangle, XCircle,
  Database, HardDrive, ShieldAlert, Pill, ClipboardCheck, Syringe, Wrench, Microscope,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardStats, getEmployeesPerHospital, getEmployeesPerDepartment, getRecentActivities, getRecentEmployees, getRecentTransfers } from '../lib/dashboard';
import { getDocsAll, countDocs, type FilterConstraint } from '../lib/firestore';

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
  const { user, hasRole } = useAuth();
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

  // Phase 2 executive data
  const [hospitalRankings, setHospitalRankings] = useState<any[]>([]);
  const [kpiSummary, setKpiSummary] = useState({ total: 0, achieved: 0, rate: 0 });
  const [clinicalAuditCount, setClinicalAuditCount] = useState(0);
  const [nursingAuditCount, setNursingAuditCount] = useState(0);
  const [researchCount, setResearchCount] = useState(0);

  // Super Admin data
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [inactiveUsers, setInactiveUsers] = useState(0);
  const [usersByRole, setUsersByRole] = useState<{ role: string; count: number; label: string }[]>([]);
  const [doctorCount, setDoctorCount] = useState(0);
  const [nurseCount, setNurseCount] = useState(0);
  const [pharmacistCount, setPharmacistCount] = useState(0);
  const [labCount, setLabCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [activeHospitals, setActiveHospitals] = useState(0);
  const [inactiveHospitals, setInactiveHospitals] = useState(0);
  const [clinicalGuidelineCount, setClinicalGuidelineCount] = useState(0);
  const [specialistCount, setSpecialistCount] = useState(0);
  const [trainingProgramCount, setTrainingProgramCount] = useState(0);
  const [generatedReportCount, setGeneratedReportCount] = useState(0);

  // Phase 3 counts
  const [medicineCount, setMedicineCount] = useState(0);
  const [essentialMedicineCount, setEssentialMedicineCount] = useState(0);
  const [pharmaAuditCount, setPharmaAuditCount] = useState(0);
  const [pharmaWorkforceCount, setPharmaWorkforceCount] = useState(0);
  const [pharmaVigilanceCount, setPharmaVigilanceCount] = useState(0);
  const [pharmaQualityCount, setPharmaQualityCount] = useState(0);
  const [laboratoryCount, setLaboratoryCount] = useState(0);
  const [labAuditCount, setLabAuditCount] = useState(0);
  const [labWorkforceCount, setLabWorkforceCount] = useState(0);
  const [equipmentCount, setEquipmentCount] = useState(0);
  const [reagentCount, setReagentCount] = useState(0);
  const [surveillanceCount, setSurveillanceCount] = useState(0);

  const loadDashboardData = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const hospitalScope = user?.role === 'hospital_admin' ? (user.hospital_id || undefined) : undefined;
      const results = await Promise.allSettled([
        getDashboardStats(hospitalScope),
        getEmployeesPerHospital(hospitalScope),
        getEmployeesPerDepartment(hospitalScope),
        getRecentEmployees(hospitalScope),
        getRecentTransfers(hospitalScope),
        getRecentActivities(hospitalScope),
        getDocsAll('hospitals', [{ field: 'status', op: '==', value: 'active' }], { field: 'hospital_name', dir: 'asc' }),
        getDocsAll('kpis', [{ field: 'status', op: '==', value: 'active' }]),
        getDocsAll('clinicalAudits', [{ field: 'status', op: '==', value: 'active' }]),
        getDocsAll('nursingAudits', [{ field: 'status', op: '==', value: 'active' }]),
        getDocsAll('researchProjects', [{ field: 'status', op: '==', value: 'active' }]),
        getDocsAll('hospitalScorecards'),
      ]);
      const [s, eph, epd, re, rt, ra, hospitals, kpis, clinicalAudits, nursingAudits, research, scorecards] = results.map(r => r.status === 'fulfilled' ? r.value : undefined);
      if (s) setStats(s as DashboardStats);
      if (eph) setEmpPerHospital((eph as any[]).map(h => ({ name: h.hospital_name, value: parseInt(h.employee_count) })));
      if (epd) setEmpPerDept((epd as any[]).map(d => ({ name: d.department_name, value: parseInt(d.employee_count) })));
      if (re) setRecentEmployees(Array.isArray(re) ? re : []);
      if (rt) setRecentTransfers(Array.isArray(rt) ? rt : []);
      if (ra) setRecentActivities(Array.isArray(ra) ? ra : []);

      if (hospitals && Array.isArray(hospitals)) {
        const ranked = await Promise.all(
          hospitals.map(async (h: any) => {
            const empCount = await countDocs('employees', [{ field: 'hospital_id', op: '==', value: h.id } as FilterConstraint]);
            return { id: h.id, name: h.hospital_name, code: h.hospital_code, employee_count: empCount };
          })
        );
        setHospitalRankings(ranked.sort((a: any, b: any) => b.employee_count - a.employee_count));
      }

      if (kpis && Array.isArray(kpis)) {
        const total = kpis.length;
        const achieved = kpis.filter((k: any) => k.actual_value >= k.target).length;
        setKpiSummary({ total, achieved, rate: total > 0 ? Math.round((achieved / total) * 100) : 0 });
      }
      if (clinicalAudits && Array.isArray(clinicalAudits)) setClinicalAuditCount(clinicalAudits.length);
      if (nursingAudits && Array.isArray(nursingAudits)) setNursingAuditCount(nursingAudits.length);
      if (research && Array.isArray(research)) setResearchCount(research.length);

      // Shared data for super_admin & executive_secretary
      if (hasRole('super_admin', 'executive_secretary')) {
        const [doc, nur, pharm, lab, admin] = await Promise.all([
          countDocs('employees', [{ field: 'position', op: '==', value: 'Doctor' }]),
          countDocs('employees', [{ field: 'position', op: '==', value: 'Nurse' }]),
          countDocs('employees', [{ field: 'position', op: '==', value: 'Pharmacist' }]),
          countDocs('employees', [{ field: 'position', op: '==', value: 'Laboratory Personnel' }]),
          countDocs('employees', [{ field: 'position', op: '==', value: 'Administrative Staff' }]),
        ]);
        setDoctorCount(doc);
        setNurseCount(nur);
        setPharmacistCount(pharm);
        setLabCount(lab);
        setAdminCount(admin);

        const [actHosp, inactHosp, guidelines, specialists, trainings, reports] = await Promise.all([
          countDocs('hospitals', [{ field: 'status', op: '==', value: 'active' }]),
          countDocs('hospitals', [{ field: 'status', op: '==', value: 'inactive' }]),
          getDocsAll('clinicalGuidelines'),
          getDocsAll('specialists'),
          getDocsAll('trainingPrograms'),
          getDocsAll('generatedReports'),
        ]);
        setActiveHospitals(actHosp);
        setInactiveHospitals(inactHosp);
        setClinicalGuidelineCount(guidelines.length);
        setSpecialistCount(specialists.length);
        setTrainingProgramCount(trainings.length);
        setGeneratedReportCount(reports.length);
      }

      // Phase 3 shared data for super_admin & executive_secretary
      if (hasRole('super_admin', 'executive_secretary')) {
        const [med, essMed, phAud, phWf, phVig, phQa, labs, labAud, labWf, equip, reag, surv] = await Promise.all([
          getDocsAll('medicines'),
          getDocsAll('essentialMedicines'),
          getDocsAll('pharmaceuticalAudits'),
          getDocsAll('pharmaceuticalWorkforce'),
          getDocsAll('pharmacovigilanceReports'),
          getDocsAll('pharmaceuticalQualityReports'),
          getDocsAll('laboratories'),
          getDocsAll('laboratoryAudits'),
          getDocsAll('laboratoryWorkforce'),
          getDocsAll('laboratoryEquipment'),
          getDocsAll('laboratoryReagents'),
          getDocsAll('diseaseSurveillanceReports'),
        ]);
        setMedicineCount(med.length);
        setEssentialMedicineCount(essMed.length);
        setPharmaAuditCount(phAud.length);
        setPharmaWorkforceCount(phWf.length);
        setPharmaVigilanceCount(phVig.length);
        setPharmaQualityCount(phQa.length);
        setLaboratoryCount(labs.length);
        setLabAuditCount(labAud.length);
        setLabWorkforceCount(labWf.length);
        setEquipmentCount(equip.length);
        setReagentCount(reag.length);
        setSurveillanceCount(surv.length);
      }

      // Super admin only data
      if (hasRole('super_admin')) {
        const allUsers = await getDocsAll('users');
        setTotalUsers(allUsers.length);
        setActiveUsers(allUsers.filter((u: any) => u.status === 'active').length);
        setInactiveUsers(allUsers.filter((u: any) => u.status === 'inactive').length);

        const roleCounts: Record<string, number> = {};
        allUsers.forEach((u: any) => {
          roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
        });
        setUsersByRole(
          Object.entries(roleCounts)
            .map(([role, count]) => ({ role, count: count as number, label: (ROLE_LABELS as any)[role] || role }))
            .sort((a, b) => b.count - a.count)
        );

      }

      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, hasRole]);

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
    ...(hasRole('director_medical_services') ? [
      { label: 'Clinical', icon: Stethoscope, href: '/medical-dashboard', desc: 'Clinical oversight', color: 'from-emerald-600 to-emerald-700', bg: 'bg-emerald-50', iconC: 'text-emerald-600' },
      { label: 'Guidelines', icon: FileText, href: '/clinical-guidelines', desc: 'Clinical standards', color: 'from-teal-500 to-teal-600', bg: 'bg-teal-50', iconC: 'text-teal-600' },
    ] : []),
    ...(hasRole('director_nursing_services') ? [
      { label: 'Nursing', icon: Heart, href: '/nursing-dashboard', desc: 'Nursing oversight', color: 'from-rose-500 to-rose-600', bg: 'bg-rose-50', iconC: 'text-rose-600' },
      { label: 'Training', icon: GraduationCap, href: '/nursing-training', desc: 'CPD programs', color: 'from-violet-500 to-violet-600', bg: 'bg-violet-50', iconC: 'text-violet-600' },
    ] : []),
    ...(hasRole('director_prs') ? [
      { label: 'KPIs', icon: Target, href: '/kpis', desc: 'Performance tracking', color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', iconC: 'text-blue-600' },
      { label: 'Scorecards', icon: Award, href: '/scorecards', desc: 'Hospital scores', color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', iconC: 'text-amber-600' },
    ] : []),
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
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-emerald-300 text-[11px] font-medium">All Systems Operational</span>
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
          <div className="mt-4 text-xs text-emerald-300/60">
            Gombe State Hospital Services Management Board &mdash; HMIS v2.0
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 flex mt-6">
          <div className="flex-1 bg-[#008751]/60" />
          <div className="flex-1 bg-white/30" />
          <div className="flex-1 bg-[#008751]/60" />
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${hasRole('super_admin') ? 'lg:grid-cols-7' : 'lg:grid-cols-4'} gap-4`}>
        <StatCard title="Total Hospitals" value={stats?.total_hospitals || 0} icon={Building2} color="primary" subtitle="Registered facilities" />
        <StatCard title="Total Departments" value={stats?.total_departments || 0} icon={Building} color="army" subtitle="Active units" />
        <StatCard title="Total Employees" value={totalEmployees} icon={Users} color="blue" subtitle="All staff records" />
        <StatCard title="Active Employees" value={activeEmployees} icon={UserCheck} color="teal" subtitle={`${activePercent}% of total workforce`} />
        {hasRole('super_admin') && (
          <>
            <StatCard title="Total Users" value={totalUsers} icon={UserCog} color="purple" subtitle="System accounts" />
            <StatCard title="Active Users" value={activeUsers} icon={UserCheck} color="sage" subtitle={`${totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}% active`} />
            <StatCard title="Inactive Users" value={inactiveUsers} icon={UserX} color="orange" subtitle="Disabled accounts" />
          </>
        )}
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

      {/* ===== SUPER ADMIN SECTIONS ===== */}
      {hasRole('super_admin') && (
        <>
          {/* User Statistics + Hospital/Department Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Users by Role */}
            <div className="card border-t-2 border-t-purple-400">
              <div className="card-header">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Shield size={16} className="text-purple-600" />
                  Users by Role
                </h3>
              </div>
              <div className="p-4">
                {usersByRole.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No users yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {usersByRole.map((r) => (
                      <div key={r.role} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">{r.label}</span>
                            <span className="text-sm font-bold text-slate-900">{r.count}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full rounded-full bg-purple-500 transition-all duration-500"
                              style={{ width: `${Math.min((r.count / Math.max(...usersByRole.map(x => x.count))) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Hospital + Department Summary */}
            <div className="space-y-6">
              {/* Hospital Overview */}
              <div className="card border-t-2 border-t-emerald-400">
                <div className="card-header">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Building2 size={16} className="text-emerald-600" />
                    Hospital Overview
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-800">Active</span>
                    </div>
                    <span className="text-lg font-bold text-emerald-700">{activeHospitals}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <XCircle size={16} className="text-red-500" />
                      <span className="text-sm font-medium text-red-700">Inactive</span>
                    </div>
                    <span className="text-lg font-bold text-red-600">{inactiveHospitals}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">Total Registered</span>
                    </div>
                    <span className="text-lg font-bold text-slate-700">{activeHospitals + inactiveHospitals}</span>
                  </div>
                </div>
              </div>

              {/* Department Summary */}
              <div className="card border-t-2 border-t-army-400">
                <div className="card-header">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Building size={16} className="text-army-600" />
                    Department Summary
                  </h3>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building size={20} className="text-army-600" />
                    <span className="text-sm font-medium text-slate-700">Departments Registered</span>
                  </div>
                  <span className="text-2xl font-bold text-army-700">{stats?.total_departments || 0}</span>
                </div>
                {deptWithData.length > 0 && (
                  <div className="px-4 pb-4">
                    <p className="text-xs text-slate-500 mb-2">Employees per Department</p>
                    <div className="space-y-1.5">
                      {deptWithData.slice(0, 5).map((d, i) => (
                        <div key={d.name} className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-xs text-slate-600 flex-1 truncate">{d.name}</span>
                          <span className="text-xs font-semibold text-slate-800">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

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

      {/* ===== BOTTOM SECTION (hidden for super_admin) ===== */}
      {!hasRole('super_admin') && (
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
      )}

      {/* ===== PHASE 2 COUNTS (Super Admin - simple counts only) ===== */}
      {hasRole('super_admin') && (
        <>
          <div className="flex items-center gap-2 pt-2">
            <div className="h-px flex-1 bg-gradient-to-r from-slate-200 via-slate-400 to-slate-200" />
            <span className="text-xs uppercase tracking-[0.15em] text-slate-600 font-semibold px-3">System Overview</span>
            <div className="h-px flex-1 bg-gradient-to-r from-slate-200 via-slate-400 to-slate-200" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <StatCard title="Guidelines" value={clinicalGuidelineCount} icon={FileText} color="primary" subtitle="Total" />
            <StatCard title="Clinical Audits" value={clinicalAuditCount} icon={Stethoscope} color="blue" subtitle="Active" />
            <StatCard title="Specialists" value={specialistCount} icon={UserCog} color="purple" subtitle="Total" />
            <StatCard title="Nursing Audits" value={nursingAuditCount} icon={Heart} color="purple" subtitle="Active" />
            <StatCard title="Training" value={trainingProgramCount} icon={GraduationCap} color="teal" subtitle="Total" />
            <StatCard title="KPIs" value={kpiSummary.total} icon={Target} color="lemon" subtitle="Active" />
            <StatCard title="Research" value={researchCount} icon={BookOpen} color="army" subtitle="Active" />
            <StatCard title="Reports" value={generatedReportCount} icon={FileText} color="orange" subtitle="Total" />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <div className="h-px flex-1 bg-gradient-to-r from-green-200 via-green-400 to-green-200" />
            <span className="text-xs uppercase tracking-[0.15em] text-green-700 font-semibold px-3">Pharmaceutical & Laboratory</span>
            <div className="h-px flex-1 bg-gradient-to-r from-green-200 via-green-400 to-green-200" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <StatCard title="Medicines" value={medicineCount} icon={Pill} color="primary" subtitle="Total" />
            <StatCard title="Pharm. Audits" value={pharmaAuditCount} icon={ClipboardCheck} color="blue" subtitle="Total" />
            <StatCard title="Pharmacovigilance" value={pharmaVigilanceCount} icon={AlertTriangle} color="orange" subtitle="Reports" />
            <StatCard title="Laboratories" value={laboratoryCount} icon={Microscope} color="purple" subtitle="Total" />
            <StatCard title="Lab. Audits" value={labAuditCount} icon={ClipboardCheck} color="teal" subtitle="Total" />
            <StatCard title="Equipment" value={equipmentCount} icon={Wrench} color="lemon" subtitle="Records" />
            <StatCard title="Surveillance" value={surveillanceCount} icon={Activity} color="orange" subtitle="Reports" />
          </div>
        </>
      )}

      {/* ===== EXECUTIVE OVERVIEW (Executive Secretary only) ===== */}
      {hasRole('executive_secretary') && (
        <>
          <div className="flex items-center gap-2 pt-2">
            <div className="h-px flex-1 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200" />
            <span className="text-xs uppercase tracking-[0.15em] text-emerald-700 font-semibold px-3">Executive Overview</span>
            <div className="h-px flex-1 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200" />
          </div>

          {/* Phase 2 Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Clinical Guidelines" value={clinicalGuidelineCount} icon={FileText} color="primary" subtitle="Published guidelines" />
            <StatCard title="Clinical Audits" value={clinicalAuditCount} icon={Stethoscope} color="blue" subtitle="Active clinical audits" />
            <StatCard title="Specialists" value={specialistCount} icon={UserCog} color="purple" subtitle="Registered specialists" />
            <StatCard title="Nursing Audits" value={nursingAuditCount} icon={Heart} color="purple" subtitle="Active nursing audits" />
            <StatCard title="Training Programs" value={trainingProgramCount} icon={GraduationCap} color="teal" subtitle="CPD & training" />
            <StatCard title="KPIs" value={kpiSummary.total} icon={Target} color="lemon" subtitle={`${kpiSummary.rate}% achieved`} />
            <StatCard title="Research Projects" value={researchCount} icon={BookOpen} color="army" subtitle="Active research" />
            <StatCard title="Generated Reports" value={generatedReportCount} icon={FileText} color="orange" subtitle="System reports" />
          </div>

          {/* Hospital Rankings + KPI Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card border-t-2 border-t-amber-400">
              <div className="card-header">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 size={16} className="text-amber-600" />
                  Hospital Rankings (by Workforce)
                </h3>
              </div>
              <div className="p-4">
                {hospitalRankings.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No data available.</p>
                ) : (
                  <div className="space-y-2.5">
                    {hospitalRankings.map((h: any, i: number) => (
                      <div key={h.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                          i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{h.name}</p>
                          <p className="text-xs text-slate-400">{h.code}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-700">{h.employee_count}</p>
                          <p className="text-[10px] text-slate-400">staff</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card border-t-2 border-t-emerald-400">
              <div className="card-header">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Target size={16} className="text-emerald-600" />
                  KPI Performance Overview
                </h3>
              </div>
              <div className="p-4">
                {kpiSummary.total === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No KPIs configured yet.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center p-6">
                      <div className="relative w-40 h-40">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                          <circle cx="60" cy="60" r="54" fill="none" stroke="#008751" strokeWidth="8"
                            strokeDasharray={`${2 * Math.PI * 54}`}
                            strokeDashoffset={`${2 * Math.PI * 54 * (1 - kpiSummary.rate / 100)}`}
                            strokeLinecap="round"
                            className="transition-all duration-1000"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-slate-900">{kpiSummary.rate}%</p>
                            <p className="text-xs text-slate-400">Achievement</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="p-3 bg-emerald-50 rounded-xl">
                        <p className="text-2xl font-bold text-emerald-700">{kpiSummary.achieved}</p>
                        <p className="text-xs text-emerald-600">Achieved</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-2xl font-bold text-slate-700">{kpiSummary.total}</p>
                        <p className="text-xs text-slate-500">Total KPIs</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Workforce Overview */}
          <div className="flex items-center gap-2 pt-2">
            <div className="h-px flex-1 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200" />
            <span className="text-xs uppercase tracking-[0.15em] text-blue-700 font-semibold px-3">Workforce Overview</span>
            <div className="h-px flex-1 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard title="Doctors" value={doctorCount} icon={UserCheck} color="primary" subtitle="Registered" />
            <StatCard title="Nurses" value={nurseCount} icon={UserPlus} color="blue" subtitle="Registered" />
            <StatCard title="Pharmacists" value={pharmacistCount} icon={Pill} color="purple" subtitle="Registered" />
            <StatCard title="Lab Personnel" value={labCount} icon={FlaskConical} color="teal" subtitle="Registered" />
            <StatCard title="Admin Staff" value={adminCount} icon={Users} color="army" subtitle="Registered" />
            <StatCard title="Total Hospitals" value={activeHospitals} icon={Building2} color="lemon" subtitle="Active" />
          </div>

          {/* Services Overview - Read-only summaries */}
          <div className="flex items-center gap-2 pt-2">
            <div className="h-px flex-1 bg-gradient-to-r from-slate-200 via-slate-400 to-slate-200" />
            <span className="text-xs uppercase tracking-[0.15em] text-slate-600 font-semibold px-3">Services Overview</span>
            <div className="h-px flex-1 bg-gradient-to-r from-slate-200 via-slate-400 to-slate-200" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card border-t-2 border-t-blue-400">
              <div className="card-header">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Stethoscope size={16} className="text-blue-600" />
                  Clinical Services
                </h3>
                <span className="text-[10px] text-slate-400">Read-only</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center p-2.5 bg-blue-50 rounded-lg">
                  <span className="text-sm text-slate-700">Clinical Guidelines</span>
                  <span className="text-sm font-bold text-blue-700">{clinicalGuidelineCount}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-blue-50 rounded-lg">
                  <span className="text-sm text-slate-700">Active Clinical Audits</span>
                  <span className="text-sm font-bold text-blue-700">{clinicalAuditCount}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-blue-50 rounded-lg">
                  <span className="text-sm text-slate-700">Registered Specialists</span>
                  <span className="text-sm font-bold text-blue-700">{specialistCount}</span>
                </div>
              </div>
            </div>
            <div className="card border-t-2 border-t-purple-400">
              <div className="card-header">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Heart size={16} className="text-purple-600" />
                  Nursing Services
                </h3>
                <span className="text-[10px] text-slate-400">Read-only</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center p-2.5 bg-purple-50 rounded-lg">
                  <span className="text-sm text-slate-700">Nursing Workforce</span>
                  <span className="text-sm font-bold text-purple-700">{nurseCount}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-purple-50 rounded-lg">
                  <span className="text-sm text-slate-700">Active Nursing Audits</span>
                  <span className="text-sm font-bold text-purple-700">{nursingAuditCount}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-purple-50 rounded-lg">
                  <span className="text-sm text-slate-700">Training Programs</span>
                  <span className="text-sm font-bold text-purple-700">{trainingProgramCount}</span>
                </div>
              </div>
            </div>
            <div className="card border-t-2 border-t-lemon-400">
              <div className="card-header">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <BarChart3 size={16} className="text-amber-600" />
                  PRS Overview
                </h3>
                <span className="text-[10px] text-slate-400">Read-only</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center p-2.5 bg-amber-50 rounded-lg">
                  <span className="text-sm text-slate-700">Active KPIs</span>
                  <span className="text-sm font-bold text-amber-700">{kpiSummary.total}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-amber-50 rounded-lg">
                  <span className="text-sm text-slate-700">Active Research</span>
                  <span className="text-sm font-bold text-amber-700">{researchCount}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-amber-50 rounded-lg">
                  <span className="text-sm text-slate-700">Generated Reports</span>
                  <span className="text-sm font-bold text-amber-700">{generatedReportCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Phase 3: Pharmaceutical Overview */}
          <div className="flex items-center gap-2 pt-2">
            <div className="h-px flex-1 bg-gradient-to-r from-green-200 via-green-400 to-green-200" />
            <span className="text-xs uppercase tracking-[0.15em] text-green-700 font-semibold px-3">Pharmaceutical Overview</span>
            <div className="h-px flex-1 bg-gradient-to-r from-green-200 via-green-400 to-green-200" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Medicines" value={medicineCount} icon={Pill} color="primary" subtitle="All medicines" />
            <StatCard title="Essential Medicines" value={essentialMedicineCount} icon={FileText} color="blue" subtitle="Essential list" />
            <StatCard title="Pharm. Workforce" value={pharmaWorkforceCount} icon={Users} color="purple" subtitle="Workforce records" />
            <StatCard title="Pharm. Audits" value={pharmaAuditCount} icon={ClipboardCheck} color="lemon" subtitle="Total audits" />
            <StatCard title="Pharmacovigilance" value={pharmaVigilanceCount} icon={AlertTriangle} color="orange" subtitle="ADR reports" />
            <StatCard title="Quality Reports" value={pharmaQualityCount} icon={Shield} color="teal" subtitle="QA reports" />
          </div>

          {/* Phase 3: Laboratory Overview */}
          <div className="flex items-center gap-2 pt-2">
            <div className="h-px flex-1 bg-gradient-to-r from-teal-200 via-teal-400 to-teal-200" />
            <span className="text-xs uppercase tracking-[0.15em] text-teal-700 font-semibold px-3">Laboratory Overview</span>
            <div className="h-px flex-1 bg-gradient-to-r from-teal-200 via-teal-400 to-teal-200" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Laboratories" value={laboratoryCount} icon={Microscope} color="primary" subtitle="Registered labs" />
            <StatCard title="Lab. Workforce" value={labWorkforceCount} icon={Users} color="blue" subtitle="Workforce records" />
            <StatCard title="Equipment" value={equipmentCount} icon={Wrench} color="purple" subtitle="Lab equipment" />
            <StatCard title="Lab. Audits" value={labAuditCount} icon={ClipboardCheck} color="lemon" subtitle="Total audits" />
            <StatCard title="Reagents" value={reagentCount} icon={Syringe} color="teal" subtitle="Reagent records" />
            <StatCard title="Surveillance" value={surveillanceCount} icon={Activity} color="orange" subtitle="Disease reports" />
          </div>
        </>
      )}

      {/* Super Admin dashboard ends here - health status shown in top bar */}

      {/* ===== RECENT ACTIVITIES (hidden for super_admin) ===== */}
      {!hasRole('super_admin') && (
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
      )}

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
