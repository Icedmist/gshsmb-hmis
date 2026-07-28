import { useState, useEffect } from 'react';
import { getFinancialAnalytics, getFinanceDashboardStats } from '../lib/finance';
import { getAllHospitals } from '../lib/hospitals';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, PiggyBank, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#008751', '#22c55e', '#6b7e36', '#84cc16', '#0d9488', '#14b8a6', '#65a30d'];
const tooltipStyle = { borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', padding: '10px 14px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' };

export default function FinancialAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const [s] = await Promise.all([getFinanceDashboardStats(), getAllHospitals(), getFinancialAnalytics()]);
      setStats(s);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-700 animate-spin" /></div>;

  const budgetData = [
    { name: 'Approved', value: stats?.totalBudget || 0 },
    { name: 'Actual', value: stats?.totalActualBudget || 0 },
    { name: 'Variance', value: Math.max(0, (stats?.totalBudget || 0) - (stats?.totalActualBudget || 0)) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #1a1a00 0%, #3b3b00 40%, #6b6b00 100%)' }}>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-amber-200/80 text-sm mb-2"><BarChart3 size={14} /><span>Finance</span><span className="text-amber-500/50">/</span><span className="text-white font-medium">Financial Analytics</span></div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Financial Analytics</h1>
          <p className="mt-1.5 text-amber-100/60 text-sm">Executive financial insights, trends, and performance dashboards</p>
        </div>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5 border-t-2 border-t-emerald-400">
              <div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-emerald-50"><PiggyBank size={18} className="text-emerald-600" /></div><div><p className="text-xs text-slate-500">Budget Utilization</p><p className="text-xl font-bold text-slate-800">{stats.budgetUtilization}%</p></div></div>
            </div>
            <div className="card p-5 border-t-2 border-t-teal-400">
              <div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-teal-50"><TrendingUp size={18} className="text-teal-600" /></div><div><p className="text-xs text-slate-500">Total Revenue</p><p className="text-xl font-bold text-slate-800 tabular-nums">₦{(stats.totalRevenue / 1000000).toFixed(1)}M</p></div></div>
            </div>
            <div className="card p-5 border-t-2 border-t-orange-400">
              <div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-orange-50"><TrendingDown size={18} className="text-orange-600" /></div><div><p className="text-xs text-slate-500">Total Expenditure</p><p className="text-xl font-bold text-slate-800 tabular-nums">₦{(stats.totalExpenditure / 1000000).toFixed(1)}M</p></div></div>
            </div>
            <div className="card p-5 border-t-2 border-t-amber-400">
              <div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-amber-50"><DollarSign size={18} className="text-amber-600" /></div><div><p className="text-xs text-slate-500">Net Position</p><p className={`text-xl font-bold tabular-nums ${(stats.netPosition || 0) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>₦{(Math.abs(stats.netPosition || 0) / 1000000).toFixed(1)}M</p></div></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card shadow-sm">
              <div className="card-header bg-gradient-to-r from-emerald-50/50 to-transparent">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2"><PiggyBank size={16} className="text-emerald-600" /> Budget Overview</h3>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={budgetData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={80}>
                      {budgetData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card shadow-sm">
              <div className="card-header bg-gradient-to-r from-teal-50/50 to-transparent">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2"><DollarSign size={16} className="text-teal-600" /> Revenue vs Expenditure</h3>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={[
                      { name: 'Revenue', value: Math.max(stats.totalRevenue, 1) },
                      { name: 'Expenditure', value: Math.max(stats.totalExpenditure, 1) },
                    ]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} stroke="none">
                      {[COLORS[0], COLORS[4]].map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 text-sm mt-2">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[0] }} /><span className="text-slate-600">Revenue</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[4] }} /><span className="text-slate-600">Expenditure</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-header bg-gradient-to-r from-amber-50/50 to-transparent">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Building2 size={16} className="text-amber-600" /> Financial Summary by Hospital</h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 text-center">
                  <p className="text-xs text-emerald-600 font-medium mb-1">Total Budgets</p>
                  <p className="text-2xl font-bold text-emerald-800">{stats.totalBudgets}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 text-center">
                  <p className="text-xs text-teal-600 font-medium mb-1">Revenue Records</p>
                  <p className="text-2xl font-bold text-teal-800">{stats.totalRevenueCount}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 text-center">
                  <p className="text-xs text-orange-600 font-medium mb-1">Expenditure Records</p>
                  <p className="text-2xl font-bold text-orange-800">{stats.totalExpenditureCount}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 text-center">
                  <p className="text-xs text-violet-600 font-medium mb-1">Payroll Reports</p>
                  <p className="text-2xl font-bold text-violet-800">{stats.totalPayrollCount}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
