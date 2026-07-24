import { useState, useEffect } from 'react';
import { Pagination as PaginationType } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Pencil, Trash2, Wrench, Building2, Calendar, DollarSign, Hammer } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getEquipmentMaintenance, createEquipmentMaintenance, updateEquipmentMaintenance, getAllLaboratoryEquipment } from '../lib/laboratory';
import { getAllHospitals } from '../lib/hospitals';
import { getHospitalScope } from '../lib/scope';

export default function MaintenanceRecordsPage() {
  const { hasRole, user } = useAuth();
  const canManage = hasRole('super_admin', 'lab_admin');
  const hospitalScope = getHospitalScope(user);
  const [items, setItems] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<{ id: string; hospital_name: string }[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [form, setForm] = useState({ equipment_id: '', hospital_id: '', maintenance_type: 'routine' as 'routine' | 'repair' | 'calibration', description: '', maintenance_date: '', performed_by: '', cost: '' });

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getEquipmentMaintenance(page, 50, search || undefined, undefined, hospitalScope);
      setItems(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadData(); };

  const loadFormData = async () => {
    try {
      const hData = await getAllHospitals(hospitalScope);
      setHospitals((hData || []).map((h: any) => ({ id: h.id, hospital_name: h.hospital_name })));
      const eData = await getAllLaboratoryEquipment();
      setEquipment(eData || []);
    } catch {}
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ equipment_id: '', hospital_id: '', maintenance_type: 'routine', description: '', maintenance_date: '', performed_by: '', cost: '' });
    loadFormData();
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      equipment_id: item.equipment_id,
      hospital_id: item.hospital_id,
      maintenance_type: item.maintenance_type || 'routine',
      description: item.description || '',
      maintenance_date: item.maintenance_date || '',
      performed_by: item.performed_by || '',
      cost: String(item.cost || ''),
    });
    loadFormData();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        equipment_id: form.equipment_id,
        hospital_id: form.hospital_id,
        maintenance_type: form.maintenance_type,
        description: form.description,
        maintenance_date: form.maintenance_date,
        performed_by: form.performed_by,
        cost: Number(form.cost),
      };
      if (editItem) {
        await updateEquipmentMaintenance(editItem.id, payload);
      } else {
        await createEquipmentMaintenance(payload);
      }
      setShowModal(false);
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Delete this maintenance record permanently?`)) return;
    try {
      await updateEquipmentMaintenance(item.id, { status: 'inactive' });
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const totalCost = items.reduce((sum, i) => sum + (i.cost || 0), 0);

  const getEquipmentName = (id: string) => {
    const eq = equipment.find(e => e.id === id);
    return eq?.equipment_name || id;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Wrench size={14} className="text-[#008751]" />
            <span>Laboratory Services</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Maintenance Records</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Records</h1>
          <p className="text-slate-500 mt-1 text-sm">Track equipment maintenance and repair history</p>
        </div>
        {canManage && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Record</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Records" value={pagination.total} icon={Hammer} color="primary" subtitle="All maintenance logs" />
        <StatCard title="Total Cost" value={totalCost} icon={DollarSign} color="teal" subtitle="Cumulative cost" />
        <StatCard title="Unique Equipment" value={new Set(items.map(i => i.equipment_id)).size} icon={Wrench} color="blue" subtitle="Equipment serviced" />
        <StatCard title="Hospitals" value={new Set(items.map(i => i.hospital_id)).size} icon={Building2} color="army" subtitle="Hospitals covered" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search records..." value={search} onChange={e => setSearch(e.target.value)} />
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
              <Wrench size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No maintenance records found.</p>
              {canManage && <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Add Record</button>}
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Hospital</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Performed By</th>
                  <th>Cost</th>
                  {canManage && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <Wrench size={18} className="text-[#008751]" />
                        </div>
                        <span className="font-medium text-slate-900">{getEquipmentName(item.equipment_id)}</span>
                      </div>
                    </td>
                    <td>{item.hospital_name || '-'}</td>
                    <td><span className="badge-active">{item.maintenance_type}</span></td>
                    <td className="text-sm">{item.maintenance_date || '-'}</td>
                    <td className="text-sm">{item.performed_by || '-'}</td>
                    <td className="font-semibold text-slate-900">{item.cost ? `${item.cost.toLocaleString()}` : '-'}</td>
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Maintenance Record' : 'Add Maintenance Record'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Equipment</label>
              <select className="input" value={form.equipment_id} onChange={e => {
                const eq = equipment.find(eq => eq.id === e.target.value);
                setForm({ ...form, equipment_id: e.target.value, hospital_id: eq?.hospital_id || form.hospital_id });
              }} required>
                <option value="">Select equipment...</option>
                {equipment.map(e => <option key={e.id} value={e.id}>{e.equipment_name}</option>)}
              </select>
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
              <label className="label">Maintenance Type</label>
              <select className="input" value={form.maintenance_type} onChange={e => setForm({ ...form, maintenance_type: e.target.value as any })} required>
                <option value="routine">Routine</option>
                <option value="repair">Repair</option>
                <option value="calibration">Calibration</option>
              </select>
            </div>
            <div>
              <label className="label">Maintenance Date</label>
              <input type="date" className="input" value={form.maintenance_date} onChange={e => setForm({ ...form, maintenance_date: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Performed By</label>
              <input className="input" value={form.performed_by} onChange={e => setForm({ ...form, performed_by: e.target.value })} required />
            </div>
            <div>
              <label className="label">Cost</label>
              <input type="number" min="0" className="input" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
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
