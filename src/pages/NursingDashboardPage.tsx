import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDocsAll } from '../lib/firestore';
import { getNursingWorkforceSummary } from '../lib/nursingWorkforce';
import { Heart, Users, FileText, GraduationCap, Award, AlertTriangle, Building2, ClipboardCheck, Clock, CheckCircle } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [recentPrograms, setRecentPrograms] = useState<any[]>([]);
  const [recentCerts, setRecentCerts] = useState<any[]>([]);
  const [staffingGaps, setStaffingGaps] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [summary, audits, programs, certs] = await Promise.all([
        getNursingWorkforceSummary(),
        getDocsAll('nursingAudits', [], { field: 'audit_date', dir: 'desc' }),
        getDocsAll('trainingPrograms', [], { field: 'start_date', dir: 'desc' }),
        getDocsAll('certifications', [], { field: 'issue_date', dir: 'desc' }),
      ]);

      const totalNurses = summary.reduce((sum: number, s: any) => sum + (s.total_nurses || 0), 0);
      const totalVacancies = summary.reduce((sum: number, s: any) => sum + (s.total_vacancies || 0), 0);

      const gapRecords = await getDocsAll('nursingWorkforce', [], { field: 'reporting_period', dir: 'desc' });
      const latestGaps = gapRecords.filter((r: any) => r.staffing_gaps).slice(0, 5);

      setStats({
        totalNurses,
        totalVacancies,
        totalAudits: audits.length,
        totalPrograms: programs.length,
        totalCertifications: certs.length,
        hospitals: summary.length,
      });

      setWorkforceByHospital(
        summary
          .map((s: any) => ({
            name: s.hospital_name,
            nurses: s.total_nurses || 0,
            vacancies: s.total_vacancies || 0,
          }))
          .sort((a: any, b: any) => b.nurses - a.nurses)
      );

      setRecentAudits(audits.slice(0, 5));
      setRecentPrograms(programs.slice(0, 5));
      setRecentCerts(certs.slice(0, 5));
      setStaffingGaps(latestGaps);
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
          <Heart size={14} className="text-[#008751]" />
          <span>Dashboard</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-medium">Nursing Services</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Nursing Services Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">Nursing workforce monitoring, training oversight, and quality assurance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Nurses" value={stats.totalNurses} icon={Users} color="primary" subtitle="Across all hospitals" />
        <StatCard title="Staffing Vacancies" value={stats.totalVacancies} icon={AlertTriangle} color="orange" subtitle="Unfilled positions" />
        <StatCard title="Nursing Audits" value={stats.totalAudits} icon={FileText} color="teal" subtitle="Total records" />
        <StatCard title="Training Programmes" value={stats.totalPrograms} icon={GraduationCap} color="blue" subtitle="Total programmes" />
        <StatCard title="Certifications" value={stats.totalCertifications} icon={Award} color="army" subtitle="Total certifications" />
        <StatCard title="Hospitals Covered" value={stats.hospitals} icon={Building2} color="primary" subtitle="With workforce data" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workforce Distribution Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Users size={16} className="text-[#008751]" />
              Workforce Distribution by Hospital
            </h3>
          </div>
          <div className="p-4">
            {workforceByHospital.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No workforce data recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workforceByHospital}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="nurses" name="Nurses" fill="#008751" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="vacancies" name="Vacancies" fill="#e11d48" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Staffing Gaps */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" />
              Staffing Gaps
            </h3>
          </div>
          <div className="p-4">
            {staffingGaps.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No staffing gaps recorded.</p>
            ) : (
              <div className="space-y-3">
                {staffingGaps.map((r: any) => (
                  <div key={r.id} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-800">{r.hospital_name || r.hospital_id}</p>
                      <span className="text-xs text-slate-500">{r.reporting_period}</span>
                    </div>
                    <p className="text-xs text-slate-600">{r.staffing_gaps}</p>
                    <div className="flex gap-3 mt-2 text-xs">
                      <span className="text-emerald-700 font-medium">{r.nurse_count || 0} nurses</span>
                      <span className="text-red-600 font-medium">{r.vacancies || 0} vacancies</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Audits */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <ClipboardCheck size={16} className="text-indigo-500" />
              Recent Nursing Audits
            </h3>
            <Link to="/nursing-audits" className="text-xs text-indigo-600 hover:opacity-80 font-medium">View All</Link>
          </div>
          <div className="p-4">
            {recentAudits.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No audits yet.</p>
            ) : (
              <div className="space-y-2">
                {recentAudits.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`p-1.5 rounded-lg ${a.status === 'completed' || a.status === 'active' ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                        {a.status === 'completed' || a.status === 'active' ? <CheckCircle size={14} className="text-emerald-600" /> : <Clock size={14} className="text-orange-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{a.audit_name || a.supervisor_name || 'Audit'}</p>
                        <p className="text-xs text-slate-400">{a.hospital_name || 'N/A'}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${a.status === 'completed' || a.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Training Programs */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <GraduationCap size={16} className="text-violet-500" />
              Recent Training Programmes
            </h3>
            <Link to="/nursing-training" className="text-xs text-violet-600 hover:opacity-80 font-medium">View All</Link>
          </div>
          <div className="p-4">
            {recentPrograms.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No training programmes yet.</p>
            ) : (
              <div className="space-y-2">
                {recentPrograms.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.title}</p>
                      <p className="text-xs text-slate-400">{p.start_date} &mdash; {p.end_date}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <span className="text-xs font-semibold text-slate-600">{p.participants || 0} participants</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Certifications */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Award size={16} className="text-army-500" />
              Recent Certifications
            </h3>
            <Link to="/nursing-training?tab=certifications" className="text-xs text-army-600 hover:opacity-80 font-medium">View All</Link>
          </div>
          <div className="p-4">
            {recentCerts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No certifications yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentCerts.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="p-2 bg-army-50 rounded-lg">
                      <Award size={16} className="text-army-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{c.certification_name}</p>
                      <p className="text-xs text-slate-400 truncate">{c.employee_name || c.employee_id}</p>
                      <p className="text-xs text-slate-400">{c.issuing_body}</p>
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
