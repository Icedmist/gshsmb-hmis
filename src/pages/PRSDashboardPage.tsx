import { useState, useEffect } from 'react';
import { getDocsAll } from '../lib/firestore';
import { BarChart3, Target, Building2, TrendingUp, Award, Activity } from 'lucide-react';
import StatCard from '../components/common/StatCard';

export default function PRSDashboardPage() {
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
        getDocsAll('kpis', [{ field: 'status', op: '==', value: 'active' }]),
        getDocsAll('hospitalScorecards'),
        getDocsAll('hospitalStatistics'),
        getDocsAll('researchProjects', [{ field: 'status', op: '==', value: 'active' }]),
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
      setTopKPIs(sorted.slice(0, 5));

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
        <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
          <BarChart3 size={14} className="text-[#008751]" />
          <span>Dashboard</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-medium">PRS</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Planning, Research & Statistics Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">KPI tracking, hospital performance monitoring, and research management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Active KPIs" value={stats.totalKPIs} icon={Target} color="primary" subtitle={`${stats.kpiRate}% achieved`} />
        <StatCard title="Scorecards" value={stats.totalScorecards} icon={Award} color="teal" subtitle="Hospital & department" />
        <StatCard title="Statistics Records" value={stats.totalStatistics} icon={Activity} color="blue" subtitle="Hospital metrics" />
        <StatCard title="Research Projects" value={stats.totalResearch} icon={TrendingUp} color="army" subtitle="Active projects" />
        <StatCard title="KPI Achievement Rate" value={stats.kpiRate} icon={BarChart3} color="primary" subtitle={`${stats.kpiAchieved}/${stats.totalKPIs} achieved`} />
        <StatCard title="Scorecards Generated" value={stats.totalScorecards} icon={Building2} color="blue" subtitle="Scorecard tracking" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Target size={16} className="text-[#008751]" />
              Top Performing KPIs
            </h3>
          </div>
          <div className="p-4">
            {topKPIs.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No KPIs configured yet.</p>
            ) : (
              <div className="space-y-3">
                {topKPIs.map((k: any) => (
                  <div key={k.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-800">{k.name}</span>
                      <span className="text-xs font-semibold text-slate-500">
                        {k.actual_value}/{k.target} {k.unit}
                      </span>
                    </div>
                    <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          k.actual_value >= k.target
                            ? 'bg-gradient-to-r from-[#008751] to-emerald-400'
                            : 'bg-gradient-to-r from-amber-400 to-orange-400'
                        }`}
                        style={{ width: `${Math.min((k.actual_value / k.target) * 100, 100)}%` }}
                      />
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
              <Award size={16} className="text-[#008751]" />
              Recent Hospital Scorecards
            </h3>
          </div>
          <div className="p-4">
            {recentScorecards.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No scorecards generated yet.</p>
            ) : (
              <div className="space-y-3">
                {recentScorecards.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{s.hospital_name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{s.period} &mdash; {s.type}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-700">
                        {s.total_score}/{s.max_score}
                      </span>
                      <p className="text-xs text-slate-400">
                        {s.max_score > 0 ? Math.round((s.total_score / s.max_score) * 100) : 0}%
                      </p>
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
