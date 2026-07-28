import { useState, useEffect } from 'react';
import { Pagination as PaginationType } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Pencil, Users, Briefcase, Building2 } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getLaboratoryWorkforce, createLaboratoryWorkforce, updateLaboratoryWorkforce } from '../lib/laboratory';
import { getAllHospitals } from '../lib/hospitals';
import { getHospitalScope } from '../lib/scope';

export default function LaboratoryWorkforcePage() {
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
  const [form, setForm] = useState({ hospital_id: '', scientist_count: '', technician_count: '', vacancies: '', staffing_gaps: '', reporting_period: '' });

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getLaboratoryWorkforce(page, 50, search || undefined, hospitalScope);
      setItems(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally {
      setLoading(false);
    }
  };

// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadData(); };

  const loadHospitals = async () => {
    try {
      const data = await getAllHospitals(hospitalScope);
      setHospitals((data || []).map((h: any) => ({ id: h.id, hospital_name: h.hospital_name })));
    } catch {}
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ hospital_id: '', scientist_count: '', technician_count: '', vacancies: '', staffing_gaps: '', reporting_period: '' });
    loadHospitals();
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      hospital_id: item.hospital_id,
      scientist_count: String(item.scientist_count || ''),
      technician_count: String(item.technician_count || ''),
      vacancies: String(item.vacancies || ''),
      staffing_gaps: item.staffing_gaps || '',
      reporting_period: item.reporting_period || '',
    });
    loadHospitals();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        hospital_id: form.hospital_id,
        scientist_count: Number(form.scientist_count),
        technician_count: Number(form.technician_count),
        vacancies: Number(form.vacancies),
        staffing_gaps: form.staffing_gaps,
        reporting_period: form.reporting_period,
      };
      if (editItem) {
        await updateLaboratoryWorkforce(editItem.id, payload);
      } else {
        await createLaboratoryWorkforce(payload);
      }
      setShowModal(false);
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const totalScientists = items.reduce((sum, i) => sum + (i.scientist_count || 0), 0);
  const totalTechnicians = items.reduce((sum, i) => sum + (i.technician_count || 0), 0);
  const totalVacancies = items.reduce((sum, i) => sum + (i.vacancies || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Users size={14} className="text-[#008751]" />
            <span>Laboratory Services</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Laboratory Workforce</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Laboratory Workforce</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage laboratory workforce data across hospitals</p>
        </div>
        {canManage && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Record</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Scientists" value={totalScientists} icon={Users} color="primary" subtitle="Across all hospitals" />
        <StatCard title="Total Technicians" value={totalTechnicians} icon={Users} color="teal" subtitle="Lab technicians" />
        <StatCard title="Total Vacancies" value={totalVacancies} icon={Briefcase} color="orange" subtitle="Open positions" />
        <StatCard title="Hospitals" value={new Set(items.map(i => i.hospital_id)).size} icon={Building2} color="blue" subtitle="With workforce data" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search by period or hospital..." value={search} onChange={e => setSearch(e.target.value)} />
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
              <Users size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No workforce records found.</p>
              {canManage && <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Add Record</button>}
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Hospital</th>
                  <th>Scientists</th>
                  <th>Technicians</th>
                  <th>Vacancies</th>
                  <th>Staffing Gaps</th>
                  <th>Period</th>
                  {canManage && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <Building2 size={18} className="text-[#008751]" />
                        </div>
                        <span className="font-medium text-slate-900">{item.hospital_name}</span>
                      </div>
                    </td>
                    <td className="font-semibold text-slate-900">{item.scientist_count || 0}</td>
                    <td className="font-semibold text-slate-900">{item.technician_count || 0}</td>
                    <td>{item.vacancies || 0}</td>
                    <td className="max-w-xs whitespace-pre-wrap text-sm">{item.staffing_gaps || '-'}</td>
                    <td><span className="badge-active">{item.reporting_period || '-'}</span></td>
                    {canManage && (
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(item)} className="btn btn-sm btn-secondary"><Pencil size={14} /></button>
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Workforce Record' : 'Add Workforce Record'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Hospital</label>
            <select className="input" value={form.hospital_id} onChange={e => setForm({ ...form, hospital_id: e.target.value })} required>
              <option value="">Select Hospital</option>
              {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Scientist Count</label>
              <input type="number" min="0" className="input" value={form.scientist_count} onChange={e => setForm({ ...form, scientist_count: e.target.value })} required />
            </div>
            <div>
              <label className="label">Technician Count</label>
              <input type="number" min="0" className="input" value={form.technician_count} onChange={e => setForm({ ...form, technician_count: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Vacancies</label>
              <input type="number" min="0" className="input" value={form.vacancies} onChange={e => setForm({ ...form, vacancies: e.target.value })} required />
            </div>
            <div>
              <label className="label">Reporting Period</label>
              <input className="input" placeholder="e.g. 2024-Q1" value={form.reporting_period} onChange={e => setForm({ ...form, reporting_period: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="label">Staffing Gaps</label>
            <textarea className="input" rows={3} value={form.staffing_gaps} onChange={e => setForm({ ...form, staffing_gaps: e.target.value })} required />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editItem ? 'Update Record' : 'Create Record'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
