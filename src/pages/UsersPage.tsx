import { useState, useEffect } from 'react';
import { User, Pagination as PaginationType, ROLE_LABELS } from '../types';
import { getUsers, updateUser } from '../lib/users';
import { getAllHospitals } from '../lib/hospitals';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { Plus, Search, Shield, Pencil, ChevronDown } from 'lucide-react';

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [hospitals, setHospitals] = useState<{ id: string; hospital_name: string }[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ full_name: '', email: '', phone_number: '', role: '', hospital_id: '', password: '' });

  const hospitalScope = user?.role === 'hospital_admin' ? (user.hospital_id || undefined) : undefined;

  const loadUsers = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getUsers(page, 50, search, hospitalScope);
      setUsers(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally {
      setLoading(false);
    }
  };

  const loadHospitals = async () => {
    try {
      const data = await getAllHospitals();
      setHospitals((data || []).map((h: any) => ({ id: h.id, hospital_name: h.hospital_name })));
    } catch {}
  };

  useEffect(() => {
    if (showModal) loadHospitals();
  }, [showModal]);

  useEffect(() => { loadUsers(); loadHospitals(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadUsers(); };

  const openCreate = () => {
    setEditUser(null);
    setForm({ full_name: '', email: '', phone_number: '', role: '', hospital_id: '', password: '' });
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setForm({ full_name: user.full_name, email: user.email, phone_number: user.phone_number || '', role: user.role, hospital_id: user.hospital_id?.toString() || '', password: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editUser) {
        const payload: any = { full_name: form.full_name, email: form.email, phone_number: form.phone_number, role: form.role };
        if (form.hospital_id) payload.hospital_id = form.hospital_id;
        await updateUser(editUser.id, payload);
      } else {
        const createUserFn = httpsCallable(functions, 'createUser');
        await createUserFn({
          email: form.email,
          password: form.password,
          fullName: form.full_name,
          role: form.role,
          hospitalId: form.hospital_id || undefined,
          phoneNumber: form.phone_number || undefined,
        });
      }
      setShowModal(false);
      loadUsers(pagination.page);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} ${user.full_name}?`)) return;
    try {
      await updateUser(user.id, { status: newStatus });
      loadUsers(pagination.page);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Shield size={14} className="text-[#008751]" />
            <span>Admin</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Users</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage system users and roles</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Create User</button>
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search users by name, email, or role..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button type="submit" className="btn-secondary">Search</button>
          </form>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Shield size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No users found.</p>
              <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Create User</button>
            </div>
          ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="font-medium text-slate-900">{user.full_name}</td>
                    <td>{user.email}</td>
                    <td>{user.phone_number || '-'}</td>
                    <td>
                      <span className="badge bg-emerald-50 text-[#008751] font-medium">{ROLE_LABELS[user.role] || user.role}</span>
                    </td>
                    <td>
                      <span className={user.status === 'active' ? 'badge-active' : 'badge-inactive'}>{user.status}</span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(user)} className="btn btn-sm btn-secondary"><Pencil size={14} /></button>
                        <button onClick={() => handleToggleStatus(user)} className="btn btn-sm btn-secondary">
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadUsers} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editUser ? 'Edit User' : 'Create User'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input className="input" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} />
          </div>
          <div>
            <label className="label">Role</label>
            <div className="relative">
              <select className="input appearance-none" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} required>
                <option value="">Select role...</option>
                <option value="super_admin">Super Admin</option>
                <option value="executive_secretary">Executive Secretary</option>
                <option value="hospital_admin">Hospital Admin</option>
                <option value="hr_officer">HR Officer</option>
                <option value="director_medical_services">Director Medical Services</option>
                <option value="director_nursing_services">Director Nursing Services</option>
                <option value="director_prs">Director PRS</option>
                <option value="director_pharmaceutical_services">Director Pharmaceutical Services</option>
                <option value="director_laboratory_services">Director Medical Laboratory Services</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          {form.role === 'hospital_admin' && (
            <div>
              <label className="label">Assigned Hospital</label>
              <div className="relative">
                <select className="input appearance-none" value={form.hospital_id} onChange={e => setForm({ ...form, hospital_id: e.target.value })}>
                  <option value="">Select hospital...</option>
                  {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}
          {!editUser && (
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editUser} />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editUser ? 'Update User' : 'Create User'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
