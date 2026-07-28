import { useState, useEffect } from 'react';
import type { Pagination as PaginationType } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Pencil, Trash2, HeartPulse, Layers, Activity, Bookmark } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getEssentialMedicines, createEssentialMedicine, updateEssentialMedicine, deleteEssentialMedicine } from '../lib/pharmaceutical';

export default function EssentialMedicinesPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('super_admin', 'pharmacy_admin');
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: '', generic_name: '', strength: '', dosage_form: '', therapeutic_category: '', level: 'primary',
  });

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getEssentialMedicines(page, 50, search || undefined);
      setItems(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally {
      setLoading(false);
    }
  };

// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadData(); };

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', generic_name: '', strength: '', dosage_form: '', therapeutic_category: '', level: 'primary' });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      name: item.name, generic_name: item.generic_name, strength: item.strength,
      dosage_form: item.dosage_form, therapeutic_category: item.therapeutic_category,
      level: item.level || 'primary',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editItem) {
        await updateEssentialMedicine(editItem.id, form);
      } else {
        await createEssentialMedicine(form);
      }
      setShowModal(false);
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Delete ${item.name} permanently? This cannot be undone.`)) return;
    try {
      await deleteEssentialMedicine(item.id);
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const levelCounts = { primary: 0, secondary: 0, tertiary: 0 };
  items.forEach(i => { if (i.level in levelCounts) levelCounts[i.level as keyof typeof levelCounts]++; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <HeartPulse size={14} className="text-[#008751]" />
            <span>Pharmaceutical Services</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Essential Medicines</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Essential Medicines</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage essential medicines list by therapeutic category and care level</p>
        </div>
        {canManage && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Medicine</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Essential" value={pagination.total} icon={HeartPulse} color="primary" subtitle="Essential medicines" />
        <StatCard title="Primary Level" value={levelCounts.primary} icon={Layers} color="teal" subtitle="Primary care" />
        <StatCard title="Secondary Level" value={levelCounts.secondary} icon={Activity} color="blue" subtitle="Secondary care" />
        <StatCard title="Tertiary Level" value={levelCounts.tertiary} icon={Bookmark} color="army" subtitle="Tertiary care" />
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
              <HeartPulse size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No essential medicines found.</p>
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
                  <th>Therapeutic Category</th>
                  <th>Level</th>
                  {canManage && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <HeartPulse size={18} className="text-[#008751]" />
                        </div>
                        <span className="font-medium text-slate-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="text-slate-600 text-sm">{item.generic_name || '-'}</td>
                    <td>{item.strength || '-'}</td>
                    <td>{item.dosage_form || '-'}</td>
                    <td>{item.therapeutic_category || '-'}</td>
                    <td><span className="badge-active">{item.level}</span></td>
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Essential Medicine' : 'Add Essential Medicine'} size="lg">
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
          <div>
            <label className="label">Therapeutic Category</label>
            <input className="input" value={form.therapeutic_category} onChange={e => setForm({ ...form, therapeutic_category: e.target.value })} />
          </div>
          <div>
            <label className="label">Level</label>
            <select className="input" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} required>
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="tertiary">Tertiary</option>
            </select>
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
