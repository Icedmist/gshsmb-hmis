import { useState, useEffect } from 'react';
import { Briefcase, Plus, Search, ChevronDown, CheckCircle, XCircle, Clock, Trash2, ArrowUpRight, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getLocumRequests, createLocumRequest, updateLocumRequest, cancelLocumRequest, getLocumApprovals, createLocumApproval, createLocumAssignment } from '../lib/locums';
import { getAllHospitals } from '../lib/hospitals';
import { getEmployees } from '../lib/employees';
import { getHospitalScope } from '../lib/scope';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import type { LocumRequest, LocumApproval } from '../types';

const STATUS_BADGES: Record<string, string> = {
  pending_hospital_admin: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-600/20',
  pending_destination_admin: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  pending_hr: 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20',
  approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  rejected: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
  cancelled: 'bg-slate-50 text-slate-600 ring-1 ring-slate-400/20',
};

export default function LocumRequestsPage() {
  const { user, hasRole } = useAuth();
  const hospitalScope = getHospitalScope(user);
  const [items, setItems] = useState<LocumRequest[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [hospitals, setHospitals] = useState<{ id: string; hospital_name: string }[]>([]);
  const [form, setForm] = useState({
    employee_id: '', employee_name: '', staff_id: '', destination_hospital_id: '',
    department: '', position: '', reason: '', start_date: '', end_date: '',
  });

  const loadItems = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getLocumRequests(page, 50, undefined, statusFilter || undefined, hospitalScope);
      setItems(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally { setLoading(false); }
  };

  useEffect(() => { loadItems(); }, [statusFilter, hospitalScope]);

  const loadHospitals = async () => {
    try { const d = await getAllHospitals(); setHospitals((d || []).map(h => ({ id: h.id, hospital_name: h.hospital_name }))); } catch {}
  };

  const openCreate = () => {
    loadHospitals();
    setForm({ employee_id: user?.id || '', employee_name: user?.full_name || '', staff_id: '', destination_hospital_id: '', department: '', position: '', reason: '', start_date: '', end_date: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    await createLocumRequest({
      employee_id: user.id, employee_name: user.full_name || '', staff_id: form.staff_id,
      source_hospital_id: user.hospital_id || '', source_hospital_name: '',
      destination_hospital_id: form.destination_hospital_id,
      destination_hospital_name: hospitals.find(h => h.id === form.destination_hospital_id)?.hospital_name || '',
      department: form.department, position: form.position, reason: form.reason,
      start_date: form.start_date, end_date: form.end_date, duration_days: duration,
      created_by: user.id, status: 'pending_hospital_admin', current_step: 'Source Hospital Admin',
    });
    setShowModal(false);
    loadItems();
  };

  const handleApprove = async (req: LocumRequest) => {
    const steps = ['pending_hospital_admin', 'pending_destination_admin', 'approved'];
    const stepLabels = ['Source Hospital Admin', 'Destination Hospital Admin', 'Approved'];
    const currentIdx = steps.indexOf(req.status);
    const nextStatus = steps[currentIdx + 1] as LocumRequest['status'];
    const nextLabel = stepLabels[currentIdx + 1] || '';
    await updateLocumRequest(req.id, { status: nextStatus, current_step: nextLabel });
    await createLocumApproval({ locum_request_id: req.id, step: req.current_step, approver_id: user?.id || '', approver_name: user?.full_name || '', action: 'approved' });
    if (nextStatus === 'approved') {
      await createLocumAssignment({
        locum_request_id: req.id, employee_id: req.employee_id, employee_name: req.employee_name,
        staff_id: req.staff_id, source_hospital_id: req.source_hospital_id,
        source_hospital_name: req.source_hospital_name, destination_hospital_id: req.destination_hospital_id,
        destination_hospital_name: req.destination_hospital_name, department: req.department,
        position: req.position, start_date: req.start_date, end_date: req.end_date,
        duration_days: req.duration_days, created_by: user?.id || '', status: 'active',
      });
    }
    loadItems();
  };

  const handleReject = async (req: LocumRequest) => {
    await updateLocumRequest(req.id, { status: 'rejected' });
    await createLocumApproval({ locum_request_id: req.id, step: req.current_step, approver_id: user?.id || '', approver_name: user?.full_name || '', action: 'rejected' });
    loadItems();
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this locum request?')) return;
    await cancelLocumRequest(id);
    loadItems();
  };

  const canApprove = (req: LocumRequest) => {
    const role = user?.role;
    if (role === 'super_admin' || role === 'executive_secretary') return true;
    if (req.status === 'pending_hospital_admin' && role === 'hospital_admin' && req.source_hospital_id === user?.hospital_id) return true;
    if (req.status === 'pending_destination_admin' && role === 'hospital_admin' && req.destination_hospital_id === user?.hospital_id) return true;
    return false;
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #0e7490 0%, #155e75 50%, #0891b2 100%)' }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-cyan-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0H0v40' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")` }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-cyan-200/80 text-sm mb-2">
            <Briefcase size={14} />
            <span>HR</span>
            <span className="text-cyan-500/50">/</span>
            <span className="text-white font-medium">Locum Requests</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Locum Requests</h1>
          <p className="mt-1.5 text-cyan-100/60 text-sm max-w-xl">Employee-initiated temporary deployment requests requiring hospital approval</p>
        </div>
      </div>

      {/* Filters + Create */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-3 items-center">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9 w-56" placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="relative">
            <select className="input w-44 appearance-none text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending_hospital_admin">Source Admin</option>
              <option value="pending_destination_admin">Dest. Admin</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <button onClick={() => loadItems()} className="btn-secondary text-sm">Search</button>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> New Locum Request</button>
      </div>

      {/* Table */}
      <div className="card border-t-2 border-t-cyan-400 shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="p-4 rounded-2xl bg-slate-50 mb-4">
                <Briefcase size={40} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium">No requests found.</p>
              <p className="text-xs text-slate-300 mt-1">Create a new locum request to get started.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Destination</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Duration</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r, i) => (
                  <tr key={r.id} className={`border-b border-slate-50 hover:bg-gradient-to-r hover:from-cyan-50/40 hover:to-transparent transition-all duration-200 ${i === items.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                          {r.employee_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{r.employee_name}</p>
                          <p className="text-[11px] text-slate-400">{r.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{r.destination_hospital_name}</td>
                    <td className="px-5 py-4 text-slate-600">{r.department}</td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-slate-700">{r.duration_days}d</span>
                      <span className="text-[10px] text-slate-400 ml-1 block">
                        {r.start_date?.toDate ? r.start_date.toDate().toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : r.start_date?.toString().slice(0, 10) || '—'}
                        {' → '}
                        {r.end_date?.toDate ? r.end_date.toDate().toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : r.end_date?.toString().slice(0, 10) || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_BADGES[r.status] || 'bg-slate-50 text-slate-600 ring-1 ring-slate-400/20'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          r.status === 'approved' ? 'bg-emerald-500' :
                          r.status === 'rejected' || r.status === 'cancelled' ? 'bg-slate-400' :
                          r.status === 'pending_destination_admin' ? 'bg-amber-500' : 'bg-cyan-500'
                        }`} />
                        {r.status === 'pending_hospital_admin' ? 'Source Admin' :
                         r.status === 'pending_destination_admin' ? 'Dest. Admin' :
                         r.status === 'pending_hr' ? 'HR Review' : r.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {canApprove(r) && (
                          <>
                            <button onClick={() => handleApprove(r)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all" title={r.status === 'pending_destination_admin' ? 'Final Approve' : 'Approve & Forward'}>
                              <CheckCircle size={15} />
                            </button>
                            <button onClick={() => handleReject(r)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all" title="Reject">
                              <XCircle size={15} />
                            </button>
                          </>
                        )}
                        {r.status === 'pending_hospital_admin' && r.created_by === user?.id && (
                          <button onClick={() => handleCancel(r.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all" title="Cancel">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadItems} />
      </div>

      {/* Create Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Locum Request">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Employee Name</label><input className="input bg-slate-50" value={user?.full_name || ''} disabled /></div>
          <div><label className="label">Staff ID</label><input className="input" value={form.staff_id} onChange={e => setForm({ ...form, staff_id: e.target.value })} placeholder="e.g. GSH/STF/001" /></div>
          <div><label className="label">Destination Hospital</label>
            <select className="input" value={form.destination_hospital_id} onChange={e => setForm({ ...form, destination_hospital_id: e.target.value })} required>
              <option value="">Select hospital...</option>
              {hospitals.filter(h => h.id !== user?.hospital_id).map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Department</label><input className="input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required /></div>
            <div><label className="label">Position/Role</label><input className="input" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} required /></div>
          </div>
          <div><label className="label">Reason</label><textarea className="input" rows={3} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Start Date</label><input type="date" className="input" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required /></div>
            <div><label className="label">End Date</label><input type="date" className="input" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required /></div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Submit Request</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
