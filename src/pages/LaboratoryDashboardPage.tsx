import { useState, useEffect } from 'react';
import { getDocsAll } from '../lib/firestore';
import { Microscope, Wrench, Building2, Users, ClipboardCheck, Beaker, AlertTriangle } from 'lucide-react';
import StatCard from '../components/common/StatCard';

export default function LaboratoryDashboardPage() {
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

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [laboratories, equipment, maintenance, workforce, audits, reagents, surveillance] = await Promise.all([
        getDocsAll('laboratories'),
        getDocsAll('laboratoryEquipment'),
        getDocsAll('equipmentMaintenance'),
        getDocsAll('laboratoryWorkforce'),
        getDocsAll('laboratoryAudits'),
        getDocsAll('laboratoryReagents'),
        getDocsAll('diseaseSurveillanceReports'),
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
          <Microscope size={14} className="text-[#008751]" />
          <span>Dashboard</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-medium">Laboratory Services</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Laboratory Services Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">Laboratory infrastructure, equipment, workforce, and disease surveillance monitoring</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Laboratories" value={stats.totalLaboratories} icon={Microscope} color="primary" subtitle="Registered labs" />
        <StatCard title="Equipment Items" value={stats.totalEquipment} icon={Wrench} color="teal" subtitle="Registered equipment" />
        <StatCard title="Maintenance Records" value={stats.totalMaintenance} icon={Building2} color="blue" subtitle="All maintenance logs" />
        <StatCard title="Workforce Records" value={stats.totalWorkforce} icon={Users} color="purple" subtitle="Staffing entries" />
        <StatCard title="Laboratory Audits" value={stats.totalAudits} icon={ClipboardCheck} color="orange" subtitle="Audit records" />
        <StatCard title="Reagent Stocks" value={stats.totalReagents} icon={Beaker} color="army" subtitle="Reagent inventory items" />
        <StatCard title="Disease Reports" value={stats.totalSurveillance} icon={AlertTriangle} color="lemon" subtitle="Surveillance reports" />
      </div>
    </div>
  );
}
