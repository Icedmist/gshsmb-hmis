import { useState, useEffect } from 'react';
import type { Pagination as PaginationType } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Search, Pencil, Trash2, Users, Briefcase, Building2, UserMinus, Plus } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getPharmaceuticalWorkforce, createPharmaceuticalWorkforce, updatePharmaceuticalWorkforce } from '../lib/pharmaceutical';
import { getAllHospitals } from '../lib/hospitals';
import { getHospitalScope } from '../lib/scope';

export default function PharmaceuticalWorkforcePage() {
  const { hasRole, user } = useAuth();
  const canManage = hasRole('super_admin', 'pharmacy_admin');
  const canView = hasRole('super_admin', 'director_pharmaceutical_services', 'pharmacy_admin', 'hr_officer', 'director_hr');
  const hospitalScope = getHospitalScope(user);
  const [items, setItems] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<{ id: string; hospital_name: string }[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [form, setForm] = useState({ hospital_id: '', pharmacist_count: '', pharmacy_technician_count: '', vacancies: '', staffing_gaps: '', reporting_period: '' });

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getPharmaceuticalWorkforce(page, 50, search || undefined, hospitalScope);
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
    setForm({ hospital_id: '', pharmacist_count: '', pharmacy_technician_count: '', vacancies: '', staffing_gaps: '', reporting_period: '' });
    loadHospitals();
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      hospital_id: item.hospital_id,
      pharmacist_count: String(item.pharmacist_count || ''),
      pharmacy_technician_count: String(item.pharmacy_technician_count || ''),
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
        pharmacist_count: Number(form.pharmacist_count),
        pharmacy_technician_count: Number(form.pharmacy_technician_count),
        vacancies: Number(form.vacancies),
        staffing_gaps: form.staffing_gaps,
        reporting_period: form.reporting_period,
      };
      if (editItem) {
        await updatePharmaceuticalWorkforce(editItem.id, payload);
      } else {
        await createPharmaceuticalWorkforce(payload);
      }
      setShowModal(false);
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const totalPharmacists = items.reduce((sum, i) => sum + (i.pharmacist_count || 0), 0);
  const totalTechnicians = items.reduce((sum, i) => sum + (i.pharmacy_technician_count || 0), 0);
  const totalVacancies = items.reduce((sum, i) => sum + (i.vacancies || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Users size={14} className="text-[#008751]" />
            <span>Pharmaceutical Services</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Pharmaceutical Workforce</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Pharmaceutical Workforce</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage pharmaceutical workforce data across hospitals</p>
        </div>
        {canManage && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Record</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pharmacists" value={totalPharmacists} icon={Users} color="primary" subtitle="Across all hospitals" />
        <StatCard title="Pharmacy Technicians" value={totalTechnicians} icon={Briefcase} color="teal" subtitle="Support staff" />
        <StatCard title="Vacancies" value={totalVacancies} icon={UserMinus} color="orange" subtitle="Open positions" />
        <StatCard title="Hospitals" value={new Set(items.map(i => i.hospital_id)).size} icon={Building2} color="blue" subtitle="With workforce data" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search by hospital..." value={search} onChange={e => setSearch(e.target.value)} />
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
                  <th>Pharmacists</th>
                  <th>Pharmacy Technicians</th>
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
                    <td className="font-semibold text-slate-900">{item.pharmacist_count || 0}</td>
                    <td>{item.pharmacy_technician_count || 0}</td>
                    <td>{item.vacancies || 0}</td>
                    <td className="max-w-xs whitespace-pre-wrap text-sm">{item.staffing_gaps || '-'}</td>
                    <td><span className="badge-active">{item.reporting_period}</span></td>
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
              <label className="label">Pharmacist Count</label>
              <input type="number" min="0" className="input" value={form.pharmacist_count} onChange={e => setForm({ ...form, pharmacist_count: e.target.value })} required />
            </div>
            <div>
              <label className="label">Pharmacy Technician Count</label>
              <input type="number" min="0" className="input" value={form.pharmacy_technician_count} onChange={e => setForm({ ...form, pharmacy_technician_count: e.target.value })} required />
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
