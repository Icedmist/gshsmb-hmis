import { useState, useEffect } from 'react';
import { KPI, Pagination as PaginationType } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Pencil, Trash2, BarChart3, Target, CheckCircle2, Percent } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getKPIs, createKPI, updateKPI, deleteKPI } from '../lib/kpis';
import { getAllHospitals } from '../lib/hospitals';
import { getAllDepartments } from '../lib/departments';

export default function KPIPage() {
  const { hasRole } = useAuth();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editKPI, setEditKPI] = useState<KPI | null>(null);
  const [form, setForm] = useState({ name: '', description: '', target: 0, actual_value: 0, unit: '', reporting_period: '', hospital_id: '', department_id: '' });
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const isAdmin = hasRole('super_admin') || hasRole('director_prs') || hasRole('prs_admin');

  const loadKPIs = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getKPIs(page, 50, search);
      setKpis(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally {
      setLoading(false);
    }
  };

// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadKPIs(); }, [loadKPIs]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadKPIs(); };

  const loadDropdowns = async () => {
    const [hData, dData] = await Promise.all([getAllHospitals(), getAllDepartments()]);
    setHospitals(hData || []);
    setDepartments(dData || []);
  };

  const openCreate = () => {
    setEditKPI(null);
    setForm({ name: '', description: '', target: 0, actual_value: 0, unit: '', reporting_period: '', hospital_id: '', department_id: '' });
    loadDropdowns();
    setShowModal(true);
  };

  const openEdit = (k: KPI) => {
    setEditKPI(k);
    setForm({ name: k.name, description: k.description, target: k.target, actual_value: k.actual_value, unit: k.unit, reporting_period: k.reporting_period, hospital_id: k.hospital_id || '', department_id: k.department_id || '' });
    loadDropdowns();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, target: Number(form.target), actual_value: Number(form.actual_value), hospital_id: form.hospital_id || null, department_id: form.department_id || null };
      if (editKPI) {
        await updateKPI(editKPI.id, payload);
      } else {
        await createKPI(payload);
      }
      setShowModal(false);
      loadKPIs(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (k: KPI) => {
    if (!confirm(`Delete KPI "${k.name}" permanently? This cannot be undone.`)) return;
    try {
      await deleteKPI(k.id);
      loadKPIs(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleToggleStatus = async (k: KPI) => {
    const newStatus = k.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} "${k.name}"?`)) return;
    try {
      await updateKPI(k.id, { status: newStatus });
      loadKPIs(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const getAchievementRate = (k: KPI) => {
    if (!k.target) return 0;
    return Math.min(Math.round((k.actual_value / k.target) * 100), 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <BarChart3 size={14} className="text-[#008751]" />
            <span>PRS</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">KPIs</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Key Performance Indicators</h1>
          <p className="text-slate-500 mt-1 text-sm">Monitor and manage performance indicators across facilities</p>
        </div>
        {isAdmin && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add KPI</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total KPIs" value={pagination.total} icon={BarChart3} color="primary" subtitle="All indicators" />
        <StatCard title="Active" value={kpis.filter(k => k.status === 'active').length} icon={Target} color="teal" subtitle="Active indicators" />
        <StatCard title="Achieved" value={kpis.filter(k => k.status === 'active' && k.actual_value >= k.target).length} icon={CheckCircle2} color="blue" subtitle="Targets met" />
        <StatCard title="Achievement Rate" value={kpis.length > 0 ? Math.round((kpis.filter(k => k.actual_value >= k.target).length / kpis.length) * 100) : 0} icon={Percent} color="army" subtitle="Overall rate" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search KPIs by name..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button type="submit" className="btn-secondary">Search</button>
          </form>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : kpis.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No KPIs found.</p>
              {isAdmin && <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Add KPI</button>}
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Target</th>
                  <th>Actual</th>
                  <th>Unit</th>
                  <th>Period</th>
                  <th>Hospital / Dept</th>
                  <th>Achievement</th>
                  <th>Status</th>
                  {isAdmin && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {kpis.map(k => (
                  <tr key={k.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <Target size={18} className="text-[#008751]" />
                        </div>
                        <div>
                          <span className="font-medium text-slate-900">{k.name}</span>
                          {k.description && <p className="text-xs text-slate-400">{k.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="font-mono">{k.target}</td>
                    <td className="font-mono">{k.actual_value}</td>
                    <td>{k.unit}</td>
                    <td>{k.reporting_period}</td>
                    <td>
                      <p>{k.hospital_name || '-'}</p>
                      <p className="text-xs text-slate-400">{k.department_name || '-'}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 w-24">
                          <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${getAchievementRate(k)}%`, backgroundColor: getAchievementRate(k) >= 100 ? '#008751' : getAchievementRate(k) >= 50 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                        <span className="text-xs font-mono font-medium">{getAchievementRate(k)}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={k.status === 'active' ? 'badge-active' : 'badge-inactive'}>{k.status}</span>
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(k)} className="btn btn-sm btn-secondary"><Pencil size={14} /></button>
                          <button onClick={() => handleToggleStatus(k)} className="btn btn-sm btn-secondary">
                            {k.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => handleDelete(k)} className="btn btn-sm btn-danger"><Trash2 size={14} /></button>
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
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadKPIs} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editKPI ? 'Edit KPI' : 'Add KPI'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Target</label>
              <input type="number" className="input" value={form.target} onChange={e => setForm({ ...form, target: Number(e.target.value) })} required />
            </div>
            <div>
              <label className="label">Actual Value</label>
              <input type="number" className="input" value={form.actual_value} onChange={e => setForm({ ...form, actual_value: Number(e.target.value) })} required />
            </div>
            <div>
              <label className="label">Unit</label>
              <input className="input" placeholder="e.g. %, count" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} required />
            </div>
            <div>
              <label className="label">Reporting Period</label>
              <input className="input" placeholder="e.g. Q1 2025" value={form.reporting_period} onChange={e => setForm({ ...form, reporting_period: e.target.value })} required />
            </div>
            <div>
              <label className="label">Hospital (optional)</label>
              <select className="input" value={form.hospital_id} onChange={e => setForm({ ...form, hospital_id: e.target.value })}>
                <option value="">No hospital</option>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Department (optional)</label>
              <select className="input" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
                <option value="">No department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">
              {editKPI ? 'Update KPI' : 'Create KPI'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
