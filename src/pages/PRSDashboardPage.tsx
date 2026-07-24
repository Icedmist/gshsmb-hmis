import { useState, useEffect } from 'react';
import { getDocsAll, type FilterConstraint } from '../lib/firestore';
import { getHospitalScope } from '../lib/scope';
import { useAuth } from '../contexts/AuthContext';
import StatCard from '../components/common/StatCard';
import { BarChart3, Target, Building2, TrendingUp, Award, Activity } from 'lucide-react';

export default function PRSDashboardPage() {
  const { user } = useAuth();
  const hospitalScope = getHospitalScope(user);
  const hf: FilterConstraint[] = hospitalScope ? [{ field: 'hospital_id', op: '==', value: hospitalScope }] : [];
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalKPIs: 0,
    kpiAchieved: 0,
    kpiRate: 0,
    totalScorecards: 0,
    totalStatistics: 0,
    totalResearch: 0,
  });
  const [topKPIs, setTopKPIs] = useState<any[]>([]);
  const [recentScorecards, setRecentScorecards] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [kpis, scorecards, statistics, research] = await Promise.all([
        getDocsAll('kpis', [...hf, { field: 'status', op: '==', value: 'active' }]),
        getDocsAll('hospitalScorecards', hf),
        getDocsAll('hospitalStatistics', hf),
        getDocsAll('researchProjects', [...hf, { field: 'status', op: '==', value: 'active' }]),
      ]);

      setStats({
        totalKPIs: kpis.length,
        kpiAchieved: kpis.filter((k: any) => k.actual_value >= k.target).length,
        kpiRate: kpis.length > 0 ? Math.round((kpis.filter((k: any) => k.actual_value >= k.target).length / kpis.length) * 100) : 0,
        totalScorecards: scorecards.length,
        totalStatistics: statistics.length,
        totalResearch: research.length,
      });

      const sorted = kpis.sort((a: any, b: any) => (b.actual_value / b.target || 0) - (a.actual_value / a.target || 0));
      setTopKPIs(sorted.slice(0, 6));

      const sortedScorecards = scorecards.sort((a: any, b: any) =>
        new Date(b.period || 0).getTime() - new Date(a.period || 0).getTime()
      );
      setRecentScorecards(sortedScorecards.slice(0, 5));
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
        style={{ background: 'linear-gradient(135deg, #1a1a0a 0%, #3b3b1a 40%, #6b6b21 100%)' }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-amber-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0H0v40' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")` }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-amber-200/80 text-sm mb-2">
            <BarChart3 size={14} />
            <span>Dashboard</span>
            <span className="text-amber-500/50">/</span>
            <span className="text-white font-medium">PRS</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Planning, Research & Statistics Dashboard</h1>
          <p className="mt-1.5 text-amber-100/60 text-sm max-w-xl">KPI tracking, hospital performance monitoring, and research management</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Active KPIs" value={stats.totalKPIs} icon={Target} color="primary" subtitle={`${stats.kpiRate}% achieved`} delay={0} />
        <StatCard title="Scorecards" value={stats.totalScorecards} icon={Award} color="blue" subtitle="Hospital & department" delay={50} />
        <StatCard title="Statistics Records" value={stats.totalStatistics} icon={Activity} color="purple" subtitle="Hospital metrics" delay={100} />
        <StatCard title="Research Projects" value={stats.totalResearch} icon={TrendingUp} color="teal" subtitle="Active projects" delay={150} />
        <StatCard title="KPI Achievement Rate" value={stats.kpiRate} icon={BarChart3} color="lemon" subtitle={`${stats.kpiRate}% of KPIs achieved`} trend={stats.kpiRate >= 50 ? 'up' : 'down'} trendValue={`${stats.kpiRate}%`} delay={200} />
        <StatCard title="Scorecards Generated" value={stats.totalScorecards} icon={Building2} color="orange" subtitle="Scorecard tracking" delay={250} />
      </div>

      {/* KPIs + Scorecards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card border-t-2 border-t-emerald-400 shadow-sm hover:shadow-md transition-shadow">
          <div className="card-header bg-gradient-to-r from-emerald-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Target size={16} className="text-emerald-600" />
              Top Performing KPIs
            </h3>
          </div>
          <div className="p-5">
            {topKPIs.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No KPIs configured yet.</p>
            ) : (
              <div className="space-y-4">
                {topKPIs.map((k: any) => {
                  const pct = Math.min((k.actual_value / (k.target || 1)) * 100, 100);
                  const isAchieved = k.actual_value >= k.target;
                  return (
                    <div key={k.id} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-800 group-hover:text-emerald-700 transition-colors">{k.name}</span>
                        <span className="text-xs font-semibold text-slate-500 tabular-nums">
                          {k.actual_value}/{k.target} {k.unit}
                        </span>
                      </div>
                      <div className="relative">
                        <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${
                              isAchieved ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-amber-400 to-amber-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`absolute -top-5 right-0 text-[10px] font-bold ${isAchieved ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {Math.round(pct)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="card border-t-2 border-t-amber-400 shadow-sm hover:shadow-md transition-shadow">
          <div className="card-header bg-gradient-to-r from-amber-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Award size={16} className="text-amber-500" />
              Recent Hospital Scorecards
            </h3>
          </div>
          <div className="p-5">
            {recentScorecards.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No scorecards generated yet.</p>
            ) : (
              <div className="space-y-3">
                {recentScorecards.map((s: any) => {
                  const scorePct = s.max_score > 0 ? Math.round((s.total_score / s.max_score) * 100) : 0;
                  return (
                    <div key={s.id} className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-slate-50 to-transparent hover:from-amber-50 hover:to-transparent transition-all duration-200 border border-transparent hover:border-amber-100">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{s.hospital_name || 'Unknown'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{s.period} &mdash; {s.type}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-700 tabular-nums">
                            {s.total_score}/{s.max_score}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            scorePct >= 70 ? 'bg-emerald-50 text-emerald-700' :
                            scorePct >= 50 ? 'bg-amber-50 text-amber-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            {scorePct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Achievement Ring */}
      {stats.totalKPIs > 0 && (
        <div className="card border-t-2 border-t-primary-400 shadow-sm hover:shadow-md transition-shadow">
          <div className="card-header bg-gradient-to-r from-emerald-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Target size={16} className="text-emerald-600" />
              KPI Achievement Overview
            </h3>
          </div>
          <div className="p-6 flex flex-col lg:flex-row items-center gap-8">
            <div className="relative w-44 h-44 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                <circle cx="60" cy="60" r="54" fill="none" stroke="#008751" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - stats.kpiRate / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl font-bold text-slate-900 tabular-nums">{stats.kpiRate}%</p>
                  <p className="text-xs text-slate-400">Achievement</p>
                </div>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 text-center">
                <p className="text-2xl font-bold text-emerald-700 tabular-nums">{stats.kpiAchieved}</p>
                <p className="text-xs text-emerald-600 font-medium mt-1">Achieved</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 text-center">
                <p className="text-2xl font-bold text-amber-700 tabular-nums">{stats.totalKPIs - stats.kpiAchieved}</p>
                <p className="text-xs text-amber-600 font-medium mt-1">Not Achieved</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-100 text-center">
                <p className="text-2xl font-bold text-slate-700 tabular-nums">{stats.totalKPIs}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">Total KPIs</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
