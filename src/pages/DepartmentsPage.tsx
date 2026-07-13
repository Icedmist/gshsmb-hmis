import React, { useState, useEffect, useMemo } from 'react';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../lib/departments';
import { getAllHospitals } from '../lib/hospitals';
import { Department } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Pencil, Trash2, Building, Check, X, ChevronDown, ChevronRight, Hospital, Shield, Activity, Layers } from 'lucide-react';
import StatCard from '../components/common/StatCard';

export default function DepartmentsPage() {
  const { user, hasRole } = useAuth();
  const canManage = hasRole('super_admin', 'hospital_admin');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [hospitals, setHospitals] = useState<{ id: string; hospital_name: string; hospital_code: string }[]>([]);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number }>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [form, setForm] = useState({ department_name: '', department_code: '', description: '', hospital_ids: [] as string[] });
  const [manageDept, setManageDept] = useState<Department[] | null>(null);
  const [expandedName, setExpandedName] = useState<string | null>(null);

  const hospitalScope = user?.role === 'hospital_admin' ? (user.hospital_id || undefined) : undefined;

  const loadDepartments = async (page = 1) => {
    setLoading(true);
    try {
      const result = await getDepartments(page, 50, search || undefined, undefined, hospitalScope);
      const depts = result.data.map((d: any) => ({
        id: d.id,
        department_name: d.department_name,
        department_code: d.department_code,
        description: d.description || '',
        hospital_id: d.hospital_id,
        hospital_name: d.hospital_name || '',
        status: d.status,
        created_at: d.created_at || '',
        updated_at: d.updated_at || '',
      })) as Department[];
      setDepartments(depts);
      setPagination({ page, limit: 50, total: result.total, totalPages: Math.ceil(result.total / 50) });
    } catch {
      setDepartments([]);
      setPagination({ page: 1, limit: 50, total: 0, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  };

  const loadHospitals = async () => {
    try {
      const data = await getAllHospitals();
      setHospitals((data || []).map((h: any) => ({ id: h.id, hospital_name: h.hospital_name, hospital_code: h.hospital_code })));
    } catch {}
  };

  useEffect(() => { loadDepartments(); loadHospitals(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadDepartments(); };

  const groupedDepts = useMemo(() => {
    const groups: Record<string, Department[]> = {};
    for (const d of departments) {
      if (!groups[d.department_name]) groups[d.department_name] = [];
      groups[d.department_name].push(d);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [departments]);

  const openCreate = () => {
    setEditDept(null);
    setForm({ department_name: '', department_code: '', description: '', hospital_ids: [] });
    setShowModal(true);
  };

  const openEdit = (d: Department) => {
    setEditDept(d);
    setForm({ department_name: d.department_name, department_code: d.department_code, description: d.description || '', hospital_ids: [d.hospital_id] });
    setShowModal(true);
  };

  const toggleHospital = (id: string) => {
    setForm(prev => ({
      ...prev,
      hospital_ids: prev.hospital_ids.includes(id)
        ? prev.hospital_ids.filter(h => h !== id)
        : [...prev.hospital_ids, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editDept) {
        await updateDepartment(String(editDept.id), {
          department_name: form.department_name,
          department_code: form.department_code,
          description: form.description,
          hospital_id: String(form.hospital_ids[0]),
        });
      } else {
        await createDepartment(
          form.department_name,
          form.department_code,
          form.description,
          form.hospital_ids.map(String),
        );
      }
      setShowModal(false);
      loadDepartments(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (d: Department) => {
    if (!confirm(`Delete ${d.department_name} (${d.hospital_name}) permanently? This cannot be undone.`)) return;
    try {
      await deleteDepartment(String(d.id));
      loadDepartments(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleToggleStatus = async (d: Department) => {
    const newStatus = d.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} ${d.department_name} at ${d.hospital_name}?`)) return;
    try {
      await updateDepartment(String(d.id), { status: newStatus });
      loadDepartments(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const hospitalMap = useMemo(() => {
    const m = new Map<string, typeof hospitals[0]>();
    for (const h of hospitals) m.set(h.id, h);
    return m;
  }, [hospitals]);

  const getGroupStatus = (items: Department[]) => {
    const allActive = items.every(d => d.status === 'active');
    const allInactive = items.every(d => d.status === 'inactive');
    return allActive ? 'active' : allInactive ? 'inactive' : 'mixed';
  };

  const getBaseCode = (code: string) => {
    const idx = code.indexOf('-');
    return idx > 0 ? code.substring(0, idx) : code;
  };

  const getHospitalName = (d: Department) => {
    if (d.hospital_name) return d.hospital_name;
    const h = hospitalMap.get(d.hospital_id);
    return h?.hospital_name || `Hospital #${d.hospital_id}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Building size={14} className="text-[#008751]" />
            <span>Records</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Departments</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage departments grouped by name across all hospitals</p>
        </div>
        {canManage && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Department</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Departments" value={pagination.total} icon={Building} color="primary" subtitle="Across all hospitals" />
        <StatCard title="Unique Names" value={groupedDepts.length} icon={Layers} color="teal" subtitle="Distinct department names" />
        <StatCard title="Covered Hospitals" value={new Set(departments.map(d => d.hospital_id)).size} icon={Hospital} color="blue" subtitle="With linked departments" />
        <StatCard title="Active" value={departments.filter(d => d.status === 'active').length} icon={Activity} color="army" subtitle="Currently active" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search departments..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button type="submit" className="btn-secondary">Search</button>
          </form>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-12">
              <Building size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No departments found.</p>
              {canManage && <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Add Department</button>}
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="w-8"></th>
                  <th>Department Name</th>
                  <th>Code</th>
                  <th>Hospitals</th>
                  <th>Status</th>
                  {canManage && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {groupedDepts.map(([name, items]) => {
                  const status = getGroupStatus(items);
                  const isExpanded = expandedName === name;
                  return (
                    <React.Fragment key={name}>
                      <tr
                        className={`group cursor-pointer transition-colors hover:bg-slate-50 ${isExpanded ? 'bg-slate-50' : ''}`}
                        onClick={() => setExpandedName(isExpanded ? null : name)}
                      >
                        <td className="w-8">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setExpandedName(isExpanded ? null : name); }}
                            className="p-1 rounded hover:bg-slate-200 transition-colors"
                          >
                            <ChevronRight size={14} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                              <Building size={18} className="text-[#008751]" />
                            </div>
                            <div>
                              <span className="font-medium text-slate-900">{name}</span>
                              <span className="ml-2 text-xs text-slate-400">({items.length})</span>
                            </div>
                          </div>
                        </td>
                        <td className="font-mono">{getBaseCode(items[0].department_code)}</td>
                        <td>
                          <div className="flex flex-wrap gap-1.5">
                            {items.slice(0, 4).map(d => (
                              <span key={d.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-700 rounded text-xs font-medium border border-sky-100">
                                <Hospital size={10} />
                                {getHospitalName(d)}
                              </span>
                            ))}
                            {items.length > 4 && (
                              <span className="text-xs text-slate-400 self-center ml-0.5">+{items.length - 4} more</span>
                            )}
                          </div>
                        </td>
                        <td>
                          {status === 'mixed' ? (
                            <span className="badge badge-warning">Mixed</span>
                          ) : (
                            <span className={status === 'active' ? 'badge-active' : 'badge-inactive'}>{status}</span>
                          )}
                        </td>
                        {canManage && (
                          <td>
                            <div className="flex items-center justify-end gap-2">
                              <button type="button" onClick={(e) => { e.stopPropagation(); setManageDept(items); }} className="btn btn-sm btn-secondary">
                                Manage
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                      {isExpanded && (
                        <tr key={`${name}-expanded`}>
                          <td colSpan={6} className="p-0 bg-slate-50/50">
                            <table className="w-full">
                              <tbody>
                                {items.map(d => (
                                  <tr key={d.id} className="border-t border-slate-100 hover:bg-white transition-colors">
                                    <td className="w-8"></td>
                                    <td>
                                      <span className="text-sm text-slate-500 ml-2">{d.department_name}</span>
                                    </td>
                                    <td className="font-mono text-sm">{d.department_code}</td>
                                    <td>
                                      <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-700 rounded text-xs font-medium border border-sky-100">
                                          <Hospital size={10} />
                                          {getHospitalName(d)}
                                        </span>
                                        {d.description && (
                                          <span className="text-xs text-slate-400 truncate max-w-[200px]">{d.description}</span>
                                        )}
                                      </div>
                                    </td>
                                    <td>
                                      <span className={d.status === 'active' ? 'badge-active' : 'badge-inactive'}>{d.status}</span>
                                    </td>
                                    {canManage && (
                                      <td className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          <button onClick={() => openEdit(d)} className="btn btn-xs btn-secondary p-1.5"><Pencil size={13} /></button>
                                          <button onClick={() => handleToggleStatus(d)} className="btn btn-xs btn-secondary p-1.5">
                                            {d.status === 'active' ? <X size={13} /> : <Check size={13} />}
                                          </button>
                                          <button onClick={() => handleDelete(d)} className="btn btn-xs btn-danger p-1.5"><Trash2 size={13} /></button>
                                        </div>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </div>
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadDepartments} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editDept ? 'Edit Department' : 'Add Department'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Department Name</label>
              <input className="input" value={form.department_name} onChange={e => setForm({ ...form, department_name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Department Code</label>
              <input className="input" value={form.department_code} onChange={e => setForm({ ...form, department_code: e.target.value })} required />
              {!editDept && form.hospital_ids.length > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  Will be saved as <strong>{form.department_code}-{'{HOSPITAL_CODE}'}</strong> per hospital
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="label">
              {editDept ? 'Hospital' : 'Assign to Hospitals'}
              {!editDept && <span className="text-xs text-slate-400 ml-2">(select one or more)</span>}
            </label>
            {editDept ? (
              <div className="relative">
                <select className="input appearance-none w-full" value={form.hospital_ids[0] || ''} onChange={e => setForm({ ...form, hospital_ids: [e.target.value] })} required>
                  <option value="">Select hospital...</option>
                  {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2">
                {hospitals.map(h => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => toggleHospital(h.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm border transition-all ${
                      form.hospital_ids.includes(h.id)
                        ? 'bg-[#008751]/10 border-[#008751] text-[#008751] font-medium'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      form.hospital_ids.includes(h.id) ? 'bg-[#008751] border-[#008751]' : 'border-slate-300'
                    }`}>
                      {form.hospital_ids.includes(h.id) && <Check size={12} className="text-white" />}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{h.hospital_name}</p>
                      <p className="text-[10px] text-slate-400">{h.hospital_code}</p>
                    </div>
                  </button>
                ))}
                {hospitals.length === 0 && <p className="text-sm text-slate-400 p-2">No hospitals available. Create a hospital first.</p>}
              </div>
            )}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          {!editDept && form.hospital_ids.length > 0 && (
            <div className="bg-emerald-50 rounded-lg px-4 py-2 text-sm text-emerald-700">
              Department will be created in <strong>{form.hospital_ids.length}</strong> hospital(s)
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={!editDept && form.hospital_ids.length === 0}>
              {editDept ? 'Update Department' : `Create Department (${form.hospital_ids.length} hospital${form.hospital_ids.length !== 1 ? 's' : ''})`}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={manageDept !== null} onClose={() => setManageDept(null)} title={manageDept?.[0]?.department_name || 'Manage Department'} size="md">
        {manageDept && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 mb-2">This department exists in {manageDept.length} hospital(s). Select one to manage:</p>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {manageDept.map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{getHospitalName(d)}</p>
                    <p className="text-xs text-slate-400">{d.department_code}</p>
                    {d.description && <p className="text-xs text-slate-400 mt-0.5">{d.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={d.status === 'active' ? 'badge-active' : 'badge-inactive'}>{d.status}</span>
                    <button
                      onClick={() => { setManageDept(null); openEdit(d); }}
                      className="btn btn-sm btn-secondary"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      onClick={() => { setManageDept(null); handleToggleStatus(d); }}
                      className="btn btn-sm btn-secondary"
                    >
                      {d.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => { setManageDept(null); handleDelete(d); }}
                      className="btn btn-sm btn-danger"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
