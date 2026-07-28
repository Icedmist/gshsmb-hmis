import { useState, useEffect } from 'react';
import { Briefcase, ChevronDown, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getLocumAssignments, getLocumHistory } from '../lib/locums';
import { getHospitalScope } from '../lib/scope';
import Pagination from '../components/common/Pagination';
import type { LocumAssignment } from '../types';

const STATUS_BADGES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  completed: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  expired: 'bg-slate-50 text-slate-600 ring-1 ring-slate-400/20',
};

export default function LocumAssignmentsPage() {
  const { user } = useAuth();
  const hospitalScope = getHospitalScope(user);
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [items, setItems] = useState<LocumAssignment[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [histPagination, setHistPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const loadItems = async (page = 1) => {
    setLoading(true);
    try {
      const status = tab === 'active' ? statusFilter || 'active' : 'completed';
      const { data, total } = await getLocumAssignments(page, 50, status, hospitalScope);
      setItems(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
      if (tab === 'history') {
        const h = await getLocumHistory(undefined, page, 50);
        setHistPagination({ page, limit: 50, total: h.total, totalPages: Math.ceil(h.total / 50) });
      }
    } finally { setLoading(false); }
  };

// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadItems(); }, [tab, statusFilter, hospitalScope, loadItems]);

  const formatDate = (d: any) => {
    if (!d) return '—';
    if (d?.toDate) return d.toDate().toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
    if (typeof d === 'string') return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
    return '—';
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #6d28d9 100%)' }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-violet-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0H0v40' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")` }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-violet-200/80 text-sm mb-2">
            <Briefcase size={14} />
            <span>HR</span>
            <span className="text-violet-500/50">/</span>
            <span className="text-white font-medium">Locum Assignments</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Locum Assignments</h1>
          <p className="mt-1.5 text-violet-100/60 text-sm max-w-xl">Active and completed temporary deployments across hospitals</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button onClick={() => { setTab('active'); setStatusFilter(''); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Briefcase size={15} className={tab === 'active' ? 'text-emerald-500' : 'text-slate-400'} /> Active
        </button>
        <button onClick={() => { setTab('history'); setStatusFilter(''); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Clock size={15} className={tab === 'history' ? 'text-violet-500' : 'text-slate-400'} /> Completed History
        </button>
      </div>

      {/* Table */}
      <div className="card border-t-2 border-t-violet-400 shadow-sm">
        <div className="card-header bg-gradient-to-r from-violet-50/50 to-transparent">
          <div className="relative">
            <select className="input w-44 appearance-none text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">{tab === 'active' ? 'All Active' : 'All Status'}</option>
              <option value="active">Active</option><option value="completed">Completed</option><option value="expired">Expired</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="p-4 rounded-2xl bg-slate-50 mb-4">
                <Briefcase size={40} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium">No {tab} assignments.</p>
              <p className="text-xs text-slate-300 mt-1">{tab === 'active' ? 'Approved locum requests will appear here.' : 'Completed assignments will appear here.'}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Staff ID</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">From</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">To</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Period</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a, i) => (
                  <tr key={a.id} className={`border-b border-slate-50 hover:bg-gradient-to-r hover:from-violet-50/40 hover:to-transparent transition-all duration-200 ${i === items.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                          {a.employee_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{a.employee_name}</p>
                          <p className="text-[11px] text-slate-400">{a.department || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-mono text-slate-500">{a.staff_id || '—'}</td>
                    <td className="px-5 py-4 text-slate-600">{a.source_hospital_name}</td>
                    <td className="px-5 py-4 text-slate-600">{a.destination_hospital_name}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar size={11} className="text-slate-400" />
                        <span className="text-slate-600">
                          {formatDate(a.start_date)} → {formatDate(a.end_date)}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 ml-4">{a.duration_days} days</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_BADGES[a.status] || ''}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          a.status === 'active' ? 'bg-emerald-500' :
                          a.status === 'completed' ? 'bg-blue-500' : 'bg-slate-400'
                        }`} />
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={tab === 'active' ? pagination.page : histPagination.page} totalPages={tab === 'active' ? pagination.totalPages : histPagination.totalPages} onPageChange={loadItems} />
      </div>
    </div>
  );
}
