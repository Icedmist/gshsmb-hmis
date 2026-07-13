import { useState, useEffect } from 'react';
import { getDocsAll } from '../lib/firestore';
import { Pill, HeartPulse, Users, ClipboardCheck, AlertTriangle, ShieldCheck } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { useAuth } from '../contexts/AuthContext';

export default function PharmaceuticalDashboardPage() {
  const { hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMedicines: 0,
    totalEssentialMedicines: 0,
    totalWorkforce: 0,
    totalAudits: 0,
    totalPharmacovigilance: 0,
    totalQualityReports: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [medicines, essential, workforce, audits, pharmacovigilance, quality] = await Promise.all([
        getDocsAll('medicines'),
        getDocsAll('essentialMedicines'),
        getDocsAll('pharmaceuticalWorkforce'),
        getDocsAll('pharmaceuticalAudits'),
        getDocsAll('pharmacovigilanceReports'),
        getDocsAll('pharmaceuticalQualityReports'),
      ]);
      setStats({
        totalMedicines: medicines.length,
        totalEssentialMedicines: essential.length,
        totalWorkforce: workforce.length,
        totalAudits: audits.length,
        totalPharmacovigilance: pharmacovigilance.length,
        totalQualityReports: quality.length,
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
          <Pill size={14} className="text-[#008751]" />
          <span>Dashboard</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-medium">Pharmaceutical Services</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Pharmaceutical Services Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">Overview of pharmaceutical services, medicines, workforce, and reports</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Medicines" value={stats.totalMedicines} icon={Pill} color="primary" subtitle="Medicine registry" />
        <StatCard title="Essential Medicines" value={stats.totalEssentialMedicines} icon={HeartPulse} color="teal" subtitle="Essential medicines list" />
        <StatCard title="Pharmaceutical Workforce" value={stats.totalWorkforce} icon={Users} color="blue" subtitle="Workforce records" />
        <StatCard title="Pharmaceutical Audits" value={stats.totalAudits} icon={ClipboardCheck} color="army" subtitle="Audit records" />
        <StatCard title="Pharmacovigilance Reports" value={stats.totalPharmacovigilance} icon={AlertTriangle} color="orange" subtitle="Adverse effect reports" />
        <StatCard title="Quality Assurance Reports" value={stats.totalQualityReports} icon={ShieldCheck} color="purple" subtitle="Quality reports" />
      </div>
    </div>
  );
}
