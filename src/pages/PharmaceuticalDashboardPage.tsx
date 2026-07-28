import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDocsAll, type FilterConstraint } from '../lib/firestore';
import { getHospitalScope } from '../lib/scope';
import { Pill, HeartPulse, Users, ClipboardCheck, AlertTriangle, ShieldCheck, ArrowUpRight } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { useAuth } from '../contexts/AuthContext';

export default function PharmaceuticalDashboardPage() {
  const { user } = useAuth();
  const hospitalScope = getHospitalScope(user);
  const hf: FilterConstraint[] = hospitalScope ? [{ field: 'hospital_id', op: '==', value: hospitalScope }] : [];
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMedicines: 0,
    totalEssentialMedicines: 0,
    totalWorkforce: 0,
    totalAudits: 0,
    totalPharmacovigilance: 0,
    totalQualityReports: 0,
  });
  const [recentMedicines, setRecentMedicines] = useState<any[]>([]);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [medicines, essential, workforce, audits, pharmacovigilance, quality] = await Promise.all([
        getDocsAll('medicines', hf),
        getDocsAll('essentialMedicines', hf),
        getDocsAll('pharmaceuticalWorkforce', hf),
        getDocsAll('pharmaceuticalAudits', hf),
        getDocsAll('pharmacovigilanceReports', hf),
        getDocsAll('pharmaceuticalQualityReports', hf),
      ]);
      setStats({
        totalMedicines: medicines.length,
        totalEssentialMedicines: essential.length,
        totalWorkforce: workforce.length,
        totalAudits: audits.length,
        totalPharmacovigilance: pharmacovigilance.length,
        totalQualityReports: quality.length,
      });
      setRecentMedicines(
        (medicines as any[])
          .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
          .slice(0, 5)
      );
      setRecentAudits(
        (audits as any[])
          .sort((a: any, b: any) => new Date(b.audit_date || 0).getTime() - new Date(a.audit_date || 0).getTime())
          .slice(0, 5)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

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
        style={{ background: 'linear-gradient(135deg, #0a1a0a 0%, #1a3b1a 40%, #216b36 100%)' }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-emerald-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0H0v40' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")` }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-emerald-200/80 text-sm mb-2">
            <Pill size={14} />
            <span>Dashboard</span>
            <span className="text-emerald-500/50">/</span>
            <span className="text-white font-medium">Pharmaceutical Services</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Pharmaceutical Services Dashboard</h1>
          <p className="mt-1.5 text-emerald-100/60 text-sm max-w-xl">Overview of pharmaceutical services, medicines, workforce, and reports</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Medicines" value={stats.totalMedicines} icon={Pill} color="primary" subtitle="Medicine registry" delay={0} />
        <StatCard title="Essential Medicines" value={stats.totalEssentialMedicines} icon={HeartPulse} color="teal" subtitle="Essential medicines list" delay={50} />
        <StatCard title="Pharmaceutical Workforce" value={stats.totalWorkforce} icon={Users} color="blue" subtitle="Workforce records" delay={100} />
        <StatCard title="Pharmaceutical Audits" value={stats.totalAudits} icon={ClipboardCheck} color="army" subtitle="Audit records" delay={150} />
        <StatCard title="Pharmacovigilance Reports" value={stats.totalPharmacovigilance} icon={AlertTriangle} color="orange" subtitle="Adverse effect reports" delay={200} />
        <StatCard title="Quality Assurance Reports" value={stats.totalQualityReports} icon={ShieldCheck} color="purple" subtitle="Quality reports" delay={250} />
      </div>

      {/* Recent Medicines + Audits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card border-t-2 border-t-emerald-400 shadow-sm hover:shadow-md transition-shadow">
          <div className="card-header bg-gradient-to-r from-emerald-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Pill size={16} className="text-emerald-600" />
              Recently Added Medicines
            </h3>
            <Link to="/medicines" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition-colors">
              View All <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="p-4">
            {recentMedicines.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No medicines registered yet.</p>
            ) : (
              <div className="space-y-2">
                {recentMedicines.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-50 to-transparent hover:from-emerald-50 hover:to-transparent transition-all duration-200 border border-transparent hover:border-emerald-100">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{m.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{m.generic_name} &middot; {m.strength}</p>
                    </div>
                    <span className="text-xs font-medium text-slate-500 flex-shrink-0 ml-3 bg-slate-50 px-2.5 py-1 rounded-full">{m.dosage_form}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card border-t-2 border-t-amber-400 shadow-sm hover:shadow-md transition-shadow">
          <div className="card-header bg-gradient-to-r from-amber-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <ClipboardCheck size={16} className="text-amber-500" />
              Recent Pharmaceutical Audits
            </h3>
            <Link to="/pharmaceutical-audits" className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 transition-colors">
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
                      <p className="text-sm font-medium text-slate-800 truncate">{a.title || a.audit_name || 'Audit'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{a.audit_date || 'N/A'}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ml-3 ${
                      a.status === 'completed' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' :
                      a.status === 'active' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20' :
                      'bg-slate-50 text-slate-500 ring-1 ring-slate-400/20'
                    }`}>{a.status || 'N/A'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card border-t-2 border-t-blue-400 shadow-sm">
          <div className="card-header bg-gradient-to-r from-blue-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <HeartPulse size={16} className="text-blue-600" />
              Essential Medicines
            </h3>
          </div>
          <div className="p-5 text-center">
            <p className="text-4xl font-bold text-blue-700 tabular-nums">{stats.totalEssentialMedicines}</p>
            <p className="text-xs text-slate-500 mt-2">Medicines on the essential list</p>
          </div>
        </div>
        <div className="card border-t-2 border-t-orange-400 shadow-sm">
          <div className="card-header bg-gradient-to-r from-orange-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" />
              Pharmacovigilance
            </h3>
          </div>
          <div className="p-5 text-center">
            <p className="text-4xl font-bold text-orange-700 tabular-nums">{stats.totalPharmacovigilance}</p>
            <p className="text-xs text-slate-500 mt-2">Adverse drug reaction reports</p>
          </div>
        </div>
        <div className="card border-t-2 border-t-purple-400 shadow-sm">
          <div className="card-header bg-gradient-to-r from-purple-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={16} className="text-purple-600" />
              Quality Assurance
            </h3>
          </div>
          <div className="p-5 text-center">
            <p className="text-4xl font-bold text-purple-700 tabular-nums">{stats.totalQualityReports}</p>
            <p className="text-xs text-slate-500 mt-2">Quality assurance reports</p>
          </div>
        </div>
      </div>
    </div>
  );
}
