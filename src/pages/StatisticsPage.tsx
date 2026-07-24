import { useState, useEffect } from 'react';
import { HospitalStatistic, Pagination as PaginationType } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Pencil, Trash2, TrendingUp, Building2, Activity, Layers } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getHospitalStatistics, createHospitalStatistic } from '../lib/scorecards';
import { deleteDocument, updateDocument } from '../lib/firestore';
import { getAllHospitals } from '../lib/hospitals';

export default function StatisticsPage() {
  const { hasRole } = useAuth();
  const [stats, setStats] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editStat, setEditStat] = useState<any>(null);
  const [form, setForm] = useState({ hospital_id: '', metric_name: '', value: 0, unit: '', reporting_period: '' });
  const [hospitals, setHospitals] = useState<any[]>([]);
  const isAdmin = hasRole('super_admin') || hasRole('director_prs') || hasRole('prs_admin');

  const loadStats = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getHospitalStatistics(page, 50);
      setStats(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadStats(); };

  const loadDropdowns = async () => {
    const hData = await getAllHospitals();
    setHospitals(hData || []);
  };

  const openCreate = () => {
    setEditStat(null);
    setForm({ hospital_id: '', metric_name: '', value: 0, unit: '', reporting_period: '' });
    loadDropdowns();
    setShowModal(true);
  };

  const openEdit = (s: any) => {
    setEditStat(s);
    setForm({ hospital_id: s.hospital_id || '', metric_name: s.metric_name, value: s.value, unit: s.unit, reporting_period: s.reporting_period });
    loadDropdowns();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, value: Number(form.value) };
      if (editStat) {
        await updateDocument('hospitalStatistics', editStat.id, payload);
      } else {
        await createHospitalStatistic(payload);
      }
      setShowModal(false);
      loadStats(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (s: any) => {
    if (!confirm(`Delete this statistic record permanently? This cannot be undone.`)) return;
    try {
      await deleteDocument('hospitalStatistics', s.id);
      loadStats(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleToggleStatus = async (s: any) => {
    alert('Status toggle not applicable for statistics.');
  };

  const uniqueMetrics = stats.reduce((acc: string[], s: any) => {
    if (!acc.includes(s.metric_name)) acc.push(s.metric_name);
    return acc;
  }, []);

  const uniqueHospitals = stats.reduce((acc: string[], s: any) => {
    if (s.hospital_id && !acc.includes(s.hospital_id)) acc.push(s.hospital_id);
    return acc;
  }, []);

  const metricSummary = uniqueMetrics.map(name => {
    const records = stats.filter(s => s.metric_name === name);
    const total = records.reduce((sum, r) => sum + Number(r.value), 0);
    const avg = Math.round(total / records.length);
    return { name, count: records.length, total, avg, unit: records[0]?.unit || '' };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <TrendingUp size={14} className="text-[#008751]" />
            <span>PRS</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Statistics</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Hospital Statistics</h1>
          <p className="text-slate-500 mt-1 text-sm">Track hospital-level statistical data and metrics</p>
        </div>
        {isAdmin && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Statistic</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Records" value={pagination.total} icon={TrendingUp} color="primary" subtitle="All statistic records" />
        <StatCard title="Hospitals" value={uniqueHospitals.length} icon={Building2} color="teal" subtitle="Facilities with data" />
        <StatCard title="Unique Metrics" value={uniqueMetrics.length} icon={Layers} color="blue" subtitle="Distinct metric types" />
        <StatCard title="Total Value" value={stats.reduce((sum, s) => sum + Number(s.value), 0)} icon={Activity} color="army" subtitle="Aggregated sum" />
      </div>

      {metricSummary.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-[#008751]" />
              <span className="text-sm font-semibold text-slate-700">Metrics Summary</span>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {metricSummary.map(m => (
                <div key={m.name} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-sm font-semibold text-slate-900">{m.name}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span>Records: <strong className="text-slate-700">{m.count}</strong></span>
                    <span>Total: <strong className="text-slate-700">{m.total.toLocaleString()}</strong></span>
                    <span>Avg: <strong className="text-slate-700">{m.avg.toLocaleString()}</strong></span>
                    <span>{m.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search by metric name..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button type="submit" className="btn-secondary">Search</button>
          </form>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : stats.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No statistics found.</p>
              {isAdmin && <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Add Statistic</button>}
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Hospital</th>
                  <th>Value</th>
                  <th>Unit</th>
                  <th>Period</th>
                  {isAdmin && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {stats.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <Activity size={18} className="text-[#008751]" />
                        </div>
                        <span className="font-medium text-slate-900">{s.metric_name}</span>
                      </div>
                    </td>
                    <td>{s.hospital_name || '-'}</td>
                    <td className="font-mono font-medium">{Number(s.value).toLocaleString()}</td>
                    <td>{s.unit || '-'}</td>
                    <td>{s.reporting_period}</td>
                    {isAdmin && (
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(s)} className="btn btn-sm btn-secondary"><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(s)} className="btn btn-sm btn-danger"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadStats} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editStat ? 'Edit Statistic' : 'Add Statistic'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Hospital</label>
            <select className="input" value={form.hospital_id} onChange={e => setForm({ ...form, hospital_id: e.target.value })} required>
              <option value="">Select hospital</option>
              {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Metric Name</label>
            <input className="input" placeholder="e.g. Bed Occupancy Rate" value={form.metric_name} onChange={e => setForm({ ...form, metric_name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Value</label>
              <input type="number" className="input" value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })} required />
            </div>
            <div>
              <label className="label">Unit</label>
              <input className="input" placeholder="e.g. %, count" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="label">Reporting Period</label>
            <input className="input" placeholder="e.g. Q1 2025" value={form.reporting_period} onChange={e => setForm({ ...form, reporting_period: e.target.value })} required />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">
              {editStat ? 'Update Statistic' : 'Create Statistic'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
