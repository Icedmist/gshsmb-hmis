import { useState, useEffect } from 'react';
import { Pagination as PaginationType } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Pencil, Trash2, Wrench, Building2, Cpu, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getLaboratoryEquipment, createLaboratoryEquipment, updateLaboratoryEquipment, deleteLaboratoryEquipment } from '../lib/laboratory';
import { getAllHospitals } from '../lib/hospitals';
import { getHospitalScope } from '../lib/scope';

export default function EquipmentRegistryPage() {
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
  const [form, setForm] = useState({ hospital_id: '', equipment_name: '', model: '', serial_number: '', status: 'operational', last_maintenance_date: '', next_maintenance_date: '' });

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getLaboratoryEquipment(page, 50, search || undefined, hospitalScope);
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
    setForm({ hospital_id: '', equipment_name: '', model: '', serial_number: '', status: 'operational', last_maintenance_date: '', next_maintenance_date: '' });
    loadHospitals();
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      hospital_id: item.hospital_id,
      equipment_name: item.equipment_name,
      model: item.model || '',
      serial_number: item.serial_number || '',
      status: item.status || 'operational',
      last_maintenance_date: item.last_maintenance_date || '',
      next_maintenance_date: item.next_maintenance_date || '',
    });
    loadHospitals();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        hospital_id: form.hospital_id,
        equipment_name: form.equipment_name,
        model: form.model,
        serial_number: form.serial_number,
        status: form.status,
        last_maintenance_date: form.last_maintenance_date,
        next_maintenance_date: form.next_maintenance_date,
      };
      if (editItem) {
        await updateLaboratoryEquipment(editItem.id, payload);
      } else {
        await createLaboratoryEquipment(payload);
      }
      setShowModal(false);
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Delete ${item.equipment_name} permanently?`)) return;
    try {
      await deleteLaboratoryEquipment(item.id);
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const statusColors: Record<string, string> = {
    operational: 'badge-active',
    maintenance: 'bg-amber-100 text-amber-700',
    faulty: 'bg-red-100 text-red-700',
    decommissioned: 'bg-slate-100 text-slate-600',
  };

  const operationalCount = items.filter(i => i.status === 'operational').length;
  const maintenanceCount = items.filter(i => i.status === 'maintenance').length;
  const faultyCount = items.filter(i => i.status === 'faulty').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Wrench size={14} className="text-[#008751]" />
            <span>Laboratory Services</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Equipment Registry</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Equipment Registry</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage laboratory equipment inventory across hospitals</p>
        </div>
        {canManage && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Equipment</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Equipment" value={pagination.total} icon={Cpu} color="primary" subtitle="All registered items" />
        <StatCard title="Operational" value={operationalCount} icon={CheckCircle} color="teal" subtitle="Fully functional" />
        <StatCard title="Under Maintenance" value={maintenanceCount} icon={Clock} color="orange" subtitle="Being serviced" />
        <StatCard title="Faulty" value={faultyCount} icon={AlertTriangle} color="lemon" subtitle="Needs repair" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search by equipment name..." value={search} onChange={e => setSearch(e.target.value)} />
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
              <p className="text-slate-500 text-sm">No equipment found.</p>
              {canManage && <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Add Equipment</button>}
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Equipment Name</th>
                  <th>Hospital</th>
                  <th>Model</th>
                  <th>Serial No.</th>
                  <th>Status</th>
                  <th>Last Maintenance</th>
                  <th>Next Maintenance</th>
                  {canManage && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <Cpu size={18} className="text-[#008751]" />
                        </div>
                        <span className="font-medium text-slate-900">{item.equipment_name}</span>
                      </div>
                    </td>
                    <td>{item.hospital_name || '-'}</td>
                    <td className="text-sm">{item.model || '-'}</td>
                    <td className="text-sm font-mono">{item.serial_number || '-'}</td>
                    <td>
                      <span className={statusColors[item.status] || 'badge-active'}>{item.status}</span>
                    </td>
                    <td className="text-sm">{item.last_maintenance_date || '-'}</td>
                    <td className="text-sm">{item.next_maintenance_date || '-'}</td>
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Equipment' : 'Add Equipment'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Equipment Name</label>
              <input className="input" value={form.equipment_name} onChange={e => setForm({ ...form, equipment_name: e.target.value })} required />
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
              <label className="label">Model</label>
              <input className="input" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
            </div>
            <div>
              <label className="label">Serial Number</label>
              <input className="input" value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} required>
              <option value="operational">Operational</option>
              <option value="maintenance">Under Maintenance</option>
              <option value="faulty">Faulty</option>
              <option value="decommissioned">Decommissioned</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Last Maintenance Date</label>
              <input type="date" className="input" value={form.last_maintenance_date} onChange={e => setForm({ ...form, last_maintenance_date: e.target.value })} />
            </div>
            <div>
              <label className="label">Next Maintenance Date</label>
              <input type="date" className="input" value={form.next_maintenance_date} onChange={e => setForm({ ...form, next_maintenance_date: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editItem ? 'Update Equipment' : 'Create Equipment'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
