import { useState, useEffect } from 'react';
import type { Pagination as PaginationType } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Pencil, Trash2, Pill, Building2, Package, Hash, Calendar } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getMedicines, createMedicine, updateMedicine, deleteMedicine } from '../lib/pharmaceutical';
import { getAllHospitals } from '../lib/hospitals';
import { getHospitalScope } from '../lib/scope';

export default function MedicineRegistryPage() {
  const { hasRole, user } = useAuth();
  const canManage = hasRole('super_admin', 'pharmacy_admin');
  const canView = hasRole('super_admin', 'director_pharmaceutical_services', 'pharmacy_admin', 'hospital_admin');
  const hospitalScope = getHospitalScope(user);
  const [items, setItems] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<{ id: string; hospital_name: string }[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: '', generic_name: '', strength: '', dosage_form: '', manufacturer: '',
    hospital_id: '', batch_number: '', expiry_date: '', quantity: '', unit: '',
  });

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getMedicines(page, 50, search || undefined, hospitalScope);
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
    setForm({ name: '', generic_name: '', strength: '', dosage_form: '', manufacturer: '', hospital_id: '', batch_number: '', expiry_date: '', quantity: '', unit: '' });
    loadHospitals();
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      name: item.name, generic_name: item.generic_name, strength: item.strength,
      dosage_form: item.dosage_form, manufacturer: item.manufacturer,
      hospital_id: item.hospital_id, batch_number: item.batch_number,
      expiry_date: item.expiry_date, quantity: String(item.quantity || ''), unit: item.unit,
    });
    loadHospitals();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, quantity: Number(form.quantity) };
      if (editItem) {
        await updateMedicine(editItem.id, payload);
      } else {
        await createMedicine(payload);
      }
      setShowModal(false);
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Delete ${item.name} permanently? This cannot be undone.`)) return;
    try {
      await deleteMedicine(item.id);
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const totalQuantity = items.reduce((sum, i) => sum + (i.quantity || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Pill size={14} className="text-[#008751]" />
            <span>Pharmaceutical Services</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Medicine Registry</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Medicine Registry</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage medicine inventory across hospitals</p>
        </div>
        {canManage && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Medicine</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Medicines" value={pagination.total} icon={Pill} color="primary" subtitle="All medicines" />
        <StatCard title="Total Quantity" value={totalQuantity} icon={Package} color="teal" subtitle="Units in stock" />
        <StatCard title="Hospitals" value={new Set(items.map(i => i.hospital_id)).size} icon={Building2} color="blue" subtitle="Hospitals with stock" />
        <StatCard title="Batch Count" value={new Set(items.map(i => i.batch_number)).size} icon={Hash} color="army" subtitle="Unique batches" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search by name or generic name..." value={search} onChange={e => setSearch(e.target.value)} />
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
              <Pill size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No medicines found.</p>
              {canManage && <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Add Medicine</button>}
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Generic Name</th>
                  <th>Strength</th>
                  <th>Dosage Form</th>
                  <th>Hospital</th>
                  <th>Batch #</th>
                  <th>Expiry</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  {canManage && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <Pill size={18} className="text-[#008751]" />
                        </div>
                        <span className="font-medium text-slate-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="text-slate-600 text-sm">{item.generic_name || '-'}</td>
                    <td>{item.strength || '-'}</td>
                    <td>{item.dosage_form || '-'}</td>
                    <td>{item.hospital_name || '-'}</td>
                    <td className="font-mono text-sm">{item.batch_number || '-'}</td>
                    <td>
                      <span className="flex items-center gap-1 text-sm">
                        <Calendar size={12} className="text-slate-400" />
                        {item.expiry_date || '-'}
                      </span>
                    </td>
                    <td className="font-semibold text-slate-900">{item.quantity || 0}</td>
                    <td>{item.unit || '-'}</td>
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Medicine' : 'Add Medicine'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Generic Name</label>
              <input className="input" value={form.generic_name} onChange={e => setForm({ ...form, generic_name: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Strength</label>
              <input className="input" value={form.strength} onChange={e => setForm({ ...form, strength: e.target.value })} />
            </div>
            <div>
              <label className="label">Dosage Form</label>
              <input className="input" value={form.dosage_form} onChange={e => setForm({ ...form, dosage_form: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Manufacturer</label>
              <input className="input" value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} />
            </div>
            <div>
              <label className="label">Hospital</label>
              <select className="input" value={form.hospital_id} onChange={e => setForm({ ...form, hospital_id: e.target.value })} required>
                <option value="">Select hospital...</option>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Batch Number</label>
              <input className="input" value={form.batch_number} onChange={e => setForm({ ...form, batch_number: e.target.value })} />
            </div>
            <div>
              <label className="label">Expiry Date</label>
              <input type="date" className="input" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
            </div>
            <div>
              <label className="label">Quantity</label>
              <input type="number" min="0" className="input" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Unit</label>
            <input className="input" placeholder="e.g. tablets, bottles, vials" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editItem ? 'Update Medicine' : 'Create Medicine'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
