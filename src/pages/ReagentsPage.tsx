import { useState, useEffect } from 'react';
import { Pagination as PaginationType } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Pencil, Beaker, Building2, Package, AlertTriangle } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getLaboratoryReagents, createLaboratoryReagent, updateLaboratoryReagent } from '../lib/laboratory';
import { getAllHospitals } from '../lib/hospitals';
import { getHospitalScope } from '../lib/scope';

export default function ReagentsPage() {
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
  const [form, setForm] = useState({ hospital_id: '', reagent_name: '', lot_number: '', quantity: '', unit: '', expiry_date: '', storage_condition: '' });

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getLaboratoryReagents(page, 50, search || undefined, hospitalScope);
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
    setForm({ hospital_id: '', reagent_name: '', lot_number: '', quantity: '', unit: '', expiry_date: '', storage_condition: '' });
    loadHospitals();
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      hospital_id: item.hospital_id,
      reagent_name: item.reagent_name,
      lot_number: item.lot_number || '',
      quantity: String(item.quantity || ''),
      unit: item.unit || '',
      expiry_date: item.expiry_date || '',
      storage_condition: item.storage_condition || '',
    });
    loadHospitals();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        hospital_id: form.hospital_id,
        reagent_name: form.reagent_name,
        lot_number: form.lot_number,
        quantity: Number(form.quantity),
        unit: form.unit,
        expiry_date: form.expiry_date,
        storage_condition: form.storage_condition,
      };
      if (editItem) {
        await updateLaboratoryReagent(editItem.id, payload);
      } else {
        await createLaboratoryReagent(payload);
      }
      setShowModal(false);
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const isExpired = (date: string) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const expiredCount = items.filter(i => isExpired(i.expiry_date)).length;
  const totalQuantity = items.reduce((sum, i) => sum + (i.quantity || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Beaker size={14} className="text-[#008751]" />
            <span>Laboratory Services</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Reagents Inventory</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Reagents Inventory</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage reagent stock levels across laboratories</p>
        </div>
        {canManage && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Reagent</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Reagents" value={pagination.total} icon={Beaker} color="primary" subtitle="Inventory items" />
        <StatCard title="Total Quantity" value={totalQuantity} icon={Package} color="teal" subtitle="Units in stock" />
        <StatCard title="Expired" value={expiredCount} icon={AlertTriangle} color="orange" subtitle="Past expiry date" />
        <StatCard title="Hospitals" value={new Set(items.map(i => i.hospital_id)).size} icon={Building2} color="blue" subtitle="With reagent stock" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search by reagent name..." value={search} onChange={e => setSearch(e.target.value)} />
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
              <Beaker size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No reagents found.</p>
              {canManage && <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Add Reagent</button>}
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reagent Name</th>
                  <th>Hospital</th>
                  <th>Lot No.</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Expiry</th>
                  <th>Storage</th>
                  {canManage && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <Beaker size={18} className="text-[#008751]" />
                        </div>
                        <span className="font-medium text-slate-900">{item.reagent_name}</span>
                      </div>
                    </td>
                    <td>{item.hospital_name || '-'}</td>
                    <td className="text-sm font-mono">{item.lot_number || '-'}</td>
                    <td className="font-semibold text-slate-900">{item.quantity || 0}</td>
                    <td>{item.unit || '-'}</td>
                    <td>
                      <span className={isExpired(item.expiry_date) ? 'text-red-600 font-medium text-sm' : 'text-sm'}>
                        {item.expiry_date || '-'}
                        {isExpired(item.expiry_date) && ' (Expired)'}
                      </span>
                    </td>
                    <td className="text-sm">{item.storage_condition || '-'}</td>
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Reagent' : 'Add Reagent'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Reagent Name</label>
              <input className="input" value={form.reagent_name} onChange={e => setForm({ ...form, reagent_name: e.target.value })} required />
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
              <label className="label">Lot Number</label>
              <input className="input" value={form.lot_number} onChange={e => setForm({ ...form, lot_number: e.target.value })} />
            </div>
            <div>
              <label className="label">Unit</label>
              <select className="input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                <option value="">Select unit...</option>
                <option value="mL">mL</option>
                <option value="L">L</option>
                <option value="g">g</option>
                <option value="mg">mg</option>
                <option value="tests">Tests</option>
                <option value="pieces">Pieces</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity</label>
              <input type="number" min="0" className="input" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
            </div>
            <div>
              <label className="label">Expiry Date</label>
              <input type="date" className="input" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Storage Condition</label>
            <select className="input" value={form.storage_condition} onChange={e => setForm({ ...form, storage_condition: e.target.value })}>
              <option value="">Select condition...</option>
              <option value="Room Temperature">Room Temperature</option>
              <option value="Refrigerated (2-8°C)">Refrigerated (2-8°C)</option>
              <option value="Frozen (-20°C)">Frozen (-20°C)</option>
              <option value="Frozen (-80°C)">Frozen (-80°C)</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editItem ? 'Update Reagent' : 'Create Reagent'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
