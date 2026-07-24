import { useState, useEffect } from 'react';
import { ClinicalGuideline, Pagination as PaginationType } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Pencil, Trash2, BookOpen, FileText, Activity, Layers } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getClinicalGuidelines, createClinicalGuideline, updateClinicalGuideline, deleteClinicalGuideline } from '../lib/clinicalGuidelines';
import { getAllDepartments } from '../lib/departments';

export default function ClinicalGuidelinesPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('super_admin', 'medical_admin');
  const [guidelines, setGuidelines] = useState<ClinicalGuideline[]>([]);
  const [departments, setDepartments] = useState<{ id: string; department_name: string }[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<ClinicalGuideline | null>(null);
  const [form, setForm] = useState({ title: '', code: '', department_id: '', description: '', effective_date: '' });

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getClinicalGuidelines(page, 50, search || undefined);
      setGuidelines(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadData(); };

  const loadDepartments = async () => {
    try {
      const data = await getAllDepartments();
      setDepartments((data || []).map((d: any) => ({ id: d.id, department_name: d.department_name })));
    } catch {}
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ title: '', code: '', department_id: '', description: '', effective_date: '' });
    loadDepartments();
    setShowModal(true);
  };

  const openEdit = (item: ClinicalGuideline) => {
    setEditItem(item);
    setForm({ title: item.title, code: item.code, department_id: item.department_id, description: item.description, effective_date: item.effective_date });
    loadDepartments();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editItem) {
        await updateClinicalGuideline(editItem.id, form);
      } else {
        await createClinicalGuideline(form);
      }
      setShowModal(false);
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (item: ClinicalGuideline) => {
    if (!confirm(`Delete ${item.title} permanently? This cannot be undone.`)) return;
    try {
      await deleteClinicalGuideline(item.id);
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleToggleStatus = async (item: ClinicalGuideline) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} ${item.title}?`)) return;
    try {
      await updateClinicalGuideline(item.id, { status: newStatus });
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <BookOpen size={14} className="text-[#008751]" />
            <span>Clinical Services</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Clinical Guidelines</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Clinical Guidelines</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage standardized clinical guidelines across departments</p>
        </div>
        {canManage && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Guideline</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Guidelines" value={pagination.total} icon={BookOpen} color="primary" subtitle="All clinical guidelines" />
        <StatCard title="Active" value={guidelines.filter(g => g.status === 'active').length} icon={FileText} color="teal" subtitle="Currently active" />
        <StatCard title="Inactive" value={guidelines.filter(g => g.status === 'inactive').length} icon={Activity} color="blue" subtitle="Archived guidelines" />
        <StatCard title="Departments Covered" value={new Set(guidelines.map(g => g.department_id)).size} icon={Layers} color="army" subtitle="Departments with guidelines" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search guidelines by title or code..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button type="submit" className="btn-secondary">Search</button>
          </form>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : guidelines.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No clinical guidelines found.</p>
              {canManage && <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Add Guideline</button>}
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Version</th>
                  <th>Effective Date</th>
                  <th>Status</th>
                  {canManage && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {guidelines.map(g => (
                  <tr key={g.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <FileText size={18} className="text-[#008751]" />
                        </div>
                        <span className="font-medium text-slate-900">{g.title}</span>
                      </div>
                    </td>
                    <td className="font-mono">{g.code}</td>
                    <td>{g.department_name || '-'}</td>
                    <td>v{g.version}</td>
                    <td>{g.effective_date}</td>
                    <td>
                      <span className={g.status === 'active' ? 'badge-active' : 'badge-inactive'}>{g.status}</span>
                    </td>
                    {canManage && (
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(g)} className="btn btn-sm btn-secondary"><Pencil size={14} /></button>
                          <button onClick={() => handleToggleStatus(g)} className="btn btn-sm btn-secondary">
                            {g.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => handleDelete(g)} className="btn btn-sm btn-danger"><Trash2 size={14} /></button>
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Guideline' : 'Add Guideline'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="label">Code</label>
              <input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="label">Department</label>
            <select className="input" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })} required>
              <option value="">Select department...</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div>
            <label className="label">Effective Date</label>
            <input type="date" className="input" value={form.effective_date} onChange={e => setForm({ ...form, effective_date: e.target.value })} required />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editItem ? 'Update Guideline' : 'Create Guideline'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
