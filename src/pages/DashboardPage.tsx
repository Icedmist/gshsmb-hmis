import { useState, useEffect, useCallback } from 'react';
import { DashboardStats, Employee, EmployeeTransfer } from '../types';
import StatCard from '../components/common/StatCard';
import {
  Building2, Building, Users, UserCheck, TrendingUp, Activity,
  ArrowUpRight, ArrowRightLeft, BarChart3,
  UserPlus, CheckCircle, Target, BookOpen, FileText, GraduationCap,
  UserCog, UserX, FlaskConical, AlertTriangle, XCircle,
  Pill, ClipboardCheck, Syringe, Wrench, Microscope,
  Shield, Layers, DollarSign, PiggyBank, TrendingDown, Wallet, Briefcase, RefreshCw, Calendar,
  Bell, ListTodo, MessageSquare
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardStats, getEmployeesPerHospital, getEmployeesPerDepartment, getRecentEmployees, getRecentTransfers } from '../lib/dashboard';
import { getFinanceDashboardStats } from '../lib/finance';
import { getDocsAll, countDocs, type FilterConstraint } from '../lib/firestore';

const CHART_COLORS = ['#008751', '#22c55e', '#6b7e36', '#84cc16', '#0d9488', '#14b8a6', '#65a30d', '#4d7c0f'];

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.95)',
  backdropFilter: 'blur(8px)',
};

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white rounded-2xl p-8 border border-slate-200/60 shadow-sm">
        <div className="h-5 bg-gradient-to-r from-slate-100 to-slate-50 rounded w-48 mb-3" />
        <div className="h-4 bg-gradient-to-r from-slate-100 to-slate-50 rounded w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="h-4 bg-gradient-to-r from-slate-100 to-slate-50 rounded w-24 mb-3" />
            <div className="h-8 bg-gradient-to-r from-slate-100 to-slate-50 rounded w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm h-80" />
        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm h-80" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [empPerHospital, setEmpPerHospital] = useState<{ name: string; value: number }[]>([]);
  const [recentEmployees, setRecentEmployees] = useState<Employee[]>([]);
  const [recentTransfers, setRecentTransfers] = useState<EmployeeTransfer[]>([]);

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [hospitalRankings, setHospitalRankings] = useState<any[]>([]);
  const [kpiSummary, setKpiSummary] = useState({ total: 0, achieved: 0, rate: 0 });
  const [clinicalAuditCount, setClinicalAuditCount] = useState(0);
  const [nursingAuditCount, setNursingAuditCount] = useState(0);
  const [researchCount, setResearchCount] = useState(0);

  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [inactiveUsers, setInactiveUsers] = useState(0);
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

  const [financeStats, setFinanceStats] = useState<any>(null);

  const loadDashboardData = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const hospitalScope = user?.hospital_id || undefined;
      const results = await Promise.allSettled([
        getDashboardStats(hospitalScope),
        getEmployeesPerHospital(hospitalScope),
        getEmployeesPerDepartment(hospitalScope),
        getRecentEmployees(hospitalScope),
        getRecentTransfers(hospitalScope),
        getDocsAll('hospitals', [{ field: 'status', op: '==', value: 'active' }], { field: 'hospital_name', dir: 'asc' }),
        getDocsAll('kpis', [{ field: 'status', op: '==', value: 'active' }]),
        getDocsAll('clinicalAudits'),
        getDocsAll('nursingAudits'),
        getDocsAll('researchProjects'),
        getDocsAll('hospitalScorecards'),
      ]);
      const [s, eph, epd, re, rt, hospitals, kpis, clinicalAudits, nursingAudits, research] = results.map(r => r.status === 'fulfilled' ? r.value : undefined);
      if (s) setStats(s as DashboardStats);
      if (eph) setEmpPerHospital((eph as any[]).map(h => ({ name: h.hospital_name, value: parseInt(h.employee_count) })));

      if (re) setRecentEmployees(Array.isArray(re) ? re : []);
      if (rt) setRecentTransfers(Array.isArray(rt) ? rt : []);

      if (hospitals && Array.isArray(hospitals)) {
        const rankedResults = await Promise.allSettled(
          hospitals.map(async (h: any) => {
            const empCount = await countDocs('employees', [{ field: 'hospital_id', op: '==', value: h.id } as FilterConstraint]);
            return { id: h.id, name: h.hospital_name, code: h.hospital_code, employee_count: empCount };
          })
        );
        const ranked = rankedResults.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<any>).value);
        if (ranked.length > 0) setHospitalRankings(ranked.sort((a: any, b: any) => b.employee_count - a.employee_count));
      }

      if (kpis && Array.isArray(kpis)) {
        const total = kpis.length;
        const achieved = kpis.filter((k: any) => k.actual_value >= k.target).length;
        setKpiSummary({ total, achieved, rate: total > 0 ? Math.round((achieved / total) * 100) : 0 });
      }
      if (clinicalAudits && Array.isArray(clinicalAudits)) setClinicalAuditCount(clinicalAudits.length);
      if (nursingAudits && Array.isArray(nursingAudits)) setNursingAuditCount(nursingAudits.length);
      if (research && Array.isArray(research)) setResearchCount(research.length);

      if (hasRole('super_admin', 'executive_secretary')) {
        const [empStats, hospStats] = await Promise.allSettled([
          Promise.allSettled([
            countDocs('employees', [{ field: 'position', op: '==', value: 'Doctor' }]),
            countDocs('employees', [{ field: 'position', op: '==', value: 'Nurse' }]),
            countDocs('employees', [{ field: 'position', op: '==', value: 'Pharmacist' }]),
            countDocs('employees', [{ field: 'position', op: '==', value: 'Laboratory Personnel' }]),
            countDocs('employees', [{ field: 'position', op: '==', value: 'Administrative Staff' }]),
          ]),
          Promise.allSettled([
            countDocs('hospitals', [{ field: 'status', op: '==', value: 'active' }]),
            countDocs('hospitals', [{ field: 'status', op: '==', value: 'inactive' }]),
            getDocsAll('clinicalGuidelines'),
            getDocsAll('specialists'),
            getDocsAll('trainingPrograms'),
            getDocsAll('generatedReports'),
          ]),
        ]);

        if (empStats.status === 'fulfilled') {
          const [doc, nur, pharm, lab, admin] = empStats.value.map(r => r.status === 'fulfilled' ? r.value : 0);
          setDoctorCount(doc);
          setNurseCount(nur);
          setPharmacistCount(pharm);
          setLabCount(lab);
          setAdminCount(admin);
        }

        if (hospStats.status === 'fulfilled') {
          const [actHosp, inactHosp, guidelines, specialists, trainings, reports] = hospStats.value.map(r => r.status === 'fulfilled' ? r.value : []);
          setActiveHospitals(typeof actHosp === 'number' ? actHosp : 0);
          setInactiveHospitals(typeof inactHosp === 'number' ? inactHosp : 0);
          if (Array.isArray(guidelines)) setClinicalGuidelineCount(guidelines.length);
          if (Array.isArray(specialists)) setSpecialistCount(specialists.length);
          if (Array.isArray(trainings)) setTrainingProgramCount(trainings.length);
          if (Array.isArray(reports)) setGeneratedReportCount(reports.length);
        }
      }

      if (hasRole('super_admin', 'executive_secretary')) {
        const phase3Results = await Promise.allSettled([
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
        const [med, essMed, phAud, phWf, phVig, phQa, labs, labAud, labWf, equip, reag, surv] = phase3Results.map(r => r.status === 'fulfilled' ? r.value : []);
        if (Array.isArray(med)) setMedicineCount(med.length);
        if (Array.isArray(essMed)) setEssentialMedicineCount(essMed.length);
        if (Array.isArray(phAud)) setPharmaAuditCount(phAud.length);
        if (Array.isArray(phWf)) setPharmaWorkforceCount(phWf.length);
        if (Array.isArray(phVig)) setPharmaVigilanceCount(phVig.length);
        if (Array.isArray(phQa)) setPharmaQualityCount(phQa.length);
        if (Array.isArray(labs)) setLaboratoryCount(labs.length);
        if (Array.isArray(labAud)) setLabAuditCount(labAud.length);
        if (Array.isArray(labWf)) setLabWorkforceCount(labWf.length);
        if (Array.isArray(equip)) setEquipmentCount(equip.length);
        if (Array.isArray(reag)) setReagentCount(reag.length);
        if (Array.isArray(surv)) setSurveillanceCount(surv.length);
      }

      if (hasRole('super_admin', 'executive_secretary', 'hospital_admin', 'hr_officer', 'director_hr')) {
        try {
          const scope = hasRole('super_admin', 'executive_secretary') ? undefined : hospitalScope;
          const fs = await getFinanceDashboardStats(scope);
          if (fs) setFinanceStats(fs);
        } catch {}
      }

      if (hasRole('super_admin')) {
        try {
          const allUsers = await getDocsAll('users');
          setTotalUsers(allUsers.length);
          setActiveUsers(allUsers.filter((u: any) => u.status === 'active').length);
          setInactiveUsers(allUsers.filter((u: any) => u.status === 'inactive').length);
        } catch {}
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
    if (hasRole('super_admin', 'executive_secretary', 'hospital_admin', 'hr_officer', 'director_hr')) {
      loadDashboardData();
      if (hasRole('super_admin', 'executive_secretary')) {
        const interval = setInterval(() => loadDashboardData(true), 30000);
        return () => clearInterval(interval);
      }
    }
  }, []);

  useEffect(() => {
    if (hasRole('super_admin', 'executive_secretary', 'hospital_admin', 'hr_officer', 'director_hr')) return;
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
  }, [hasRole, navigate]);

  const refreshNow = () => loadDashboardData();

  const secondsAgo = lastUpdated
    ? Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
    : null;

  if (loading) return <Skeleton />;

  const totalEmployees = stats?.total_employees || 0;
  const activeEmployees = stats?.active_employees || 0;
  const activePercent = totalEmployees > 0 ? Math.round((activeEmployees / totalEmployees) * 100) : 0;

  const isSuper = hasRole('super_admin');
  const isExecSec = hasRole('executive_secretary');
  const isScopeMgr = !isSuper && !isExecSec;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #001a0f 0%, #022c22 30%, #064e3b 60%, #006838 100%)' }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-emerald-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0H0v40' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")` }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-emerald-200/80 text-sm mb-2">
            <BarChart3 size={14} />
            <span>Dashboard</span>
            <span className="text-emerald-500/50">/</span>
            <span className="text-white font-medium">
              {isSuper ? 'Administrator' : isExecSec ? 'Executive Secretary' : 'HR & Administration'}
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            {isSuper ? 'Administration Dashboard' : isExecSec ? 'Executive Dashboard' : 'HR & Admin Dashboard'}
          </h1>
          <p className="mt-1.5 text-emerald-100/60 text-sm max-w-xl">
            {isSuper
              ? 'System-wide oversight, workforce analytics, and multi-departmental monitoring'
              : isExecSec
              ? 'Strategic overview of clinical, nursing, pharmaceutical, laboratory, and financial performance'
              : 'Employee records, department distribution, transfers, and payroll management'}
          </p>
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-sm w-fit mt-4">
            <Calendar size={15} className="text-emerald-200/80" />
            <div className="flex flex-col items-start">
              <span className="text-sm text-emerald-50 font-medium tabular-nums tracking-wide">
                {currentTime.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </span>
              <span className="text-[10px] text-emerald-200/60 leading-tight">
                {currentTime.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isSuper ? 'lg:grid-cols-7' : 'lg:grid-cols-4'} gap-4`}>
        <StatCard title="Total Hospitals" value={stats?.total_hospitals || 0} icon={Building2} color="primary" subtitle="Registered facilities" delay={0} />
        <StatCard title="Total Departments" value={stats?.total_departments || 0} icon={Building} color="army" subtitle="Active units" delay={50} />
        <StatCard title="Total Employees" value={totalEmployees} icon={Users} color="blue" subtitle="All staff records" delay={100} />
        <StatCard title="Active Employees" value={activeEmployees} icon={UserCheck} color="teal" subtitle={`${activePercent}% of total workforce`} delay={150} />
        {isSuper && (
          <>
            <StatCard title="Total Users" value={totalUsers} icon={UserCog} color="purple" subtitle="System accounts" delay={200} />
            <StatCard title="Active Users" value={activeUsers} icon={UserCheck} color="sage" subtitle={`${totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}% active`} delay={250} />
            <StatCard title="Inactive Users" value={inactiveUsers} icon={UserX} color="orange" subtitle="Disabled accounts" delay={300} />
          </>
        )}
      </div>

      {/* Super Admin */}
      {isSuper && (
        <>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="card border-t-2 border-t-emerald-400 shadow-sm hover:shadow-md transition-shadow">
              <div className="card-header bg-gradient-to-r from-emerald-50/50 to-transparent">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 size={16} className="text-emerald-600" />
                  Hospital Overview
                </h3>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { label: 'Active', value: activeHospitals, color: 'emerald', bg: 'emerald', Icon: CheckCircle },
                  { label: 'Inactive', value: inactiveHospitals, color: 'red', bg: 'red', Icon: XCircle },
                  { label: 'Total Registered', value: activeHospitals + inactiveHospitals, color: 'slate', bg: 'slate', Icon: Building2 },
                ].map(item => (
                  <div key={item.label} className={`flex items-center justify-between p-3.5 bg-gradient-to-r from-${item.bg}-50 to-${item.bg === 'slate' ? 'gray' : item.bg}-50 rounded-xl border border-${item.bg}-100`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-${item.bg}-100`}>
                        <item.Icon size={16} className={`text-${item.color === 'slate' ? 'slate' : item.color}-600`} />
                      </div>
                      <span className={`text-sm font-semibold text-${item.color === 'slate' ? 'slate' : item.color}-800`}>{item.label}</span>
                    </div>
                    <span className={`text-2xl font-bold text-${item.color === 'slate' ? 'slate' : item.color}-700 tabular-nums`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="card border-t-2 border-t-sky-400 shadow-sm hover:shadow-md transition-shadow h-full">
                <div className="card-header bg-gradient-to-r from-sky-50/50 to-transparent">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <BarChart3 size={18} className="text-sky-600" />
                    <span className="text-sky-700">Employees Per Hospital</span>
                  </h3>
                  <Link to="/employees" className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1 transition-colors">
                    View All <ArrowUpRight size={12} />
                  </Link>
                </div>
                <div className="card-body">
                  {empPerHospital.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <div className="p-4 rounded-2xl bg-slate-50 mb-4">
                        <BarChart3 size={40} className="text-slate-300" />
                      </div>
                      <p className="text-sm font-medium">No data available yet.</p>
                      <p className="text-xs text-slate-300 mt-1">Employee data will appear once records are created.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={empPerHospital} margin={{ top: 5, right: 20, bottom: 5, left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0,135,81,0.04)' }} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={65}>
                          {empPerHospital.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card border-t-2 border-t-slate-400 shadow-sm">
            <div className="card-header bg-gradient-to-r from-slate-50/50 to-transparent">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Layers size={16} className="text-slate-600" />
                System Overview
              </h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard title="Guidelines" value={clinicalGuidelineCount} icon={FileText} color="primary" subtitle="Total" delay={0} />
                <StatCard title="Clinical Audits" value={clinicalAuditCount} icon={Activity} color="blue" subtitle="Total" delay={30} />
                <StatCard title="Specialists" value={specialistCount} icon={UserCog} color="purple" subtitle="Total" delay={60} />
                <StatCard title="Nursing Audits" value={nursingAuditCount} icon={UserCheck} color="rose" subtitle="Total" delay={90} />
                <StatCard title="Training" value={trainingProgramCount} icon={GraduationCap} color="teal" subtitle="Total" delay={120} />
                <StatCard title="KPIs" value={kpiSummary.total} icon={Target} color="lemon" subtitle="Active" delay={150} />
                <StatCard title="Research" value={researchCount} icon={BookOpen} color="army" subtitle="Total" delay={180} />
                <StatCard title="Reports" value={generatedReportCount} icon={FileText} color="orange" subtitle="Total" delay={210} />
              </div>
            </div>
          </div>

          <div className="card border-t-2 border-t-emerald-400 shadow-sm">
            <div className="card-header bg-gradient-to-r from-emerald-50/50 to-transparent">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Pill size={16} className="text-emerald-600" />
                Pharmaceutical & Laboratory
              </h3>
            </div>
            <div className="card-body space-y-6">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Pill size={12} className="text-emerald-500" /> Pharmaceutical
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard title="Medicines" value={medicineCount} icon={Pill} color="primary" subtitle="Total" delay={0} />
                  <StatCard title="Pharm. Audits" value={pharmaAuditCount} icon={ClipboardCheck} color="blue" subtitle="Total" delay={40} />
                  <StatCard title="Pharmacovigilance" value={pharmaVigilanceCount} icon={AlertTriangle} color="orange" subtitle="Reports" delay={80} />
                  <StatCard title="Quality Reports" value={pharmaQualityCount} icon={Shield} color="teal" subtitle="QA reports" delay={120} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Microscope size={12} className="text-teal-500" /> Laboratory
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard title="Laboratories" value={laboratoryCount} icon={Microscope} color="purple" subtitle="Total" delay={0} />
                  <StatCard title="Lab. Audits" value={labAuditCount} icon={ClipboardCheck} color="teal" subtitle="Total" delay={40} />
                  <StatCard title="Equipment" value={equipmentCount} icon={Wrench} color="lemon" subtitle="Records" delay={80} />
                  <StatCard title="Surveillance" value={surveillanceCount} icon={Activity} color="orange" subtitle="Reports" delay={120} />
                </div>
              </div>
            </div>
          </div>

          {financeStats && (
            <div className="card border-t-2 border-t-amber-400 shadow-sm">
              <div className="card-header bg-gradient-to-r from-amber-50/50 to-transparent">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <DollarSign size={16} className="text-amber-600" />
                  Financial Summary
                </h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard title="Total Budgets" value={financeStats.totalBudgets || 0} icon={PiggyBank} color="primary" subtitle="All budgets" delay={0} />
                  <StatCard title="Financial Reports" value={financeStats.totalReports || 0} icon={FileText} color="blue" subtitle="Generated reports" delay={50} />
                  <StatCard title="Revenue Records" value={financeStats.totalRevenueCount || 0} icon={TrendingUp} color="teal" subtitle="Total entries" delay={100} />
                  <StatCard title="Payroll Reports" value={financeStats.totalPayrollCount || 0} icon={Users} color="lemon" subtitle="Total reports" delay={150} />
                  <StatCard title="Total Assets" value={financeStats.totalAssets || 0} icon={Briefcase} color="army" subtitle="Registered assets" delay={200} />
                  <StatCard title="Compliance Reports" value={financeStats.totalCompliance || 0} icon={FileText} color="orange" subtitle="Total reports" delay={250} />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Executive Secretary */}
      {isExecSec && (
        <>

          <div className="card border-t-2 border-t-emerald-400 shadow-sm">
            <div className="card-header bg-gradient-to-r from-emerald-50/50 to-transparent">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-600" />
                Executive Overview
              </h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Clinical Guidelines" value={clinicalGuidelineCount} icon={FileText} color="primary" subtitle="Published guidelines" delay={0} />
                <StatCard title="Clinical Audits" value={clinicalAuditCount} icon={Activity} color="blue" subtitle="Active clinical audits" delay={50} />
                <StatCard title="Specialists" value={specialistCount} icon={UserCog} color="purple" subtitle="Registered specialists" delay={100} />
                <StatCard title="Nursing Audits" value={nursingAuditCount} icon={UserCheck} color="rose" subtitle="Active nursing audits" delay={150} />
                <StatCard title="Training Programs" value={trainingProgramCount} icon={GraduationCap} color="teal" subtitle="CPD & training" delay={200} />
                <StatCard title="KPIs" value={kpiSummary.total} icon={Target} color="lemon" subtitle={`${kpiSummary.rate}% achieved`} delay={250} />
                <StatCard title="Research Projects" value={researchCount} icon={BookOpen} color="army" subtitle="Active research" delay={300} />
                <StatCard title="Generated Reports" value={generatedReportCount} icon={FileText} color="orange" subtitle="System reports" delay={350} />
              </div>
            </div>
          </div>

          <div className="card border-t-2 border-t-sky-400 shadow-sm">
            <div className="card-header bg-gradient-to-r from-sky-50/50 to-transparent">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Users size={16} className="text-sky-600" />
                Workforce Overview
              </h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard title="Doctors" value={doctorCount} icon={UserCheck} color="primary" subtitle="Registered" delay={0} />
                <StatCard title="Nurses" value={nurseCount} icon={UserPlus} color="blue" subtitle="Registered" delay={60} />
                <StatCard title="Pharmacists" value={pharmacistCount} icon={Pill} color="purple" subtitle="Registered" delay={120} />
                <StatCard title="Lab Personnel" value={labCount} icon={FlaskConical} color="teal" subtitle="Registered" delay={180} />
                <StatCard title="Admin Staff" value={adminCount} icon={Users} color="army" subtitle="Registered" delay={240} />
                <StatCard title="Total Hospitals" value={activeHospitals} icon={Building2} color="lemon" subtitle="Active" delay={300} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card border-t-2 border-t-amber-400 shadow-sm hover:shadow-md transition-shadow">
              <div className="card-header bg-gradient-to-r from-amber-50/50 to-transparent">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 size={16} className="text-amber-600" />
                  Hospital Rankings (by Workforce)
                </h3>
              </div>
              <div className="p-5">
                {hospitalRankings.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No data available.</p>
                ) : (
                  <div className="space-y-3">
                    {hospitalRankings.map((h: any, i: number) => (
                      <div key={h.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent transition-all duration-200">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                          i === 0 ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                          i === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' :
                          i === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-800' :
                          'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500'
                        }`}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{h.name}</p>
                          <p className="text-xs text-slate-400">{h.code}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-700 tabular-nums">{h.employee_count}</p>
                          <p className="text-[10px] text-slate-400">staff</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card border-t-2 border-t-emerald-400 shadow-sm hover:shadow-md transition-shadow">
              <div className="card-header bg-gradient-to-r from-emerald-50/50 to-transparent">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Target size={16} className="text-emerald-600" />
                  KPI Performance Overview
                </h3>
              </div>
              <div className="p-5">
                {kpiSummary.total === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No KPIs configured yet.</p>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-center">
                      <div className="relative w-44 h-44">
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
                            <p className="text-4xl font-bold text-slate-900 tabular-nums">{kpiSummary.rate}%</p>
                            <p className="text-xs text-slate-400">Achievement</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100 text-center">
                        <p className="text-3xl font-bold text-emerald-700 tabular-nums">{kpiSummary.achieved}</p>
                        <p className="text-xs text-emerald-600 font-medium mt-1">Achieved</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border border-slate-100 text-center">
                        <p className="text-3xl font-bold text-slate-700 tabular-nums">{kpiSummary.total}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">Total KPIs</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card border-t-2 border-t-slate-400 shadow-sm">
            <div className="card-header bg-gradient-to-r from-slate-50/50 to-transparent">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Layers size={16} className="text-slate-600" />
                Services Overview
              </h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[
                  { title: 'Clinical Services', icon: Activity, color: 'blue', items: [
                    { label: 'Clinical Guidelines', value: clinicalGuidelineCount },
                    { label: 'Active Clinical Audits', value: clinicalAuditCount },
                    { label: 'Registered Specialists', value: specialistCount },
                  ]},
                  { title: 'Nursing Services', icon: UserCheck, color: 'purple', items: [
                    { label: 'Nursing Workforce', value: nurseCount },
                    { label: 'Active Nursing Audits', value: nursingAuditCount },
                    { label: 'Training Programs', value: trainingProgramCount },
                  ]},
                  { title: 'PRS Overview', icon: BarChart3, color: 'amber', items: [
                    { label: 'Active KPIs', value: kpiSummary.total },
                    { label: 'Active Research', value: researchCount },
                    { label: 'Generated Reports', value: generatedReportCount },
                  ]},
                ].map(section => (
                  <div key={section.title} className={`card border-t-2 border-t-${section.color}-400 shadow-sm`}>
                    <div className={`card-header bg-gradient-to-r from-${section.color}-50/50 to-transparent`}>
                      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <section.icon size={16} className={`text-${section.color}-600`} />
                        {section.title}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Read-only</span>
                    </div>
                    <div className="p-5 space-y-3">
                      {section.items.map(item => (
                        <div key={item.label} className={`flex justify-between items-center p-3 bg-gradient-to-r from-${section.color}-50 to-transparent rounded-xl border border-${section.color}-100/50`}>
                          <span className="text-sm font-medium text-slate-700">{item.label}</span>
                          <span className={`text-sm font-bold text-${section.color}-700 tabular-nums`}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card border-t-2 border-t-emerald-400 shadow-sm">
            <div className="card-header bg-gradient-to-r from-emerald-50/50 to-transparent">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Pill size={16} className="text-emerald-600" />
                Pharmaceutical Overview
              </h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Medicines" value={medicineCount} icon={Pill} color="primary" subtitle="All medicines" delay={0} />
                <StatCard title="Essential Medicines" value={essentialMedicineCount} icon={FileText} color="blue" subtitle="Essential list" delay={50} />
                <StatCard title="Pharm. Workforce" value={pharmaWorkforceCount} icon={Users} color="purple" subtitle="Workforce records" delay={100} />
                <StatCard title="Pharm. Audits" value={pharmaAuditCount} icon={ClipboardCheck} color="lemon" subtitle="Total audits" delay={150} />
                <StatCard title="Pharmacovigilance" value={pharmaVigilanceCount} icon={AlertTriangle} color="orange" subtitle="ADR reports" delay={200} />
                <StatCard title="Quality Reports" value={pharmaQualityCount} icon={Shield} color="teal" subtitle="QA reports" delay={250} />
              </div>
            </div>
          </div>

          <div className="card border-t-2 border-t-teal-400 shadow-sm">
            <div className="card-header bg-gradient-to-r from-teal-50/50 to-transparent">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Microscope size={16} className="text-teal-600" />
                Laboratory Overview
              </h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Laboratories" value={laboratoryCount} icon={Microscope} color="primary" subtitle="Registered labs" delay={0} />
                <StatCard title="Lab. Workforce" value={labWorkforceCount} icon={Users} color="blue" subtitle="Workforce records" delay={50} />
                <StatCard title="Equipment" value={equipmentCount} icon={Wrench} color="purple" subtitle="Lab equipment" delay={100} />
                <StatCard title="Lab. Audits" value={labAuditCount} icon={ClipboardCheck} color="lemon" subtitle="Total audits" delay={150} />
                <StatCard title="Reagents" value={reagentCount} icon={Syringe} color="teal" subtitle="Reagent records" delay={200} />
                <StatCard title="Surveillance" value={surveillanceCount} icon={Activity} color="orange" subtitle="Disease reports" delay={250} />
              </div>
            </div>
          </div>

          {financeStats && (
            <div className="card border-t-2 border-t-teal-400 shadow-sm">
              <div className="card-header bg-gradient-to-r from-teal-50/50 to-transparent">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <DollarSign size={16} className="text-teal-600" />
                  Financial Performance
                </h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard title="Budget Performance" value={financeStats.totalBudgets || 0} icon={PiggyBank} color="primary" subtitle={`${financeStats.budgetUtilization || 0}% utilized`} delay={0} />
                  <StatCard title="Revenue Reports" value={financeStats.totalRevenueCount || 0} icon={TrendingUp} color="teal" subtitle={`₦${((financeStats.totalRevenue || 0) / 1000000).toFixed(1)}M total`} delay={50} />
                  <StatCard title="Expenditure Reports" value={financeStats.totalExpenditureCount || 0} icon={TrendingDown} color="orange" subtitle={`₦${((financeStats.totalExpenditure || 0) / 1000000).toFixed(1)}M total`} delay={100} />
                  <StatCard title="Payroll Summary" value={financeStats.totalPayrollCount || 0} icon={Users} color="lemon" subtitle={`₦${((financeStats.totalPayroll || 0) / 1000000).toFixed(1)}M total`} delay={150} />
                  <StatCard title="Asset Reports" value={financeStats.totalAssets || 0} icon={Briefcase} color="army" subtitle={`₦${((financeStats.totalAssetValue || 0) / 1000000).toFixed(1)}M value`} delay={200} />
                  <StatCard title="Compliance Status" value={financeStats.totalCompliance || 0} icon={FileText} color="orange" subtitle={`${financeStats.openCompliance || 0} open items`} delay={250} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                  <Link to="/financial-reports" className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 hover:border-teal-300 hover:shadow-md transition-all text-sm font-semibold text-teal-700">
                    <FileText size={16} /> Review Financial Statements <ArrowUpRight size={14} />
                  </Link>
                  <Link to="/financial-analytics" className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 hover:border-amber-300 hover:shadow-md transition-all text-sm font-semibold text-amber-700">
                    <BarChart3 size={16} /> Financial Performance Dashboard <ArrowUpRight size={14} />
                  </Link>
                  <Link to="/payroll-monitoring" className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 hover:border-violet-300 hover:shadow-md transition-all text-sm font-semibold text-violet-700">
                    <Users size={16} /> Payroll Summary Reports <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Hospital Admin / HR Officer / Director HR */}
      {isScopeMgr && (
        <>

          <div className="card border-t-2 border-t-sky-400 shadow-sm">
            <div className="card-header bg-gradient-to-r from-sky-50/50 to-transparent">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <BarChart3 size={18} className="text-sky-600" />
                <span className="text-sky-700">Employees Per Hospital</span>
              </h3>
              <Link to="/employees" className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1 transition-colors">
                View All <ArrowUpRight size={12} />
              </Link>
            </div>
            <div className="card-body">
              {empPerHospital.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <div className="p-4 rounded-2xl bg-slate-50 mb-4">
                    <BarChart3 size={40} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-medium">No data available yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={empPerHospital} margin={{ top: 5, right: 20, bottom: 5, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0,135,81,0.04)' }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={65}>
                      {empPerHospital.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card border-t-2 border-t-teal-400 shadow-sm">
                <div className="card-header bg-gradient-to-r from-teal-50/50 to-transparent">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <UserPlus size={16} className="text-teal-600" />
                    <span className="text-teal-700">Recent Employees</span>
                  </h3>
                  <Link to="/employees" className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors">View All</Link>
                </div>
                <div className="p-0">
                  {recentEmployees.length === 0 ? (
                    <p className="text-slate-400 text-sm py-8 text-center">No employees yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                      {recentEmployees.map(emp => (
                        <div key={emp.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-transparent transition-all duration-200 group">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#008751] to-[#006838] flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
                              {emp.full_name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900 group-hover:text-[#008751] transition-colors">{emp.full_name}</p>
                              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                <span className="font-mono text-[11px]">{emp.staff_id}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                {emp.department_name || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            emp.status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' :
                            emp.status === 'suspended' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20' :
                            'bg-slate-50 text-slate-600 ring-1 ring-slate-400/20'
                          }`}>{emp.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="card border-t-2 border-t-orange-400 shadow-sm">
                <div className="card-header bg-gradient-to-r from-orange-50/50 to-transparent">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <ArrowRightLeft size={16} className="text-orange-600" />
                    <span className="text-orange-700">Recent Transfers</span>
                  </h3>
                  <Link to="/transfers" className="text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors">View All</Link>
                </div>
                <div className="p-0">
                  {recentTransfers.length === 0 ? (
                    <p className="text-slate-400 text-sm py-8 text-center">No transfers yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                      {recentTransfers.map(t => (
                        <div key={t.id} className="px-5 py-3.5 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-transparent transition-all duration-200 group">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-orange-700 transition-colors">{t.employee_name}</p>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              t.status === 'approved' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' :
                              t.status === 'pending' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20' :
                              'bg-red-50 text-red-700 ring-1 ring-red-600/20'
                            }`}>{t.status || 'approved'}</span>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-2">
                            <span className="text-emerald-700 font-medium">{t.from_hospital}</span>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hasRole('hospital_admin') && financeStats && (
              <div className="card border-t-2 border-t-blue-400 shadow-sm">
                <div className="card-header bg-gradient-to-r from-blue-50/50 to-transparent">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <DollarSign size={16} className="text-blue-600" />
                    Hospital Financial Overview
                  </h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard title="Hospital Budgets" value={financeStats.totalBudgets || 0} icon={PiggyBank} color="primary" subtitle="Annual budgets" delay={0} />
                    <StatCard title="Hospital Reports" value={financeStats.totalReports || 0} icon={FileText} color="blue" subtitle="Financial reports" delay={50} />
                    <StatCard title="Hospital Assets" value={financeStats.totalAssets || 0} icon={Briefcase} color="army" subtitle="Registered assets" delay={100} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                    {[
                      { label: 'Submit Report', href: '/financial-reports?action=submit', color: 'blue' },
                      { label: 'Upload Documents', href: '/financial-reports?action=upload', color: 'emerald' },
                      { label: 'Review Requests', href: '/financial-reports?action=reviews', color: 'amber' },
                    ].map(a => (
                      <Link key={a.label} to={a.href}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-${a.color}-50 to-indigo-50 border border-${a.color}-200 hover:border-${a.color}-300 hover:shadow-md transition-all text-sm font-medium text-${a.color}-700">
                        <FileText size={15} /> {a.label} <ArrowUpRight size={13} />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {hasRole('hr_officer', 'director_hr') && financeStats && (
              <div className="card border-t-2 border-t-violet-400 shadow-sm">
                <div className="card-header bg-gradient-to-r from-violet-50/50 to-transparent">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Wallet size={16} className="text-violet-600" />
                    Payroll Overview
                  </h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard title="Payroll Reports" value={financeStats.totalPayrollCount || 0} icon={Wallet} color="purple" subtitle="Total reports" delay={0} />
                    <StatCard title="Gross Pay Total" value={Math.round((financeStats.totalPayroll || 0) / 1000000)} icon={TrendingUp} color="teal" subtitle="₦M (rounded)" delay={50} />
                    <StatCard title="Payroll History" value={financeStats.totalPayrollHistoryCount || 0} icon={FileText} color="army" subtitle="Detailed records" delay={100} />
                  </div>
                  <Link to="/payroll-monitoring" className="inline-flex items-center justify-center gap-2 px-4 py-3 mt-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 hover:border-violet-300 hover:shadow-md transition-all text-sm font-semibold text-violet-700 w-full">
                    <Wallet size={16} /> View Payroll Details <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Collaboration Quick Links */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Layers size={16} className="text-violet-600" />
            Collaboration Hub
          </h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <Link to="/notifications" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-violet-50 hover:bg-violet-100 transition-colors">
              <Bell size={20} className="text-violet-600" />
              <span className="text-[10px] font-medium text-slate-600 text-center">Notifications</span>
            </Link>
            <Link to="/messages" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <MessageSquare size={20} className="text-indigo-600" />
              <span className="text-[10px] font-medium text-slate-600 text-center">Messages</span>
            </Link>
            <Link to="/tasks" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-teal-50 hover:bg-teal-100 transition-colors">
              <ListTodo size={20} className="text-teal-600" />
              <span className="text-[10px] font-medium text-slate-600 text-center">Tasks</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-1 py-2 mt-4">
        <span className="text-[11px] text-slate-400">
          &copy; {new Date().getFullYear()} Gombe State HMIS &mdash; All rights reserved
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 tabular-nums">
            {lastUpdated
              ? `Updated ${secondsAgo! < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo! / 60)}m ago`}`
              : 'Loading...'}
          </span>
          <button
            onClick={refreshNow}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            title="Refresh now"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-emerald-500' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
}
