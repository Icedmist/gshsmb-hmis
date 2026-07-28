import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDocsAll, type FilterConstraint } from '../lib/firestore';
import { Microscope, Wrench, Building2, Users, ClipboardCheck, Beaker, AlertTriangle, ArrowUpRight, Activity } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { getHospitalScope } from '../lib/scope';

export default function LaboratoryDashboardPage() {
  const { user } = useAuth();
  const hospitalScope = getHospitalScope(user);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLaboratories: 0,
    totalEquipment: 0,
    totalMaintenance: 0,
    totalWorkforce: 0,
    totalAudits: 0,
    totalReagents: 0,
    totalSurveillance: 0,
  });
  const [recentEquipment, setRecentEquipment] = useState<any[]>([]);
  const [recentSurveillance, setRecentSurveillance] = useState<any[]>([]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const scopeFilter: FilterConstraint[] = hospitalScope ? [{ field: 'hospital_id', op: '==', value: hospitalScope }] : [];
      const [laboratories, equipment, maintenance, workforce, audits, reagents, surveillance] = await Promise.all([
        getDocsAll('laboratories', scopeFilter),
        getDocsAll('laboratoryEquipment', scopeFilter),
        getDocsAll('equipmentMaintenance', scopeFilter),
        getDocsAll('laboratoryWorkforce', scopeFilter),
        getDocsAll('laboratoryAudits', scopeFilter),
        getDocsAll('laboratoryReagents', scopeFilter),
        getDocsAll('diseaseSurveillanceReports', scopeFilter),
      ]);

      setStats({
        totalLaboratories: laboratories.length,
        totalEquipment: equipment.length,
        totalMaintenance: maintenance.length,
        totalWorkforce: workforce.length,
        totalAudits: audits.length,
        totalReagents: reagents.length,
        totalSurveillance: surveillance.length,
      });

      setRecentEquipment(
        (equipment as any[])
          .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
          .slice(0, 5)
      );
      setRecentSurveillance(
        (surveillance as any[])
          .sort((a: any, b: any) => new Date(b.reporting_period || 0).getTime() - new Date(a.reporting_period || 0).getTime())
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
        style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3b 40%, #21366b 100%)' }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-blue-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0H0v40' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")` }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-blue-200/80 text-sm mb-2">
            <Microscope size={14} />
            <span>Dashboard</span>
            <span className="text-blue-500/50">/</span>
            <span className="text-white font-medium">Laboratory Services</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Laboratory Services Dashboard</h1>
          <p className="mt-1.5 text-blue-100/60 text-sm max-w-xl">Laboratory infrastructure, equipment, workforce, and disease surveillance monitoring</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Laboratories" value={stats.totalLaboratories} icon={Microscope} color="primary" subtitle="Registered labs" delay={0} />
        <StatCard title="Equipment Items" value={stats.totalEquipment} icon={Wrench} color="teal" subtitle="Registered equipment" delay={50} />
        <StatCard title="Maintenance Records" value={stats.totalMaintenance} icon={Building2} color="blue" subtitle="All maintenance logs" delay={100} />
        <StatCard title="Workforce Records" value={stats.totalWorkforce} icon={Users} color="purple" subtitle="Staffing entries" delay={150} />
        <StatCard title="Laboratory Audits" value={stats.totalAudits} icon={ClipboardCheck} color="orange" subtitle="Audit records" delay={200} />
        <StatCard title="Reagent Stocks" value={stats.totalReagents} icon={Beaker} color="army" subtitle="Reagent inventory items" delay={250} />
        <StatCard title="Disease Reports" value={stats.totalSurveillance} icon={AlertTriangle} color="lemon" subtitle="Surveillance reports" delay={300} />
      </div>

      {/* Recent Equipment + Surveillance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card border-t-2 border-t-teal-400 shadow-sm hover:shadow-md transition-shadow">
          <div className="card-header bg-gradient-to-r from-teal-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Wrench size={16} className="text-teal-600" />
              Recent Lab Equipment
            </h3>
            <Link to="/lab-equipment" className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 transition-colors">
              View All <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="p-4">
            {recentEquipment.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No equipment registered yet.</p>
            ) : (
              <div className="space-y-2">
                {recentEquipment.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-50 to-transparent hover:from-teal-50 hover:to-transparent transition-all duration-200 border border-transparent hover:border-teal-100">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{e.equipment_name || e.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{e.model || e.type || 'N/A'}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ml-3 ${
                      e.status === 'functional' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' :
                      e.status === 'under_maintenance' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20' :
                      'bg-red-50 text-red-700 ring-1 ring-red-600/20'
                    }`}>{e.status || 'N/A'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card border-t-2 border-t-rose-400 shadow-sm hover:shadow-md transition-shadow">
          <div className="card-header bg-gradient-to-r from-rose-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Activity size={16} className="text-rose-500" />
              Disease Surveillance Reports
            </h3>
            <Link to="/disease-surveillance" className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 transition-colors">
              View All <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="p-4">
            {recentSurveillance.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No surveillance reports yet.</p>
            ) : (
              <div className="space-y-2">
                {recentSurveillance.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-50 to-transparent hover:from-rose-50 hover:to-transparent transition-all duration-200 border border-transparent hover:border-rose-100">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{s.disease_name || s.report_type || 'Surveillance'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.hospital_name || s.location || 'N/A'} &middot; {s.reporting_period || 'N/A'}</p>
                    </div>
                    {s.cases !== undefined && (
                      <span className="text-sm font-bold text-slate-700 tabular-nums ml-3">{s.cases}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card border-t-2 border-t-blue-400 shadow-sm">
          <div className="card-header bg-gradient-to-r from-blue-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Beaker size={16} className="text-blue-600" />
              Reagent Inventory
            </h3>
          </div>
          <div className="p-5 text-center">
            <p className="text-4xl font-bold text-blue-700 tabular-nums">{stats.totalReagents}</p>
            <p className="text-xs text-slate-500 mt-2">Reagent stock items</p>
          </div>
        </div>
        <div className="card border-t-2 border-t-orange-400 shadow-sm">
          <div className="card-header bg-gradient-to-r from-orange-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Wrench size={16} className="text-orange-500" />
              Maintenance
            </h3>
          </div>
          <div className="p-5 text-center">
            <p className="text-4xl font-bold text-orange-700 tabular-nums">{stats.totalMaintenance}</p>
            <p className="text-xs text-slate-500 mt-2">Equipment maintenance logs</p>
          </div>
        </div>
        <div className="card border-t-2 border-t-purple-400 shadow-sm">
          <div className="card-header bg-gradient-to-r from-purple-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <ClipboardCheck size={16} className="text-purple-600" />
              Audit Records
            </h3>
          </div>
          <div className="p-5 text-center">
            <p className="text-4xl font-bold text-purple-700 tabular-nums">{stats.totalAudits}</p>
            <p className="text-xs text-slate-500 mt-2">Laboratory audit records</p>
          </div>
        </div>
      </div>
    </div>
  );
}
