import { useState, useEffect } from 'react';
import { EmployeeTransfer, Pagination as PaginationType } from '../types';
import { getTransfers, approveTransfer, rejectTransfer } from '../lib/transfers';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { getHospitalScope } from '../lib/scope';
import { ArrowRightLeft, Search, Check, X, Clock, UserCheck, Ban } from 'lucide-react';
import StatCard from '../components/common/StatCard';

const STATUS_COLORS: Record<string, string> = {
  pending: 'badge-pending',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
};

export default function TransfersPage() {
  const { user, hasRole } = useAuth();
  const canApprove = hasRole('super_admin', 'hr_officer', 'director_hr');
  const [transfers, setTransfers] = useState<EmployeeTransfer[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const hospitalScope = getHospitalScope(user);

  const loadTransfers = async (page = 1) => {
    setLoading(true);
    try {
      const result = await getTransfers(page, 50, search || undefined, statusFilter || undefined, hospitalScope);
      setTransfers(result.data);
      setPagination({ page, limit: 50, total: result.total, totalPages: Math.ceil(result.total / 50) });
    } finally {
      setLoading(false);
    }
  };

// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadTransfers(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadTransfers(); };

  const handleApprove = async (t: EmployeeTransfer) => {
    if (!confirm(`Approve transfer of ${t.employee_name}?`)) return;
    try {
      await approveTransfer(t.id, user!.id);
      loadTransfers(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleReject = async (t: EmployeeTransfer) => {
    if (!confirm(`Reject transfer of ${t.employee_name}?`)) return;
    try {
      await rejectTransfer(t.id, user!.id);
      loadTransfers(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <ArrowRightLeft size={14} className="text-[#008751]" />
            <span>Records</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Staff Transfers</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Transfer Management</h1>
          <p className="text-slate-500 mt-1 text-sm">Track and manage employee transfer requests</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Transfers" value={pagination.total} icon={ArrowRightLeft} color="primary" subtitle="All transfer records" />
        <StatCard title="Pending" value={transfers.filter(t => t.status === 'pending').length} icon={Clock} color="blue" subtitle="Awaiting approval" />
        <StatCard title="Approved" value={transfers.filter(t => t.status === 'approved').length} icon={UserCheck} color="teal" subtitle="Completed transfers" />
        <StatCard title="Rejected" value={transfers.filter(t => t.status === 'rejected').length} icon={Ban} color="army" subtitle="Declined requests" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search by employee name or staff ID..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input w-36" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); }}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button type="submit" className="btn-secondary">Search</button>
          </form>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-12">
              <ArrowRightLeft size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No transfers found.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">From</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">To</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Requested By</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{t.employee_name}</p>
                      <p className="text-xs text-slate-500 font-mono">{t.staff_id}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{t.from_hospital}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{t.to_hospital}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(t.transfer_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[t.status] || ''}`}>
                        {t.status === 'pending' && <Clock size={12} />}
                        {t.status === 'approved' && <Check size={12} />}
                        {t.status === 'rejected' && <X size={12} />}
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{t.created_by_name || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canApprove && t.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(t)} className="btn btn-sm bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg px-3 py-1.5 text-xs font-medium">
                              <Check size={14} /> Approve
                            </button>
                            <button onClick={() => handleReject(t)} className="btn btn-sm bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-lg px-3 py-1.5 text-xs font-medium">
                              <X size={14} /> Reject
                            </button>
                          </>
                        )}
                        {t.status !== 'pending' && (
                          <span className="text-xs text-slate-400">
                            {t.approved_by_name ? `by ${t.approved_by_name}` : '-'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadTransfers} />
      </div>
    </div>
  );
}
