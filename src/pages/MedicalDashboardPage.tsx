import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDocsAll, type FilterConstraint } from '../lib/firestore';
import { getHospitalScope } from '../lib/scope';
import { useAuth } from '../contexts/AuthContext';
import StatCard from '../components/common/StatCard';
import { Stethoscope, Users, AlertTriangle, ArrowRight, ClipboardList, BookOpen, HeartPulse, ArrowUpRight, Layers, DollarSign } from 'lucide-react';

export default function MedicalDashboardPage() {
  const { user } = useAuth();
  const hospitalScope = getHospitalScope(user);
  const hf: FilterConstraint[] = hospitalScope ? [{ field: 'hospital_id', op: '==', value: hospitalScope }] : [];
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGuidelines: 0,
    totalAudits: 0,
    specialistsRegistered: 0,
    specialistsAssigned: 0,
    totalReferrals: 0,
    totalEmergencies: 0,
  });
  const [recentGuidelines, setRecentGuidelines] = useState<any[]>([]);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [recentReferrals, setRecentReferrals] = useState<any[]>([]);
  const [financialReports, setFinancialReports] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [guidelines, audits, specialists, referrals, emergencies, finReports] = await Promise.allSettled([
        getDocsAll('clinicalGuidelines', hf),
        getDocsAll('clinicalAudits', hf),
        getDocsAll('specialists', hf),
        getDocsAll('referralStatistics', hf),
        getDocsAll('emergencyReports', hf),
        getDocsAll('financialReports', hf),
      ]);

      const guidelinesData = guidelines.status === 'fulfilled' ? guidelines.value : [];
      const auditsData = audits.status === 'fulfilled' ? audits.value : [];
      const specialistsData = specialists.status === 'fulfilled' ? specialists.value : [];
      const referralsData = referrals.status === 'fulfilled' ? referrals.value : [];
      const emergenciesData = emergencies.status === 'fulfilled' ? emergencies.value : [];
      const finReportsData = finReports.status === 'fulfilled' ? finReports.value : [];

      const assignedCount = specialistsData.filter((s: any) => s.hospital_id).length;

      setStats({
        totalGuidelines: guidelinesData.length,
        totalAudits: auditsData.length,
        specialistsRegistered: specialistsData.length,
        specialistsAssigned: assignedCount,
        totalReferrals: referralsData.length,
        totalEmergencies: emergenciesData.length,
      });

      setRecentGuidelines(
        guidelinesData
          .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
          .slice(0, 5)
      );
      setRecentAudits(
        auditsData
          .sort((a: any, b: any) => new Date(b.audit_date || 0).getTime() - new Date(a.audit_date || 0).getTime())
          .slice(0, 5)
      );
      setRecentReferrals(
        referralsData
          .sort((a: any, b: any) => new Date(b.reporting_period || 0).getTime() - new Date(a.reporting_period || 0).getTime())
          .slice(0, 5)
      );
      setFinancialReports(
        finReportsData
          .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
          .slice(0, 5)
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #022c22 0%, #064e3b 40%, #0d7667 100%)' }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-emerald-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0H0v40' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")` }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-emerald-200/80 text-sm mb-2">
            <HeartPulse size={14} />
            <span>Dashboard</span>
            <span className="text-emerald-500/50">/</span>
            <span className="text-white font-medium">Medical Services</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Medical Services Dashboard</h1>
          <p className="mt-1.5 text-emerald-100/60 text-sm max-w-xl">Clinical oversight, specialist deployment, and emergency preparedness monitoring</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Clinical Guidelines" value={stats.totalGuidelines} icon={BookOpen} color="primary" subtitle="Published guidelines" delay={0} />
        <StatCard title="Clinical Audits" value={stats.totalAudits} icon={ClipboardList} color="blue" subtitle="Total audits" delay={50} />
        <StatCard title="Specialists Registered" value={stats.specialistsRegistered} icon={Users} color="purple" subtitle="On record" delay={100} />
        <StatCard title="Specialists Assigned" value={stats.specialistsAssigned} icon={Stethoscope} color="teal" subtitle="Deployed to hospitals" delay={150} />
        <StatCard title="Referral Reports" value={stats.totalReferrals} icon={ArrowRight} color="orange" subtitle="Total reports" delay={200} />
        <StatCard title="Emergency Reports" value={stats.totalEmergencies} icon={AlertTriangle} color="rose" subtitle="Total incidents" delay={250} />
      </div>

      {/* Lists + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card border-t-2 border-t-primary-400 shadow-sm hover:shadow-md transition-shadow">
          <div className="card-header bg-gradient-to-r from-emerald-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <BookOpen size={16} className="text-emerald-600" />
              Recent Clinical Guidelines
            </h3>
            <Link to="/clinical-guidelines" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition-colors">
              View All <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="p-4">
            {recentGuidelines.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No guidelines yet.</p>
            ) : (
              <div className="space-y-2">
                {recentGuidelines.map((g: any) => (
                  <div key={g.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-50 to-transparent hover:from-emerald-50 hover:to-transparent transition-all duration-200 border border-transparent hover:border-emerald-100">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{g.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{g.code || 'N/A'}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ml-3 ${
                      g.status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' :
                      'bg-slate-50 text-slate-500 ring-1 ring-slate-400/20'
                    }`}>{g.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card border-t-2 border-t-amber-400 shadow-sm hover:shadow-md transition-shadow">
          <div className="card-header bg-gradient-to-r from-amber-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <ClipboardList size={16} className="text-amber-500" />
              Recent Clinical Audits
            </h3>
            <Link to="/clinical-audits" className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 transition-colors">
              View All <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="p-4">
            {recentAudits.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No audits yet.</p>
            ) : (
              <div className="space-y-2">
                {recentAudits.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-50 to-transparent hover:from-amber-50 hover:to-transparent transition-all duration-200 border border-transparent hover:border-amber-100">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{a.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{a.audit_date}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ml-3 ${
                      a.status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' :
                      'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20'
                    }`}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card border-t-2 border-t-orange-400 shadow-sm hover:shadow-md transition-shadow">
          <div className="card-header bg-gradient-to-r from-orange-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <ArrowRight size={16} className="text-orange-500" />
              Recent Referral Reports
            </h3>
            <Link to="/referral-reports" className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 transition-colors">
              View All <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="p-4">
            {recentReferrals.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No referral reports yet.</p>
            ) : (
              <div className="space-y-2">
                {recentReferrals.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-50 to-transparent hover:from-orange-50 hover:to-transparent transition-all duration-200 border border-transparent hover:border-orange-100">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{r.incident_type || 'Referral'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{r.hospital_name || r.hospital_id} &middot; {r.reporting_period}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-700 tabular-nums ml-3">{r.referral_count || 0}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card border-t-2 border-t-sky-400 shadow-sm hover:shadow-md transition-shadow">
          <div className="card-header bg-gradient-to-r from-sky-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Layers size={16} className="text-sky-500" />
              Quick Actions
            </h3>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <Link to="/clinical-guidelines" className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-br from-teal-50 to-teal-50/50 border border-teal-100 hover:border-teal-200 hover:shadow-md transition-all duration-200 group">
              <div className="p-2 rounded-lg bg-teal-100 group-hover:scale-110 transition-transform">
                <BookOpen size={18} className="text-teal-600" />
              </div>
              <span className="text-sm font-semibold text-teal-700">Guidelines</span>
            </Link>
            <Link to="/clinical-audits" className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-br from-amber-50 to-amber-50/50 border border-amber-100 hover:border-amber-200 hover:shadow-md transition-all duration-200 group">
              <div className="p-2 rounded-lg bg-amber-100 group-hover:scale-110 transition-transform">
                <ClipboardList size={18} className="text-amber-600" />
              </div>
              <span className="text-sm font-semibold text-amber-700">Audits</span>
            </Link>
            <Link to="/specialists" className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-br from-sky-50 to-sky-50/50 border border-sky-100 hover:border-sky-200 hover:shadow-md transition-all duration-200 group">
              <div className="p-2 rounded-lg bg-sky-100 group-hover:scale-110 transition-transform">
                <Stethoscope size={18} className="text-sky-600" />
              </div>
              <span className="text-sm font-semibold text-sky-700">Specialists</span>
            </Link>
            <Link to="/referral-reports" className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-br from-orange-50 to-orange-50/50 border border-orange-100 hover:border-orange-200 hover:shadow-md transition-all duration-200 group">
              <div className="p-2 rounded-lg bg-orange-100 group-hover:scale-110 transition-transform">
                <ArrowRight size={18} className="text-orange-600" />
              </div>
              <span className="text-sm font-semibold text-orange-700">Referrals</span>
            </Link>
            <Link to="/emergency-reports" className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-br from-red-50 to-red-50/50 border border-red-100 hover:border-red-200 hover:shadow-md transition-all duration-200 group col-span-2">
              <div className="p-2 rounded-lg bg-red-100 group-hover:scale-110 transition-transform">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <span className="text-sm font-semibold text-red-700">Emergency Reports</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Department Financial Reports (Read-only) */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-300 to-emerald-300" />
          <span className="text-[10px] uppercase tracking-[0.15em] text-emerald-600 font-semibold flex items-center gap-1.5">
            <DollarSign size={12} /> Department Financial Reports
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-emerald-300 via-emerald-300 to-transparent" />
        </div>
      </div>
      <div className="card border-t-2 border-t-emerald-400 shadow-sm">
        <div className="card-header bg-gradient-to-r from-emerald-50/50 to-transparent">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-600" />
            Recent Financial Reports
          </h3>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Read-only</span>
        </div>
        <div className="p-4">
          {financialReports.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No financial reports available.</p>
          ) : (
            <div className="space-y-2">
              {financialReports.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-50 to-transparent hover:from-emerald-50 hover:to-transparent transition-all border border-transparent hover:border-emerald-100">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{r.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{r.period} &middot; <span className="capitalize">{r.type}</span></p>
                  </div>
                  {r.total_revenue !== undefined && (
                    <div className="text-right text-xs ml-4 flex-shrink-0">
                      <p className="font-semibold text-teal-700 tabular-nums">₦{(r.total_revenue || 0).toLocaleString()}</p>
                      <p className="text-slate-400">Revenue</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
