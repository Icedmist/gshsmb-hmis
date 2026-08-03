import { useState, useEffect } from 'react';
import { getFinancialAnalytics, getFinanceDashboardStats } from '../lib/finance';
import { getAllHospitals } from '../lib/hospitals';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, PiggyBank, Building2 } from 'lucide-react';

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-3xl p-8 text-white shadow-[0_20px_40px_-15px_rgba(0,135,81,0.3)] bg-gradient-to-br from-[#004d2e] via-[#008751] to-[#00b36b]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 blur-3xl rounded-full mix-blend-overlay"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-emerald-100/90 text-sm mb-3">
            <BarChart3 size={16} />
            <span className="tracking-wide uppercase text-xs font-bold">Finance</span>
            <span className="opacity-50">/</span>
            <span className="text-white font-medium tracking-wide uppercase text-xs">Analytics</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-2">Financial Overview</h1>
          <p className="text-emerald-50/80 text-base max-w-xl font-medium leading-relaxed">
            Simplified financial performance metrics and budget utilization across all facilities.
          </p>
        </div>
      </div>

      {stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-50 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><PiggyBank size={64} /></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600"><PiggyBank size={20} /></div>
                <h3 className="font-semibold text-slate-700">Budget Utilized</h3>
              </div>
              <p className="text-3xl font-black text-slate-900 tracking-tight">{stats.budgetUtilization}%</p>
              <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${stats.budgetUtilization}%` }} /></div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-teal-50 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp size={64} /></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-2xl bg-teal-50 text-teal-600"><TrendingUp size={20} /></div>
                <h3 className="font-semibold text-slate-700">Total Revenue</h3>
              </div>
              <p className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">₦{(stats.totalRevenue / 1000000).toFixed(1)}M</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-50 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingDown size={64} /></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-2xl bg-orange-50 text-orange-600"><TrendingDown size={20} /></div>
                <h3 className="font-semibold text-slate-700">Total Expenses</h3>
              </div>
              <p className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">₦{(stats.totalExpenditure / 1000000).toFixed(1)}M</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-50 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><DollarSign size={64} /></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600"><DollarSign size={20} /></div>
                <h3 className="font-semibold text-slate-700">Net Position</h3>
              </div>
              <p className={`text-3xl font-black tracking-tight tabular-nums ${(stats.netPosition || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ₦{(Math.abs(stats.netPosition || 0) / 1000000).toFixed(1)}M
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><Building2 size={18} className="text-emerald-600" /> Operational Records Summary</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-sm text-slate-500 font-medium mb-1">Budgets</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalBudgets}</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-sm text-slate-500 font-medium mb-1">Revenue Entries</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalRevenueCount}</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-sm text-slate-500 font-medium mb-1">Expenses</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalExpenditureCount}</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-sm text-slate-500 font-medium mb-1">Payroll Logs</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalPayrollCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
