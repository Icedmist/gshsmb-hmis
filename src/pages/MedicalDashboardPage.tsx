import { useState, useEffect } from 'react';
import { getDocsAll } from '../lib/firestore';
import { Activity, Stethoscope, Users, AlertTriangle, ArrowRight, Building2, FileText } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getClinicalAudits } from '../lib/clinicalAudits';

export default function MedicalDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAudits: 0,
    activeAudits: 0,
    totalSpecialists: 0,
    totalReferrals: 0,
    totalEmergencies: 0,
    totalHospitals: 0,
  });
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [specialistDistribution, setSpecialistDistribution] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [hospitals, specialists, referrals, emergencies] = await Promise.all([
        getDocsAll('hospitals', [{ field: 'status', op: '==', value: 'active' }]),
        getDocsAll('specialists', [{ field: 'status', op: '==', value: 'active' }]),
        getDocsAll('referralStatistics'),
        getDocsAll('emergencyReports', [{ field: 'status', op: '==', value: 'active' }]),
      ]);

      const { data: audits } = await getClinicalAudits(1, 5, undefined, undefined, undefined);
      const { data: activeAudits } = await getClinicalAudits(1, 1000, undefined, undefined, 'active');

      setStats({
        totalAudits: audits.length,
        activeAudits: activeAudits.length,
        totalSpecialists: specialists.length,
        totalReferrals: referrals.length,
        totalEmergencies: emergencies.length,
        totalHospitals: hospitals.length,
      });

      setRecentAudits(audits.slice(0, 5));

      const dist = await Promise.all(
        hospitals.slice(0, 10).map(async (h: any) => {
          const count = specialists.filter((s: any) => s.hospital_id === h.id).length;
          return { hospital_name: h.hospital_name, count };
        }),
      );
      setSpecialistDistribution(dist);
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
        <StatCard title="Clinical Audits" value={stats.totalAudits} icon={FileText} color="primary" subtitle={`${stats.activeAudits} active`} />
        <StatCard title="Active Specialists" value={stats.totalSpecialists} icon={Stethoscope} color="teal" subtitle="Across all hospitals" />
        <StatCard title="Referral Statistics" value={stats.totalReferrals} icon={ArrowRight} color="blue" subtitle="Total recorded" />
        <StatCard title="Emergency Reports" value={stats.totalEmergencies} icon={AlertTriangle} color="orange" subtitle="Active incidents" />
        <StatCard title="Hospitals" value={stats.totalHospitals} icon={Building2} color="army" subtitle="Active facilities" />
        <StatCard title="Specialist Coverage" value={specialistDistribution.filter(s => s.count > 0).length} icon={Users} color="primary" subtitle="Hospitals with specialists" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <FileText size={16} className="text-[#008751]" />
              Recent Clinical Audits
            </h3>
          </div>
          <div className="p-4">
            {recentAudits.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No audits recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {recentAudits.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{a.title}</p>
                      <p className="text-xs text-slate-400">{a.audit_date}</p>
                    </div>
                    <span className={a.status === 'active' ? 'badge-active' : 'badge-inactive'}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Building2 size={16} className="text-[#008751]" />
              Specialist Distribution by Hospital
            </h3>
          </div>
          <div className="p-4">
            {specialistDistribution.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No specialists deployed yet.</p>
            ) : (
              <div className="space-y-3">
                {specialistDistribution.map((s: any) => (
                  <div key={s.hospital_name} className="flex items-center gap-3">
                    <span className="text-sm text-slate-700 w-1/2 truncate">{s.hospital_name}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#008751] to-emerald-400 transition-all"
                        style={{ width: `${Math.min((s.count / Math.max(...specialistDistribution.map(x => x.count))) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-600 w-8 text-right">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
