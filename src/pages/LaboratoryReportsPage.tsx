import { useState, useEffect } from 'react';
import { Pagination as PaginationType } from '../types';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Search, Download } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getLaboratoryReports } from '../lib/laboratory';
import { getHospitalScope } from '../lib/scope';

export default function LaboratoryReportsPage() {
  const { hasRole, user } = useAuth();
  const canView = hasRole('director_laboratory_services', 'executive_secretary', 'lab_admin');
  const hospitalScope = getHospitalScope(user);
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getLaboratoryReports(page, 50, search || undefined, hospitalScope);
      setItems(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadData(); };

  if (!canView) {
    return (
      <div className="text-center py-12">
        <FileText size={40} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500 text-sm">You do not have permission to view laboratory reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <FileText size={14} className="text-[#008751]" />
            <span>Laboratory Services</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Laboratory Reports</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Laboratory Reports</h1>
          <p className="text-slate-500 mt-1 text-sm">View and download generated laboratory reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Reports" value={pagination.total} icon={FileText} color="primary" subtitle="Generated laboratory reports" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search reports by title..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button type="submit" className="btn-secondary">Search</button>
          </form>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No laboratory reports found.</p>
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Hospital</th>
                  <th>Department</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <FileText size={18} className="text-[#008751]" />
                        </div>
                        <span className="font-medium text-slate-900">{item.title}</span>
                      </div>
                    </td>
                    <td>{item.hospital_name || '-'}</td>
                    <td>{item.department_name || '-'}</td>
                    <td className="text-sm">{item.created_at ? new Date(item.created_at.seconds * 1000).toLocaleDateString() : '-'}</td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button className="btn btn-sm btn-secondary" title="Download">
                          <Download size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadData} />
      </div>
    </div>
  );
}
