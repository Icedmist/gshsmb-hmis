import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDocsAll, type FilterConstraint } from '../lib/firestore';
import { getNursingWorkforceSummary } from '../lib/nursingWorkforce';
import { getHospitalScope } from '../lib/scope';
import { useAuth } from '../contexts/AuthContext';
import StatCard from '../components/common/StatCard';
import { Heart, Users, FileText, GraduationCap, Award, AlertTriangle, Building2, ClipboardCheck, Clock, CheckCircle, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function NursingDashboardPage() {
  const { user } = useAuth();
  const hospitalScope = getHospitalScope(user);
  const hf: FilterConstraint[] = hospitalScope ? [{ field: 'hospital_id', op: '==', value: hospitalScope }] : [];
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

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [summary, audits, programs, certs] = await Promise.all([
        getNursingWorkforceSummary(hospitalScope),
        getDocsAll('nursingAudits', hf, { field: 'audit_date', dir: 'desc' }),
        getDocsAll('trainingPrograms', hf, { field: 'start_date', dir: 'desc' }),
        getDocsAll('certifications', hf, { field: 'issue_date', dir: 'desc' }),
      ]);

      const totalNurses = summary.reduce((sum: number, s: any) => sum + (s.total_nurses || 0), 0);
      const totalVacancies = summary.reduce((sum: number, s: any) => sum + (s.total_vacancies || 0), 0);

      const gapRecords = await getDocsAll('nursingWorkforce', hf, { field: 'reporting_period', dir: 'desc' });
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

  useEffect(() => {
    loadDashboard();
  }, []);

  const tooltipStyle = {
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(8px)',
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
        style={{ background: 'linear-gradient(135deg, #1a0a1a 0%, #3b1a3b 40%, #6b2157 100%)' }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-rose-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0H0v40' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")` }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-rose-200/80 text-sm mb-2">
            <Heart size={14} />
            <span>Dashboard</span>
            <span className="text-rose-500/50">/</span>
            <span className="text-white font-medium">Nursing Services</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Nursing Services Dashboard</h1>
          <p className="mt-1.5 text-rose-100/60 text-sm max-w-xl">Nursing workforce monitoring, training oversight, and quality assurance</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Nurses" value={stats.totalNurses} icon={Users} color="primary" subtitle="Across all hospitals" delay={0} />
        <StatCard title="Staffing Vacancies" value={stats.totalVacancies} icon={AlertTriangle} color="rose" subtitle="Unfilled positions" trend={stats.totalVacancies > 0 ? 'down' : undefined} trendValue={stats.totalVacancies > 0 ? 'Attention needed' : 'Fully staffed'} delay={50} />
        <StatCard title="Nursing Audits" value={stats.totalAudits} icon={FileText} color="blue" subtitle="Total records" delay={100} />
        <StatCard title="Training Programmes" value={stats.totalPrograms} icon={GraduationCap} color="purple" subtitle="Total programmes" delay={150} />
        <StatCard title="Certifications" value={stats.totalCertifications} icon={Award} color="teal" subtitle="Total certifications" delay={200} />
        <StatCard title="Hospitals Covered" value={stats.hospitals} icon={Building2} color="army" subtitle="With workforce data" delay={250} />
      </div>

      {/* Charts + Staffing Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card border-t-2 border-t-emerald-400 shadow-sm hover:shadow-md transition-shadow">
          <div className="card-header bg-gradient-to-r from-emerald-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Users size={16} className="text-emerald-600" />
              Workforce Distribution by Hospital
            </h3>
          </div>
          <div className="p-4">
            {workforceByHospital.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No workforce data recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workforceByHospital}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} angle={-20} textAnchor="end" height={60} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0,135,81,0.04)' }} />
                  <Bar dataKey="nurses" name="Nurses" fill="#008751" radius={[6, 6, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="vacancies" name="Vacancies" fill="#e11d48" radius={[6, 6, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card border-t-2 border-t-orange-400 shadow-sm hover:shadow-md transition-shadow">
          <div className="card-header bg-gradient-to-r from-orange-50/50 to-transparent">
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
                  <div key={r.id} className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/60 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-slate-800">{r.hospital_name || r.hospital_id}</p>
                      <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full">{r.reporting_period}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{r.staffing_gaps}</p>
                    <div className="flex gap-4 mt-3">
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">{r.nurse_count || 0} nurses</span>
                      <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">{r.vacancies || 0} vacancies</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Audits */}
        <div className="card border-t-2 border-t-indigo-400 shadow-sm hover:shadow-md transition-shadow">
          <div className="card-header bg-gradient-to-r from-indigo-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <ClipboardCheck size={16} className="text-indigo-500" />
              Recent Nursing Audits
            </h3>
            <Link to="/nursing-audits" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors">
              View All <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="p-4">
            {recentAudits.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No audits yet.</p>
            ) : (
              <div className="space-y-2">
                {recentAudits.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-50 to-transparent hover:from-indigo-50 hover:to-transparent transition-all duration-200 border border-transparent hover:border-indigo-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg ${a.status === 'completed' || a.status === 'active' ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                        {a.status === 'completed' || a.status === 'active' ? <CheckCircle size={14} className="text-emerald-600" /> : <Clock size={14} className="text-orange-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{a.audit_name || a.supervisor_name || 'Audit'}</p>
                        <p className="text-xs text-slate-400">{a.hospital_name || 'N/A'}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ml-3 ${
                      a.status === 'completed' || a.status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' :
                      'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20'
                    }`}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Training Programs */}
        <div className="card border-t-2 border-t-violet-400 shadow-sm hover:shadow-md transition-shadow">
          <div className="card-header bg-gradient-to-r from-violet-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <GraduationCap size={16} className="text-violet-500" />
              Recent Training Programmes
            </h3>
            <Link to="/nursing-training" className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1 transition-colors">
              View All <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="p-4">
            {recentPrograms.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No training programmes yet.</p>
            ) : (
              <div className="space-y-2">
                {recentPrograms.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-50 to-transparent hover:from-violet-50 hover:to-transparent transition-all duration-200 border border-transparent hover:border-violet-100">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{p.start_date} &mdash; {p.end_date}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <span className="text-sm font-bold text-slate-700 tabular-nums">{p.participants || 0}</span>
                      <p className="text-[10px] text-slate-400">participants</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Certifications */}
      <div className="card border-t-2 border-t-army-400 shadow-sm hover:shadow-md transition-shadow">
        <div className="card-header bg-gradient-to-r from-army-50/50 to-transparent">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Award size={16} className="text-army-500" />
            Recent Certifications
          </h3>
          <Link to="/nursing-training?tab=certifications" className="text-xs text-army-600 hover:text-army-700 font-medium flex items-center gap-1 transition-colors">
            View All <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="p-5">
          {recentCerts.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No certifications yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentCerts.map((c: any) => (
                <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 hover:border-army-200 hover:shadow-md transition-all duration-200 group">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-army-50 to-army-100 group-hover:scale-110 transition-transform">
                    <Award size={20} className="text-army-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{c.certification_name}</p>
                    <p className="text-xs text-slate-500 truncate">{c.employee_name || c.employee_id}</p>
                    <p className="text-xs text-slate-400 truncate">{c.issuing_body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
