import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/common/StatCard';
import { getFinanceDashboardStats } from '../lib/finance';
import { getAllHospitals } from '../lib/hospitals';
import { DollarSign, PiggyBank, TrendingUp, TrendingDown, Wallet, Landmark, Briefcase, Scale, FileText, BarChart3, RefreshCw } from 'lucide-react';

export default function FinanceDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [hospitalCount, setHospitalCount] = useState(0);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const [d, h] = await Promise.all([getFinanceDashboardStats(), getAllHospitals()]);
      setStats(d);
      setHospitalCount(h.length);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const secondsAgo = lastUpdated ? Math.floor((Date.now() - lastUpdated.getTime()) / 1000) : null;

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white rounded-2xl p-8 border border-slate-200/60 shadow-sm">
        <div className="h-5 bg-gradient-to-r from-slate-100 to-slate-50 rounded w-48 mb-3" />
        <div className="h-4 bg-gradient-to-r from-slate-100 to-slate-50 rounded w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
            <div className="h-4 bg-gradient-to-r from-slate-100 to-slate-50 rounded w-24 mb-3" />
            <div className="h-8 bg-gradient-to-r from-slate-100 to-slate-50 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #001a0f 0%, #022c22 30%, #064e3b 60%, #065f46 100%)' }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-emerald-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0H0v40' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")` }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-emerald-200/80 text-sm mb-2">
            <DollarSign size={14} />
            <span>Finance Dashboard</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Finance & Accounts Dashboard</h1>
          <p className="mt-1.5 text-emerald-100/60 text-sm max-w-xl">Budget planning, revenue monitoring, expenditure control, and financial oversight across all facilities</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Budgets" value={stats?.totalBudgets || 0} icon={PiggyBank} color="primary" subtitle="Annual budgets" delay={0} />
        <StatCard title="Total Revenue" value={stats?.totalRevenue || 0} icon={TrendingUp} color="teal" subtitle={stats ? `₦${(stats.totalRevenue / 1000000).toFixed(1)}M from ${stats.totalRevenueCount} records` : ''} delay={50} />
        <StatCard title="Total Expenditure" value={stats?.totalExpenditure || 0} icon={TrendingDown} color="orange" subtitle={stats ? `₦${(stats.totalExpenditure / 1000000).toFixed(1)}M` : ''} delay={100} />
        <StatCard title="Net Position" value={stats?.netPosition || 0} icon={DollarSign} color={stats?.netPosition >= 0 ? 'blue' : 'rose'} subtitle={stats ? `₦${(Math.abs(stats.netPosition) / 1000000).toFixed(1)}M ${stats.netPosition >= 0 ? 'surplus' : 'deficit'}` : ''} delay={150} />
        <StatCard title="Payroll Total" value={stats?.totalPayrollCount || 0} icon={Wallet} color="purple" subtitle={stats ? `₦${(stats.totalPayroll / 1000000).toFixed(1)}M` : ''} delay={200} />
        <StatCard title="Total Assets" value={stats?.totalAssets || 0} icon={Briefcase} color="lemon" subtitle={stats ? `₦${(stats.totalAssetValue / 1000000).toFixed(1)}M value` : ''} delay={250} />
        <StatCard title="Financial Reports" value={stats?.totalReports || 0} icon={FileText} color="blue" subtitle="Generated reports" delay={300} />
        <StatCard title="Compliance" value={stats?.totalCompliance || 0} icon={Scale} color="army" subtitle={`${stats?.openCompliance || 0} open items`} delay={350} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card border-t-2 border-t-emerald-400 shadow-sm">
          <div className="card-header bg-gradient-to-r from-emerald-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><PiggyBank size={16} className="text-emerald-600" /> Budget Performance</h3>
          </div>
          <div className="p-5">
            {stats ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-emerald-700 tabular-nums">₦{(stats.totalBudget / 1000000).toFixed(1)}M</p>
                  <p className="text-xs text-slate-500 mt-1">Total Approved Budget</p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-600">Utilization</span>
                    <span className="font-semibold text-slate-800">{stats.budgetUtilization}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-700"
                      style={{ width: `${Math.min(stats.budgetUtilization, 100)}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-emerald-50 rounded-xl text-center">
                    <p className="text-lg font-bold text-emerald-700 tabular-nums">₦{(stats.totalActualBudget / 1000000).toFixed(1)}M</p>
                    <p className="text-xs text-emerald-600">Actual Spent</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl text-center">
                    <p className="text-lg font-bold text-amber-700 tabular-nums">₦{((stats.totalBudget - stats.totalActualBudget) / 1000000).toFixed(1)}M</p>
                    <p className="text-xs text-amber-600">Remaining</p>
                  </div>
                </div>
              </div>
            ) : <p className="text-sm text-slate-400 text-center py-4">No budget data.</p>}
          </div>
        </div>

        <div className="card border-t-2 border-t-teal-400 shadow-sm">
          <div className="card-header bg-gradient-to-r from-teal-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><TrendingUp size={16} className="text-teal-600" /> Revenue vs Expenditure</h3>
          </div>
          <div className="p-5">
            {stats ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-8 py-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-teal-600 tabular-nums">₦{(stats.totalRevenue / 1000000).toFixed(1)}M</p>
                    <p className="text-xs text-slate-500 mt-1">Revenue</p>
                  </div>
                  <div className="text-2xl text-slate-300 font-light">vs</div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-orange-600 tabular-nums">₦{(stats.totalExpenditure / 1000000).toFixed(1)}M</p>
                    <p className="text-xs text-slate-500 mt-1">Expenditure</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-100 text-center">
                  <p className={`text-lg font-bold tabular-nums ${stats.netPosition >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {stats.netPosition >= 0 ? 'Surplus' : 'Deficit'}: ₦{(Math.abs(stats.netPosition) / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-slate-500">Net Financial Position</p>
                </div>
              </div>
            ) : <p className="text-sm text-slate-400 text-center py-4">No financial data.</p>}
          </div>
        </div>

        <div className="card border-t-2 border-t-amber-400 shadow-sm">
          <div className="card-header bg-gradient-to-r from-amber-50/50 to-transparent">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><BarChart3 size={16} className="text-amber-600" /> Quick Actions</h3>
          </div>
          <div className="p-4 grid grid-cols-2 gap-2.5">
            {[
              { label: 'Budgets', icon: PiggyBank, href: '/budget-management', color: 'bg-emerald-50', iconC: 'text-emerald-600' },
              { label: 'Revenue', icon: TrendingUp, href: '/revenue-management', color: 'bg-teal-50', iconC: 'text-teal-600' },
              { label: 'Expenditure', icon: TrendingDown, href: '/expenditure-management', color: 'bg-orange-50', iconC: 'text-orange-600' },
              { label: 'Payroll', icon: Wallet, href: '/payroll-monitoring', color: 'bg-violet-50', iconC: 'text-violet-600' },
              { label: 'Treasury', icon: Landmark, href: '/treasury-management', color: 'bg-indigo-50', iconC: 'text-indigo-600' },
              { label: 'Assets', icon: Briefcase, href: '/asset-management', color: 'bg-emerald-50', iconC: 'text-emerald-600' },
              { label: 'Compliance', icon: Scale, href: '/financial-compliance', color: 'bg-rose-50', iconC: 'text-rose-600' },
              { label: 'Reports', icon: FileText, href: '/financial-reports', color: 'bg-slate-50', iconC: 'text-slate-600' },
            ].map((a, i) => (
              <Link key={i} to={a.href}
                className="group flex flex-col items-center gap-2 p-3.5 rounded-xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                <div className={`p-2.5 rounded-xl ${a.color} transition-transform group-hover:scale-110`}>
                  <a.icon size={18} className={a.iconC} />
                </div>
                <span className="text-xs font-semibold text-slate-800">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-4 rounded-2xl bg-white border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><Landmark size={12} className="text-emerald-500" /> Finance Module</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="flex items-center gap-1.5">Overriding {hospitalCount} hospitals</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 tabular-nums font-medium">
            {lastUpdated ? `${secondsAgo! < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo! / 60)}m ago`}` : ''}
          </span>
          <button onClick={() => loadData()} disabled={isRefreshing}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-emerald-500' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
}
