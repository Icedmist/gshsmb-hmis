import { useState, useEffect } from 'react';
import { Pagination as PaginationType } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Pencil, Trash2, Activity, Building2, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getDiseaseSurveillanceReports, createDiseaseSurveillanceReport, updateDiseaseSurveillanceReport, deleteDiseaseSurveillanceReport } from '../lib/laboratory';
import { getAllHospitals } from '../lib/hospitals';
import { getHospitalScope } from '../lib/scope';

export default function DiseaseSurveillancePage() {
  const { hasRole, user } = useAuth();
  const canManage = hasRole('super_admin', 'lab_admin');
  const hospitalScope = getHospitalScope(user);
  const [items, setItems] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<{ id: string; hospital_name: string }[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [form, setForm] = useState({ hospital_id: '', disease_name: '', case_count: '', death_count: '', reporting_period: '', notes: '' });

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getDiseaseSurveillanceReports(page, 50, search || undefined, hospitalScope);
      setItems(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadData(); };

  const loadHospitals = async () => {
    try {
      const data = await getAllHospitals(hospitalScope);
      setHospitals((data || []).map((h: any) => ({ id: h.id, hospital_name: h.hospital_name })));
    } catch {}
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ hospital_id: '', disease_name: '', case_count: '', death_count: '', reporting_period: '', notes: '' });
    loadHospitals();
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      hospital_id: item.hospital_id,
      disease_name: item.disease_name,
      case_count: String(item.case_count || ''),
      death_count: String(item.death_count || ''),
      reporting_period: item.reporting_period || '',
      notes: item.notes || '',
    });
    loadHospitals();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        hospital_id: form.hospital_id,
        disease_name: form.disease_name,
        case_count: Number(form.case_count),
        death_count: Number(form.death_count),
        reporting_period: form.reporting_period,
        notes: form.notes,
      };
      if (editItem) {
        await updateDiseaseSurveillanceReport(editItem.id, payload);
      } else {
        await createDiseaseSurveillanceReport(payload);
      }
      setShowModal(false);
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Delete this disease surveillance report permanently?`)) return;
    try {
      await deleteDiseaseSurveillanceReport(item.id);
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const totalCases = items.reduce((sum, i) => sum + (i.case_count || 0), 0);
  const totalDeaths = items.reduce((sum, i) => sum + (i.death_count || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Activity size={14} className="text-[#008751]" />
            <span>Laboratory Services</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Disease Surveillance</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Disease Surveillance Reports</h1>
          <p className="text-slate-500 mt-1 text-sm">Monitor and report disease surveillance data across hospitals</p>
        </div>
        {canManage && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Report</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Reports" value={pagination.total} icon={Activity} color="primary" subtitle="Surveillance entries" />
        <StatCard title="Total Cases" value={totalCases} icon={TrendingUp} color="orange" subtitle="Reported cases" />
        <StatCard title="Total Deaths" value={totalDeaths} icon={TrendingDown} color="lemon" subtitle="Reported deaths" />
        <StatCard title="Hospitals" value={new Set(items.map(i => i.hospital_id)).size} icon={Building2} color="blue" subtitle="Reporting hospitals" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search by disease name..." value={search} onChange={e => setSearch(e.target.value)} />
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
              <Activity size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No surveillance reports found.</p>
              {canManage && <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Add Report</button>}
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Disease</th>
                  <th>Hospital</th>
                  <th>Cases</th>
                  <th>Deaths</th>
                  <th>Period</th>
                  <th>Notes</th>
                  {canManage && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <AlertTriangle size={18} className="text-[#008751]" />
                        </div>
                        <span className="font-medium text-slate-900">{item.disease_name}</span>
                      </div>
                    </td>
                    <td>{item.hospital_name || '-'}</td>
                    <td className="font-semibold text-slate-900">{item.case_count || 0}</td>
                    <td className="font-semibold text-red-600">{item.death_count || 0}</td>
                    <td><span className="badge-active">{item.reporting_period || '-'}</span></td>
                    <td className="max-w-xs text-sm text-slate-500 truncate">{item.notes || '-'}</td>
                    {canManage && (
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(item)} className="btn btn-sm btn-secondary"><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(item)} className="btn btn-sm btn-danger"><Trash2 size={14} /></button>
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
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadData} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Surveillance Report' : 'Add Surveillance Report'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Disease Name</label>
              <input className="input" value={form.disease_name} onChange={e => setForm({ ...form, disease_name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Hospital</label>
              <select className="input" value={form.hospital_id} onChange={e => setForm({ ...form, hospital_id: e.target.value })} required>
                <option value="">Select hospital...</option>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Case Count</label>
              <input type="number" min="0" className="input" value={form.case_count} onChange={e => setForm({ ...form, case_count: e.target.value })} required />
            </div>
            <div>
              <label className="label">Death Count</label>
              <input type="number" min="0" className="input" value={form.death_count} onChange={e => setForm({ ...form, death_count: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="label">Reporting Period</label>
            <input className="input" placeholder="e.g. 2024-Q1" value={form.reporting_period} onChange={e => setForm({ ...form, reporting_period: e.target.value })} required />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editItem ? 'Update Report' : 'Create Report'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
