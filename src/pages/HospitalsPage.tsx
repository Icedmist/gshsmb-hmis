import { useState, useEffect } from 'react';
import { Hospital, Pagination as PaginationType } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Pencil, Trash2, Building2, Shield, Check, ChevronDown, Server, Activity, Phone, MapPin, X } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getHospitals, createHospital, updateHospital, deleteHospital } from '../lib/hospitals';
import { getDepartmentNames, createDepartment } from '../lib/departments';
import { getHospitalScope } from '../lib/scope';

export default function HospitalsPage() {
  const { hasRole, user } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editHospital, setEditHospital] = useState<Hospital | null>(null);
  const [form, setForm] = useState({ hospital_name: '', hospital_code: '', hospital_type: '', town_city: '', address: '', lga: '', contact_email: '', contact_phone: '' });
  const [existingDeptNames, setExistingDeptNames] = useState<{ department_name: string; base_code: string; description: string }[]>([]);
  const [selectedDeptNames, setSelectedDeptNames] = useState<string[]>([]);
  const [assigningDepts, setAssigningDepts] = useState(false);
  const [profileHospital, setProfileHospital] = useState<Hospital | null>(null);
  const isAdmin = hasRole('super_admin');

  const hospitalScope = getHospitalScope(user);

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
    setForm({ hospital_name: '', hospital_code: '', hospital_type: '', town_city: '', address: '', lga: '', contact_email: '', contact_phone: '' });
    setSelectedDeptNames([]);
    setAssigningDepts(false);
    loadDepartmentNames();
    setShowModal(true);
  };

  const openEdit = (h: Hospital) => {
    setEditHospital(h);
    setForm({ hospital_name: h.hospital_name, hospital_code: h.hospital_code, hospital_type: h.hospital_type || '', town_city: h.town_city || '', address: h.address, lga: h.lga, contact_email: h.contact_email || '', contact_phone: h.contact_phone || '' });
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
                    <th>Type</th>
                    <th>LGA / Town</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
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
                        <div>
                          <button onClick={() => setProfileHospital(h)} className="font-medium text-slate-900 hover:text-[#008751] transition-colors text-left">{h.hospital_name}</button>
                          <p className="text-[11px] text-slate-400">{h.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs">{h.hospital_code}</td>
                    <td><span className="text-sm text-slate-700">{h.hospital_type || '—'}</span></td>
                    <td>
                      <p className="text-sm text-slate-700">{h.lga}</p>
                      <p className="text-[11px] text-slate-400">{h.town_city || ''}</p>
                    </td>
                    <td>
                      <p className="text-sm">{h.contact_email || '-'}</p>
                      <p className="text-xs text-slate-400">{h.contact_phone || '-'}</p>
                    </td>
                    <td>
                      <span className={h.status === 'active' ? 'badge-active' : 'badge-inactive'}>{h.status}</span>
                    </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(h)} className="btn btn-sm btn-secondary"><Pencil size={14} /></button>
                          <button onClick={() => handleToggleStatus(h)} className="btn btn-sm btn-secondary">
                            {h.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => handleDelete(h)} className="btn btn-sm btn-danger"><Trash2 size={14} /></button>
                        </div>
                      </td>
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
              <input className="input" value={form.hospital_code} onChange={e => setForm({ ...form, hospital_code: e.target.value })} required placeholder="e.g. GSHSMB-GH-001" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Hospital Type</label>
              <select className="input" value={form.hospital_type} onChange={e => setForm({ ...form, hospital_type: e.target.value })} required>
                <option value="">Select type...</option>
                <option value="General Hospital">General Hospital</option>
                <option value="Cottage Hospital">Cottage Hospital</option>
                <option value="Specialist Hospital">Specialist Hospital</option>
                <option value="Clinic">Clinic</option>
                <option value="Health Center">Health Center</option>
                <option value="Teaching Hospital">Teaching Hospital</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Local Government Area</label>
              <input className="input" value={form.lga} onChange={e => setForm({ ...form, lga: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Town/City</label>
              <input className="input" value={form.town_city} onChange={e => setForm({ ...form, town_city: e.target.value })} required />
            </div>
            <div>
              <label className="label">Address</label>
              <input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone Number</label>
              <input type="tel" className="input" value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input type="email" className="input" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} required />
            </div>
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

      {/* Hospital Profile Modal */}
      <Modal open={!!profileHospital} onClose={() => setProfileHospital(null)} title="" size="lg">
        {profileHospital && (
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl p-6 text-white"
              style={{ background: 'linear-gradient(135deg, #001a0f 0%, #064e3b 50%, #006838 100%)' }}>
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-emerald-400/10 blur-[80px] pointer-events-none" />
              <div className="relative z-10 flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg ring-2 ring-white/20">
                  <Building2 size={32} className="text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold tracking-tight">{profileHospital.hospital_name}</h2>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-sm text-emerald-200/80 font-mono">{profileHospital.hospital_code}</span>
                    <span className="w-1 h-1 rounded-full bg-emerald-500/50" />
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      profileHospital.status === 'active' ? 'bg-emerald-400/20 text-emerald-200' : 'bg-slate-400/20 text-slate-300'
                    }`}>{profileHospital.status}</span>
                  </div>
                </div>
                <button onClick={() => setProfileHospital(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white/70 hover:text-white">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card border-t-2 border-t-emerald-400 shadow-sm">
                <div className="card-header bg-gradient-to-r from-emerald-50/50 to-transparent">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Building2 size={15} className="text-emerald-600" />
                    Hospital Info
                  </h3>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Hospital ID</p>
                    <p className="text-sm text-slate-800 mt-1 font-mono">{profileHospital.id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Hospital Code</p>
                    <p className="text-sm text-slate-800 mt-1 font-mono">{profileHospital.hospital_code}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Hospital Type</p>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 mt-1">
                      {profileHospital.hospital_type || '—'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Status</p>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold mt-1 ${
                      profileHospital.status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-400/20'
                    }`}>{profileHospital.status}</span>
                  </div>
                </div>
              </div>

              <div className="card border-t-2 border-t-sky-400 shadow-sm">
                <div className="card-header bg-gradient-to-r from-sky-50/50 to-transparent">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <MapPin size={15} className="text-sky-600" />
                    Location
                  </h3>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Address</p>
                    <p className="text-sm text-slate-800 mt-1">{profileHospital.address || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Town/City</p>
                    <p className="text-sm text-slate-800 mt-1">{profileHospital.town_city || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">LGA</p>
                    <p className="text-sm text-slate-800 mt-1">{profileHospital.lga || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-t-2 border-t-violet-400 shadow-sm">
              <div className="card-header bg-gradient-to-r from-violet-50/50 to-transparent">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Phone size={15} className="text-violet-600" />
                  Contact
                </h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">
                    <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wide">Phone Number</p>
                    <p className="text-lg font-bold text-violet-800 mt-1">{profileHospital.contact_phone || '—'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100">
                    <p className="text-[10px] font-semibold text-sky-600 uppercase tracking-wide">Email Address</p>
                    <p className="text-lg font-bold text-sky-800 mt-1 break-all">{profileHospital.contact_email || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              {isAdmin && (
                <button onClick={() => { setProfileHospital(null); openEdit(profileHospital); }} className="btn-primary">
                  <Pencil size={15} /> Edit Profile
                </button>
              )}
              <button onClick={() => setProfileHospital(null)} className="btn-secondary">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
