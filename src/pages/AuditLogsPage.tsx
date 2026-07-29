import { useState, useEffect } from 'react';
import { getAuditLogs } from '../lib/audit';
import { AuditLog, Pagination as PaginationType } from '../types';
import Pagination from '../components/common/Pagination';
import { Search, ClipboardList, Shield } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadLogs = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getAuditLogs(page, 50, search || undefined);
      setLogs(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadLogs(); };

  const getActionBadge = (action: string) => {
    const colorMap: Record<string, string> = {
      LOGIN: 'bg-blue-50 text-blue-700',
      LOGOUT: 'bg-slate-50 text-slate-700',
      CREATE_HOSPITAL: 'bg-emerald-50 text-emerald-700',
      UPDATE_HOSPITAL: 'bg-emerald-50 text-emerald-700',
      CREATE_DEPARTMENT: 'bg-purple-50 text-purple-700',
      UPDATE_DEPARTMENT: 'bg-purple-50 text-purple-700',
      CREATE_EMPLOYEE: 'bg-indigo-50 text-indigo-700',
      UPDATE_EMPLOYEE: 'bg-indigo-50 text-indigo-700',
      TRANSFER_EMPLOYEE: 'bg-yellow-50 text-yellow-700',
      CHANGE_PASSWORD: 'bg-orange-50 text-orange-700',
    };
    return colorMap[action] || 'bg-slate-50 text-slate-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Shield size={14} className="text-[#008751]" />
            <span>Audit</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Activity Logs</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
          <p className="text-slate-500 mt-1 text-sm">System activity and audit trail</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Filter by action type..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button type="submit" className="btn-secondary">Filter</button>
          </form>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No audit logs found.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Timestamp</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Entity</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Details</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-NG')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{log.user_name || 'System'}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${getActionBadge(log.action)}`}>{log.action}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={log.details}>{log.details}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadLogs} />
      </div>
    </div>
  );
}