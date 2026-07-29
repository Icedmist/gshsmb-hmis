import { useState, useEffect } from 'react';
import { Specialist, Pagination as PaginationType } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Pencil, Trash2, Stethoscope, UserCheck, Building2, Layers } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getSpecialists, createSpecialist, updateSpecialist, deleteSpecialist } from '../lib/specialists';
import { getAllHospitals } from '../lib/hospitals';
import { getAllDepartments } from '../lib/departments';

export default function SpecialistsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('super_admin', 'medical_admin');
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [hospitals, setHospitals] = useState<{ id: string; hospital_name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; department_name: string }[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Specialist | null>(null);
  const [form, setForm] = useState({ full_name: '', specialty: '', hospital_id: '', department_id: '', phone_number: '', email: '' });

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getSpecialists(page, 50, search || undefined);
      setSpecialists(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadData(); };

  const loadFormDeps = async () => {
    try {
      const [hData, dData] = await Promise.all([getAllHospitals(), getAllDepartments()]);
      setHospitals((hData || []).map((h: any) => ({ id: h.id, hospital_name: h.hospital_name })));
      setDepartments((dData || []).map((d: any) => ({ id: d.id, department_name: d.department_name })));
    } catch {}
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ full_name: '', specialty: '', hospital_id: '', department_id: '', phone_number: '', email: '' });
    loadFormDeps();
    setShowModal(true);
  };

  const openEdit = (item: Specialist) => {
    setEditItem(item);
    setForm({ full_name: item.full_name, specialty: item.specialty, hospital_id: item.hospital_id, department_id: item.department_id, phone_number: item.phone_number, email: item.email });
    loadFormDeps();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editItem) {
        await updateSpecialist(editItem.id, form);
      } else {
        await createSpecialist(form);
      }
      setShowModal(false);
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (item: Specialist) => {
    if (!confirm(`Delete ${item.full_name} permanently? This cannot be undone.`)) return;
    try {
      await deleteSpecialist(item.id);
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleToggleStatus = async (item: Specialist) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} ${item.full_name}?`)) return;
    try {
      await updateSpecialist(item.id, { status: newStatus });
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Stethoscope size={14} className="text-[#008751]" />
            <span>Clinical Services</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Specialists</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Specialists</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage medical specialists across hospitals and departments</p>
        </div>
        {canManage && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Specialist</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Specialists" value={pagination.total} icon={Stethoscope} color="primary" subtitle="Registered specialists" />
        <StatCard title="Active" value={specialists.filter(s => s.status === 'active').length} icon={UserCheck} color="teal" subtitle="Currently active" />
        <StatCard title="Specialties" value={new Set(specialists.map(s => s.specialty)).size} icon={Layers} color="blue" subtitle="Distinct specializations" />
        <StatCard title="Hospitals" value={new Set(specialists.map(s => s.hospital_id)).size} icon={Building2} color="army" subtitle="Covered facilities" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search specialists by name or specialty..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button type="submit" className="btn-secondary">Search</button>
          </form>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : specialists.length === 0 ? (
            <div className="text-center py-12">
              <Stethoscope size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No specialists found.</p>
              {canManage && <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Add Specialist</button>}
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Specialty</th>
                  <th>Hospital</th>
                  <th>Department</th>
                  <th>Contact</th>
                  <th>Status</th>
                  {canManage && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {specialists.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <Stethoscope size={18} className="text-[#008751]" />
                        </div>
                        <span className="font-medium text-slate-900">{s.full_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">
                        {s.specialty}
                      </span>
                    </td>
                    <td>{s.hospital_name || '-'}</td>
                    <td>{s.department_name || '-'}</td>
                    <td>
                      <p>{s.email || '-'}</p>
                      <p className="text-xs text-slate-400">{s.phone_number || '-'}</p>
                    </td>
                    <td>
                      <span className={s.status === 'active' ? 'badge-active' : 'badge-inactive'}>{s.status}</span>
                    </td>
                    {canManage && (
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(s)} className="btn btn-sm btn-secondary"><Pencil size={14} /></button>
                          <button onClick={() => handleToggleStatus(s)} className="btn btn-sm btn-secondary">
                            {s.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
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
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadData} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Specialist' : 'Add Specialist'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Specialty</label>
              <input className="input" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Hospital</label>
              <select className="input" value={form.hospital_id} onChange={e => setForm({ ...form, hospital_id: e.target.value })} required>
                <option value="">Select hospital...</option>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <select className="input" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })} required>
                <option value="">Select department...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone Number</label>
              <input className="input" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editItem ? 'Update Specialist' : 'Create Specialist'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
