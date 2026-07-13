import { useState, useEffect } from 'react';
import { getDocsAll } from '../lib/firestore';
import { Stethoscope, Users, FileText, GraduationCap, Award, AlertTriangle } from 'lucide-react';
import StatCard from '../components/common/StatCard';

export default function NursingDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalNurses: 0,
    totalVacancies: 0,
    totalAudits: 0,
    totalPrograms: 0,
    totalCertifications: 0,
    hospitals: 0,
  });
  const [workforceByHospital, setWorkforceByHospital] = useState<any[]>([]);
  const [recentPrograms, setRecentPrograms] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [workforce, audits, programs, certifications] = await Promise.all([
        getDocsAll('nursingWorkforce'),
        getDocsAll('nursingAudits', [{ field: 'status', op: '==', value: 'active' }]),
        getDocsAll('trainingPrograms', [{ field: 'status', op: '==', value: 'active' }]),
        getDocsAll('certifications', [{ field: 'status', op: '==', value: 'active' }]),
      ]);

      const totalNurses = workforce.reduce((sum: number, w: any) => sum + (w.nurse_count || 0), 0);
      const totalVacancies = workforce.reduce((sum: number, w: any) => sum + (w.vacancies || 0), 0);
      const uniqueHospitals = new Set(workforce.map((w: any) => w.hospital_id)).size;

      setStats({
        totalNurses,
        totalVacancies,
        totalAudits: audits.length,
        totalPrograms: programs.length,
        totalCertifications: certifications.length,
        hospitals: uniqueHospitals,
      });

      const byHospital = new Map<string, any>();
      for (const w of workforce) {
        if (!byHospital.has(w.hospital_id)) {
          byHospital.set(w.hospital_id, { hospital_name: w.hospital_name || 'Unknown', nurses: 0, vacancies: 0 });
        }
        const h = byHospital.get(w.hospital_id)!;
        h.nurses += w.nurse_count || 0;
        h.vacancies += w.vacancies || 0;
      }
      setWorkforceByHospital(Array.from(byHospital.values()).slice(0, 10));

      const sorted = programs.sort((a: any, b: any) => 
        new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime()
      );
      setRecentPrograms(sorted.slice(0, 5));
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
          <Stethoscope size={14} className="text-[#008751]" />
          <span>Dashboard</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-medium">Nursing Services</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Nursing Services Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">Nursing workforce monitoring, training oversight, and quality assurance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Nurses" value={stats.totalNurses} icon={Users} color="primary" subtitle="Across all hospitals" />
        <StatCard title="Vacancies" value={stats.totalVacancies} icon={AlertTriangle} color="orange" subtitle="Unfilled positions" />
        <StatCard title="Nursing Audits" value={stats.totalAudits} icon={FileText} color="teal" subtitle="Active audits" />
        <StatCard title="Training Programs" value={stats.totalPrograms} icon={GraduationCap} color="blue" subtitle="Active programs" />
        <StatCard title="Certifications" value={stats.totalCertifications} icon={Award} color="army" subtitle="Active certifications" />
        <StatCard title="Hospitals Covered" value={stats.hospitals} icon={Stethoscope} color="primary" subtitle="With nursing data" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Users size={16} className="text-[#008751]" />
              Nursing Workforce by Hospital
            </h3>
          </div>
          <div className="p-4">
            {workforceByHospital.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No workforce data recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {workforceByHospital.map((h: any) => (
                  <div key={h.hospital_name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{h.hospital_name}</p>
                      <p className="text-xs text-slate-400">{h.nurses} nurses</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-700">{h.vacancies} vacancies</p>
                      <p className="text-xs text-slate-400">
                        {Math.round((h.vacancies / (h.nurses + h.vacancies)) * 100) || 0}% gap
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <GraduationCap size={16} className="text-[#008751]" />
              Recent Training Programs
            </h3>
          </div>
          <div className="p-4">
            {recentPrograms.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No training programs yet.</p>
            ) : (
              <div className="space-y-3">
                {recentPrograms.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{p.title}</p>
                      <p className="text-xs text-slate-400">{p.start_date} &mdash; {p.end_date}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-600">{p.participants || 0} participants</span>
                    </div>
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
