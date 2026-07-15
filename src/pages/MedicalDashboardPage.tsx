import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDocsAll } from '../lib/firestore';
import { Activity, Stethoscope, Users, AlertTriangle, ArrowRight, Building2, ClipboardList, BookOpen } from 'lucide-react';
import StatCard from '../components/common/StatCard';

export default function MedicalDashboardPage() {
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

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [guidelines, audits, specialists, referrals, emergencies] = await Promise.allSettled([
        getDocsAll('clinicalGuidelines'),
        getDocsAll('clinicalAudits'),
        getDocsAll('specialists'),
        getDocsAll('referralStatistics'),
        getDocsAll('emergencyReports'),
      ]);

      const guidelinesData = guidelines.status === 'fulfilled' ? guidelines.value : [];
      const auditsData = audits.status === 'fulfilled' ? audits.value : [];
      const specialistsData = specialists.status === 'fulfilled' ? specialists.value : [];
      const referralsData = referrals.status === 'fulfilled' ? referrals.value : [];
      const emergenciesData = emergencies.status === 'fulfilled' ? emergencies.value : [];

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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
          <Activity size={14} className="text-[#008751]" />
          <span>Dashboard</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-medium">Medical Services</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Medical Services Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">Clinical oversight, specialist deployment, and emergency preparedness monitoring</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Clinical Guidelines" value={stats.totalGuidelines} icon={BookOpen} color="primary" subtitle="Total guidelines" />
        <StatCard title="Clinical Audits" value={stats.totalAudits} icon={ClipboardList} color="blue" subtitle="Total audits" />
        <StatCard title="Specialists Registered" value={stats.specialistsRegistered} icon={Users} color="teal" subtitle="On record" />
        <StatCard title="Specialists Assigned" value={stats.specialistsAssigned} icon={Stethoscope} color="purple" subtitle="Deployed to hospitals" />
        <StatCard title="Referral Reports" value={stats.totalReferrals} icon={ArrowRight} color="orange" subtitle="Total reports" />
        <StatCard title="Emergency Reports" value={stats.totalEmergencies} icon={AlertTriangle} color="lemon" subtitle="Total incidents" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <BookOpen size={16} className="text-[#008751]" />
              Recent Clinical Guidelines
            </h3>
            <Link to="/clinical-guidelines" className="text-xs text-teal-600 hover:opacity-80 font-medium">View All</Link>
          </div>
          <div className="p-4">
            {recentGuidelines.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No guidelines yet.</p>
            ) : (
              <div className="space-y-2">
                {recentGuidelines.map((g: any) => (
                  <div key={g.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{g.title}</p>
                      <p className="text-xs text-slate-400">{g.code || 'N/A'}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${g.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{g.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <ClipboardList size={16} className="text-amber-500" />
              Recent Clinical Audits
            </h3>
            <Link to="/clinical-audits" className="text-xs text-amber-600 hover:opacity-80 font-medium">View All</Link>
          </div>
          <div className="p-4">
            {recentAudits.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No audits yet.</p>
            ) : (
              <div className="space-y-2">
                {recentAudits.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{a.title}</p>
                      <p className="text-xs text-slate-400">{a.audit_date}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <ArrowRight size={16} className="text-orange-500" />
              Recent Referral Reports
            </h3>
            <Link to="/referral-reports" className="text-xs text-orange-600 hover:opacity-80 font-medium">View All</Link>
          </div>
          <div className="p-4">
            {recentReferrals.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No referral reports yet.</p>
            ) : (
              <div className="space-y-2">
                {recentReferrals.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{r.incident_type || 'Referral'}</p>
                      <p className="text-xs text-slate-400">{r.hospital_name || r.hospital_id} &middot; {r.reporting_period}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{r.referral_count || 0}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Building2 size={16} className="text-sky-500" />
              Quick Actions
            </h3>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <Link to="/clinical-guidelines" className="flex items-center gap-2 p-3 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors">
              <BookOpen size={18} className="text-teal-600" />
              <span className="text-sm font-medium text-teal-700">Guidelines</span>
            </Link>
            <Link to="/clinical-audits" className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
              <ClipboardList size={18} className="text-amber-600" />
              <span className="text-sm font-medium text-amber-700">Audits</span>
            </Link>
            <Link to="/specialists" className="flex items-center gap-2 p-3 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors">
              <Stethoscope size={18} className="text-sky-600" />
              <span className="text-sm font-medium text-sky-700">Specialists</span>
            </Link>
            <Link to="/referral-reports" className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
              <ArrowRight size={18} className="text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Referrals</span>
            </Link>
            <Link to="/emergency-reports" className="flex items-center gap-2 p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
              <AlertTriangle size={18} className="text-red-600" />
              <span className="text-sm font-medium text-red-700">Emergencies</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
