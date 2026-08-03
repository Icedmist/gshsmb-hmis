import { useState, useEffect } from 'react';
import type { Pagination as PaginationType } from '../types';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Search, FileText, Calendar, Tag, Download } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getPharmaceuticalReports } from '../lib/pharmaceutical';
import { getHospitalScope } from '../lib/scope';

export default function PharmaceuticalReportsPage() {
  const { user } = useAuth();
  const hospitalScope = getHospitalScope(user);
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getPharmaceuticalReports(page, 50, search || undefined, hospitalScope);
      setItems(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadData(); };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl p-8 text-white shadow-[0_20px_40px_-15px_rgba(0,135,81,0.3)] bg-gradient-to-br from-[#004d2e] via-[#008751] to-[#00b36b]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 blur-3xl rounded-full mix-blend-overlay"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-emerald-100/90 text-sm mb-3">
            <FileText size={16} />
            <span className="tracking-wide uppercase text-xs font-bold">Pharmaceutical Services</span>
            <span className="opacity-50">/</span>
            <span className="text-white font-medium tracking-wide uppercase text-xs">Reports</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-2">Pharmaceutical Reports</h1>
          <p className="text-emerald-50/80 text-base max-w-xl font-medium leading-relaxed">
            Simplified overview of generated pharmaceutical reports and pharmacy operations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Reports" value={pagination.total} icon={FileText} color="primary" subtitle="Pharmaceutical reports" />
        <StatCard title="Report Types" value={new Set(items.map(i => i.type)).size} icon={Tag} color="teal" subtitle="Unique types" />
        <StatCard title="Formats" value={new Set(items.map(i => i.format)).size} icon={Download} color="blue" subtitle="Available formats" />
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
              <p className="text-slate-500 text-sm">No pharmaceutical reports found.</p>
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Format</th>
                  <th>Hospital</th>
                  <th>Created At</th>
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
                    <td>
                      <span className="flex items-center gap-1 text-sm">
                        <Tag size={12} className="text-slate-400" />
                        {item.type || '-'}
                      </span>
                    </td>
                    <td>
                      <span className="badge-active">{item.format || '-'}</span>
                    </td>
                    <td>{item.hospital_name || 'All Hospitals'}</td>
                    <td>
                      <span className="flex items-center gap-1 text-sm">
                        <Calendar size={12} className="text-slate-400" />
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                      </span>
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
