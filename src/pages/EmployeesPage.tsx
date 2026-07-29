import { useState, useEffect } from 'react';
import { Employee, Pagination as PaginationType } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Pencil, Trash2, ArrowRightLeft, Users, ChevronDown, UserCheck, UserX, User } from 'lucide-react';
import { POSITION_CATEGORIES } from '../types';
import StatCard from '../components/common/StatCard';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, transferEmployee } from '../lib/employees';
import { getAllHospitals } from '../lib/hospitals';
import { getAllDepartments } from '../lib/departments';
import { getHospitalScope } from '../lib/scope';

export default function EmployeesPage() {
  const { user, hasRole } = useAuth();
  const canManage = hasRole('super_admin', 'hospital_admin', 'hr_officer', 'director_hr');
  const canTransfer = hasRole('super_admin', 'hr_officer', 'director_hr');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [hospitals, setHospitals] = useState<{ id: string; hospital_name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; department_name: string; hospital_id: string }[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTransfer, setShowTransfer] = useState<Employee | null>(null);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [form, setForm] = useState({ staff_id: '', full_name: '', gender: '', phone_number: '', email: '', position: '', department_id: '', hospital_id: '', employment_date: '' });
  const [transferForm, setTransferForm] = useState({ to_hospital_id: '', to_department_id: '', transfer_date: '', reason: '' });

  const hospitalScope = getHospitalScope(user);

  const loadEmployees = async (page = 1) => {
    setLoading(true);
    try {
      const result = await getEmployees(
        page,
        50,
        search || undefined,
        hospitalFilter || undefined,
        undefined,
        statusFilter || undefined,
        hospitalScope,
      );
      setEmployees(result.data);
      setPagination({ page, limit: 50, total: result.total, totalPages: Math.ceil(result.total / 50) });
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceData = async () => {
    try {
      const [hData, dData] = await Promise.all([
        getAllHospitals(hospitalScope),
        getAllDepartments(hospitalScope),
      ]);
      setHospitals((hData || []).map((h: any) => ({ id: h.id, hospital_name: h.hospital_name })));
      setDepartments((dData || []).map((d: any) => ({ id: d.id, department_name: d.department_name, hospital_id: d.hospital_id })));
    } catch (err: any) { console.error('Failed to load reference data:', err); }
  };

  useEffect(() => { loadEmployees(); loadReferenceData(); }, []);

  useEffect(() => {
    loadEmployees();
  }, [hospitalFilter]);

  useEffect(() => {
    if (showModal) loadReferenceData();
  }, [showModal]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadEmployees(); };

  const openCreate = () => {
    setEditEmp(null);
    setForm({ staff_id: '', full_name: '', gender: '', phone_number: '', email: '', position: '', department_id: '', hospital_id: '', employment_date: '' });
    setShowModal(true);
  };

  const openEdit = (e: Employee) => {
    setEditEmp(e);
    setForm({ staff_id: e.staff_id, full_name: e.full_name, gender: e.gender || '', phone_number: e.phone_number || '', email: e.email || '', position: e.position, department_id: String(e.department_id), hospital_id: String(e.hospital_id), employment_date: e.employment_date });
    setShowModal(true);
  };

  const getFilteredDepartments = (hospitalId: string) => {
    return departments.filter(d => d.hospital_id === hospitalId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (editEmp) {
        await updateEmployee(String(editEmp.id), payload);
      } else {
        await createEmployee(payload);
      }
      setShowModal(false);
      loadEmployees(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTransfer) return;
    try {
      await transferEmployee(
        String(showTransfer.id),
        transferForm.to_hospital_id,
        transferForm.to_department_id,
        transferForm.transfer_date,
        transferForm.reason,
        user?.id || '',
      );
      setShowTransfer(null);
      loadEmployees(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleToggleStatus = async (e: Employee) => {
    const newStatus = e.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} ${e.full_name}?`)) return;
    try {
      await updateEmployee(String(e.id), { status: newStatus });
      loadEmployees(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (e: Employee) => {
    if (!confirm(`Delete ${e.full_name} (${e.staff_id}) permanently? This cannot be undone.`)) return;
    try {
      await deleteEmployee(String(e.id));
      loadEmployees(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Users size={14} className="text-[#008751]" />
            <span>Records</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Employees</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage staff records across all hospitals</p>
        </div>
        {canManage && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Employee</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Employees" value={pagination.total} icon={Users} color="primary" subtitle="All staff records" />
        <StatCard title="Active" value={employees.filter(e => e.status === 'active').length} icon={UserCheck} color="teal" subtitle="Currently employed" />
        <StatCard title="Inactive" value={employees.filter(e => e.status === 'inactive').length} icon={UserX} color="blue" subtitle="Inactive records" />
        <StatCard title="Suspended" value={employees.filter(e => e.status === 'suspended').length} icon={User} color="army" subtitle="Suspended staff" />
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setHospitalFilter('')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                !hospitalFilter
                  ? 'bg-[#008751] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users size={15} />
              All Hospitals
            </button>
            {hospitals.map(h => (
              <button
                key={h.id}
                onClick={() => setHospitalFilter(String(h.id))}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  hospitalFilter === String(h.id)
                    ? 'bg-[#008751] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                {h.hospital_name}
              </button>
            ))}
          </div>
        </div>
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3 flex-wrap items-center">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search by name, staff ID, or email..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="relative">
              <select className="input w-36 appearance-none" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); }}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button type="submit" className="btn-secondary">Search</button>
            {hospitalFilter && (
              <span className="text-xs text-slate-400 ml-auto">
                Showing {pagination.total} employee{pagination.total !== 1 ? 's' : ''} at {hospitals.find(h => h.id === hospitalFilter)?.hospital_name}
              </span>
            )}
          </form>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12">
              <Users size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No employees found.</p>
              {canManage && <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Add Employee</button>}
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Hospital</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(e => (
                  <tr key={e.id}>
                    <td className="font-mono font-medium">{e.staff_id}</td>
                    <td className="font-medium text-slate-900">{e.full_name}</td>
                    <td className="text-slate-500">{e.gender || '-'}</td>
                    <td>{e.position}</td>
                    <td className="text-slate-500">{e.department_name || '-'}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        hospitalFilter
                          ? 'bg-[#008751]/10 text-[#008751]'
                          : 'bg-sky-50 text-sky-700'
                      }`}>
                        {e.hospital_name || '-'}
                      </span>
                    </td>
                    <td>
                      <span className={e.status === 'active' ? 'badge-active' : e.status === 'suspended' ? 'badge-suspended' : 'badge-inactive'}>{e.status}</span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        {canManage && <button onClick={() => openEdit(e)} className="btn btn-sm btn-secondary"><Pencil size={14} /></button>}
                        {canTransfer && (
                          <button onClick={() => { setShowTransfer(e); setTransferForm({ to_hospital_id: '', to_department_id: '', transfer_date: '', reason: '' }); }} className="btn btn-sm btn-secondary"><ArrowRightLeft size={14} /></button>
                        )}
                        <button onClick={() => handleToggleStatus(e)} className="btn btn-sm btn-secondary">
                          {e.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => handleDelete(e)} className="btn btn-sm btn-danger"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            {hospitalFilter
              ? `Showing ${pagination.total} employee${pagination.total !== 1 ? 's' : ''} at ${hospitals.find(h => h.id === hospitalFilter)?.hospital_name || ''}`
              : `${pagination.total} employee${pagination.total !== 1 ? 's' : ''} across all hospitals`}
          </p>
          <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadEmployees} />
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editEmp ? 'Edit Employee' : 'Add Employee'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Staff ID</label>
              <input className="input" value={form.staff_id} onChange={e => setForm({ ...form, staff_id: e.target.value })} required />
            </div>
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Position</label>
              <div className="relative">
                <select className="input appearance-none" value={POSITION_CATEGORIES.includes(form.position as any) ? form.position : 'other'} onChange={e => setForm({ ...form, position: e.target.value === 'other' ? '' : e.target.value })} required>
                  <option value="">Select position...</option>
                  {POSITION_CATEGORIES.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="other">Other (specify)</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              {!POSITION_CATEGORIES.includes(form.position as any) && form.position && (
                <input className="input mt-2" placeholder="Enter position" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} required />
              )}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Hospital</label>
              <select className="input" value={form.hospital_id} onChange={e => { setForm({ ...form, hospital_id: e.target.value, department_id: '' }); }} required>
                <option value="">Select hospital...</option>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <div className="relative">
                <select className="input appearance-none" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })} required disabled={!form.hospital_id}>
                  <option value="">
                    {form.hospital_id ? 'Select department...' : 'Select a hospital first...'}
                  </option>
                  {getFilteredDepartments(form.hospital_id).map(d => (
                    <option key={d.id} value={d.id}>{d.department_name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                {form.hospital_id && getFilteredDepartments(form.hospital_id).length === 0 && (
                  <p className="text-xs text-amber-600 mt-1.5">No departments found for this hospital. Create departments first.</p>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="label">Employment Date</label>
            <input type="date" className="input" value={form.employment_date} onChange={e => setForm({ ...form, employment_date: e.target.value })} required />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editEmp ? 'Update Employee' : 'Create Employee'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!showTransfer} onClose={() => setShowTransfer(null)} title={`Transfer Employee: ${showTransfer?.full_name}`}>
        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">New Hospital</label>
              <select className="input" value={transferForm.to_hospital_id} onChange={e => { setTransferForm({ ...transferForm, to_hospital_id: e.target.value, to_department_id: '' }); }} required>
                <option value="">Select hospital...</option>
                {hospitals.filter(h => h.id !== showTransfer?.hospital_id).map(h => (
                  <option key={h.id} value={h.id}>{h.hospital_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">New Department</label>
              <div className="relative">
                <select className="input appearance-none" value={transferForm.to_department_id} onChange={e => setTransferForm({ ...transferForm, to_department_id: e.target.value })} required disabled={!transferForm.to_hospital_id}>
                  <option value="">
                    {transferForm.to_hospital_id ? 'Select department...' : 'Select a hospital first...'}
                  </option>
                  {getFilteredDepartments(transferForm.to_hospital_id).filter(d => d.id !== showTransfer?.department_id).map(d => (
                    <option key={d.id} value={d.id}>{d.department_name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div>
            <label className="label">Transfer Date</label>
            <input type="date" className="input" value={transferForm.transfer_date} onChange={e => setTransferForm({ ...transferForm, transfer_date: e.target.value })} required />
          </div>
          <div>
            <label className="label">Reason for Transfer</label>
            <textarea className="input" rows={2} value={transferForm.reason} onChange={e => setTransferForm({ ...transferForm, reason: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowTransfer(null)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Transfer Employee</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
