import { useState, useEffect } from 'react';
import { Hospital, Pagination as PaginationType } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Pencil, Trash2, Building2, Shield, Check, ChevronDown, Server, Activity } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getHospitals, createHospital, updateHospital, deleteHospital } from '../lib/hospitals';
import { getDepartmentNames, createDepartment } from '../lib/departments';

export default function HospitalsPage() {
  const { hasRole, user } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editHospital, setEditHospital] = useState<Hospital | null>(null);
  const [form, setForm] = useState({ hospital_name: '', hospital_code: '', address: '', lga: '', contact_email: '', contact_phone: '' });
  const [existingDeptNames, setExistingDeptNames] = useState<{ department_name: string; base_code: string; description: string }[]>([]);
  const [selectedDeptNames, setSelectedDeptNames] = useState<string[]>([]);
  const [assigningDepts, setAssigningDepts] = useState(false);
  const isAdmin = hasRole('super_admin');

  const hospitalScope = user?.role === 'hospital_admin' ? (user.hospital_id || undefined) : undefined;

  const loadHospitals = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getHospitals(page, 50, search, undefined, hospitalScope);
      setHospitals(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHospitals(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadHospitals(); };

  const loadDepartmentNames = async () => {
    try {
      const data = await getDepartmentNames();
      setExistingDeptNames(data || []);
    } catch {}
  };

  const openCreate = () => {
    setEditHospital(null);
    setForm({ hospital_name: '', hospital_code: '', address: '', lga: '', contact_email: '', contact_phone: '' });
    setSelectedDeptNames([]);
    setAssigningDepts(false);
    loadDepartmentNames();
    setShowModal(true);
  };

  const openEdit = (h: Hospital) => {
    setEditHospital(h);
    setForm({ hospital_name: h.hospital_name, hospital_code: h.hospital_code, address: h.address, lga: h.lga, contact_email: h.contact_email || '', contact_phone: h.contact_phone || '' });
    setSelectedDeptNames([]);
    setAssigningDepts(false);
    loadDepartmentNames();
    setShowModal(true);
  };

  const toggleDepartment = (name: string) => {
    setSelectedDeptNames(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const toggleAllDepartments = () => {
    if (selectedDeptNames.length === existingDeptNames.length) {
      setSelectedDeptNames([]);
    } else {
      setSelectedDeptNames(existingDeptNames.map(d => d.department_name));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editHospital) {
        await updateHospital(editHospital.id, form);
      } else {
        const createdId = await createHospital({ ...form, status: 'active' });
        if (selectedDeptNames.length > 0) {
          for (const deptName of selectedDeptNames) {
            const dept = existingDeptNames.find(d => d.department_name === deptName);
            if (!dept) continue;
            try {
              await createDepartment(dept.department_name, dept.base_code, dept.description || '', [createdId]);
            } catch {}
          }
        }
      }
      setShowModal(false);
      loadHospitals(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (h: Hospital) => {
    if (!confirm(`Delete ${h.hospital_name} permanently? This cannot be undone.`)) return;
    try {
      await deleteHospital(h.id);
      loadHospitals(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleToggleStatus = async (h: Hospital) => {
    const newStatus = h.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} ${h.hospital_name}?`)) return;
    try {
      await updateHospital(h.id, { status: newStatus });
      loadHospitals(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Building2 size={14} className="text-[#008751]" />
            <span>Records</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Hospitals</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Hospitals</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage hospitals under GSHSMB across Gombe State</p>
        </div>
        {isAdmin && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Hospital</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Hospitals" value={pagination.total} icon={Building2} color="primary" subtitle="Registered facilities" />
        <StatCard title="Active" value={hospitals.filter(h => h.status === 'active').length} icon={Server} color="teal" subtitle="Operational facilities" />
        <StatCard title="Inactive" value={hospitals.filter(h => h.status === 'inactive').length} icon={Activity} color="blue" subtitle="Non-operational" />
        <StatCard title="LGAs Covered" value={new Set(hospitals.map(h => h.lga)).size} icon={Building2} color="army" subtitle="Local government areas" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search hospitals by name, code, or LGA..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button type="submit" className="btn-secondary">Search</button>
          </form>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : hospitals.length === 0 ? (
            <div className="text-center py-12">
              <Building2 size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No hospitals found.</p>
              {isAdmin && <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Add Hospital</button>}
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>LGA</th>
                  <th>Contact</th>
                  <th>Status</th>
                  {isAdmin && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {hospitals.map(h => (
                  <tr key={h.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <Building2 size={18} className="text-[#008751]" />
                        </div>
                        <span className="font-medium text-slate-900">{h.hospital_name}</span>
                      </div>
                    </td>
                    <td className="font-mono">{h.hospital_code}</td>
                    <td>{h.lga}</td>
                    <td>
                      <p>{h.contact_email || '-'}</p>
                      <p className="text-xs text-slate-400">{h.contact_phone || '-'}</p>
                    </td>
                    <td>
                      <span className={h.status === 'active' ? 'badge-active' : 'badge-inactive'}>{h.status}</span>
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(h)} className="btn btn-sm btn-secondary"><Pencil size={14} /></button>
                          <button onClick={() => handleToggleStatus(h)} className="btn btn-sm btn-secondary">
                            {h.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => handleDelete(h)} className="btn btn-sm btn-danger"><Trash2 size={14} /></button>
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
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadHospitals} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editHospital ? 'Edit Hospital' : 'Add Hospital'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Hospital Name</label>
              <input className="input" value={form.hospital_name} onChange={e => setForm({ ...form, hospital_name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Hospital Code</label>
              <input className="input" value={form.hospital_code} onChange={e => setForm({ ...form, hospital_code: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <textarea className="input" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Local Government Area</label>
              <input className="input" value={form.lga} onChange={e => setForm({ ...form, lga: e.target.value })} required />
            </div>
            <div>
              <label className="label">Contact Email</label>
              <input type="email" className="input" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Contact Phone</label>
            <input className="input" value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} />
          </div>

          {!editHospital && existingDeptNames.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setAssigningDepts(!assigningDepts)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-[#008751]" />
                  <span className="text-sm font-medium text-slate-700">Assign Existing Departments</span>
                  {selectedDeptNames.length > 0 && (
                    <span className="text-xs bg-[#008751] text-white px-2 py-0.5 rounded-full">{selectedDeptNames.length} selected</span>
                  )}
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${assigningDepts ? 'rotate-180' : ''}`} />
              </button>
              {assigningDepts && (
                <div className="p-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-slate-500">Select existing departments to copy to this new hospital</p>
                    <button type="button" onClick={toggleAllDepartments} className="text-xs text-[#008751] font-medium hover:underline">
                      {selectedDeptNames.length === existingDeptNames.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {existingDeptNames.map(d => (
                      <button
                        key={d.department_name}
                        type="button"
                        onClick={() => toggleDepartment(d.department_name)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm border transition-all ${
                          selectedDeptNames.includes(d.department_name)
                            ? 'bg-[#008751]/10 border-[#008751] text-[#008751] font-medium'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedDeptNames.includes(d.department_name) ? 'bg-[#008751] border-[#008751]' : 'border-slate-300'
                        }`}>
                          {selectedDeptNames.includes(d.department_name) && <Check size={12} className="text-white" />}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium">{d.department_name}</p>
                          <p className="text-[10px] text-slate-400">{d.base_code}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">
              {editHospital ? 'Update Hospital' : `Create Hospital${selectedDeptNames.length > 0 ? ` + ${selectedDeptNames.length} Dept(s)` : ''}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
