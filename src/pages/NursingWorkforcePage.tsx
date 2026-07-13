import { useState, useEffect } from 'react';
import type { NursingWorkforce, Pagination as PaginationType, Hospital } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Search, Pencil, Trash2, Users, Briefcase, Building2, LayoutGrid, Plus } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getNursingWorkforce, createNursingWorkforce, updateNursingWorkforce, deleteNursingWorkforce, getNursingWorkforceSummary } from '../lib/nursingWorkforce';
import { getHospitals } from '../lib/hospitals';
import { getAllDepartments } from '../lib/departments';

export default function NursingWorkforcePage() {
  const { hasRole } = useAuth();
  const [items, setItems] = useState<NursingWorkforce[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<NursingWorkforce | null>(null);
  const [form, setForm] = useState({ hospital_id: '', department_id: '', nurse_count: '', vacancies: '', staffing_gaps: '', reporting_period: '' });
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const canManage = hasRole('super_admin') || hasRole('director_nursing_services');

  const loadItems = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getNursingWorkforce(page, 50, search);
      setItems(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
      const s = await getNursingWorkforceSummary();
      setSummary(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadItems(); };

  const loadFormData = async () => {
    const { data: hData } = await getHospitals(1, 200);
    setHospitals(hData);
    const dData = await getAllDepartments();
    setDepartments(dData);
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ hospital_id: '', department_id: '', nurse_count: '', vacancies: '', staffing_gaps: '', reporting_period: '' });
    loadFormData();
    setShowModal(true);
  };

  const openEdit = (item: NursingWorkforce) => {
    setEditItem(item);
    setForm({
      hospital_id: item.hospital_id,
      department_id: item.department_id,
      nurse_count: String(item.nurse_count),
      vacancies: String(item.vacancies),
      staffing_gaps: item.staffing_gaps,
      reporting_period: item.reporting_period,
    });
    loadFormData();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        hospital_id: form.hospital_id,
        department_id: form.department_id,
        nurse_count: Number(form.nurse_count),
        vacancies: Number(form.vacancies),
        staffing_gaps: form.staffing_gaps,
        reporting_period: form.reporting_period,
      };
      if (editItem) {
        await updateNursingWorkforce(editItem.id, payload);
      } else {
        await createNursingWorkforce(payload);
      }
      setShowModal(false);
      loadItems(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (item: NursingWorkforce) => {
    if (!confirm(`Delete this workforce record permanently?`)) return;
    try {
      await deleteNursingWorkforce(item.id);
      loadItems(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const totalNurses = summary.reduce((sum, s) => sum + (s.total_nurses || 0), 0);
  const totalVacancies = summary.reduce((sum, s) => sum + (s.total_vacancies || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Users size={14} className="text-[#008751]" />
            <span>Nursing Services</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Nursing Workforce</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Nursing Workforce</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage nursing workforce data across hospitals</p>
        </div>
        {canManage && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Record</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Nurses" value={totalNurses} icon={Users} color="primary" subtitle="Across all hospitals" />
        <StatCard title="Total Vacancies" value={totalVacancies} icon={Briefcase} color="orange" subtitle="Open positions" />
        <StatCard title="Hospitals" value={summary.length} icon={Building2} color="teal" subtitle="With workforce data" />
        <StatCard title="Departments" value={new Set(items.map(i => i.department_id)).size} icon={LayoutGrid} color="blue" subtitle="Departments covered" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search by hospital or department..." value={search} onChange={e => setSearch(e.target.value)} />
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
                  <th>Department</th>
                  <th>Nurses</th>
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
                    <td>{item.department_name}</td>
                    <td className="font-semibold text-slate-900">{item.nurse_count}</td>
                    <td>{item.vacancies}</td>
                    <td className="max-w-xs whitespace-pre-wrap text-sm">{item.staffing_gaps}</td>
                    <td><span className="badge-active">{item.reporting_period}</span></td>
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
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadItems} />
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
          <div>
            <label className="label">Department</label>
            <select className="input" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })} required>
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nurse Count</label>
              <input type="number" min="0" className="input" value={form.nurse_count} onChange={e => setForm({ ...form, nurse_count: e.target.value })} required />
            </div>
            <div>
              <label className="label">Vacancies</label>
              <input type="number" min="0" className="input" value={form.vacancies} onChange={e => setForm({ ...form, vacancies: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="label">Staffing Gaps</label>
            <textarea className="input" rows={3} value={form.staffing_gaps} onChange={e => setForm({ ...form, staffing_gaps: e.target.value })} required />
          </div>
          <div>
            <label className="label">Reporting Period</label>
            <input className="input" placeholder="e.g. 2024-Q1" value={form.reporting_period} onChange={e => setForm({ ...form, reporting_period: e.target.value })} required />
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
