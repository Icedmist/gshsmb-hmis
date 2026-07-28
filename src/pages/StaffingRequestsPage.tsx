import { useState, useEffect } from 'react';
import { Users, Plus, ChevronDown, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getStaffingRequests, createStaffingRequest, updateStaffingRequest, getNominations, createNomination, updateNomination, createLocumAssignment } from '../lib/locums';
import { getAllHospitals, getHospital } from '../lib/hospitals';
import { getEmployees } from '../lib/employees';
import { addDocument, getDocsPaginated } from '../lib/firestore';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import type { StaffingRequest, StaffNomination } from '../types';

const PRIORITY_BADGES: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600 ring-1 ring-slate-400/20',
  normal: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  high: 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20',
  urgent: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
};

const STATUS_BADGES: Record<string, string> = {
  open: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  in_progress: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  filled: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  closed: 'bg-slate-50 text-slate-600 ring-1 ring-slate-400/20',
};

export default function StaffingRequestsPage() {
  const { user, hasRole } = useAuth();
  const [items, setItems] = useState<StaffingRequest[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    profession: '', specialty: '', staff_needed: 1, department: '',
    reason: '', duration_days: 7, priority: 'normal' as StaffingRequest['priority'],
    start_date: '', end_date: '',
  });
  const [hospitals, setHospitals] = useState<{ id: string; hospital_name: string }[]>([]);
  const [employees, setEmployees] = useState<{ id: string; full_name: string; staff_id: string; phone_number?: string; email?: string; position?: string }[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<StaffingRequest | null>(null);
  const [nominations, setNominations] = useState<StaffNomination[]>([]);
  const [showNominateModal, setShowNominateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileStaff, setProfileStaff] = useState<StaffNomination | null>(null);
  const [nomineeId, setNomineeId] = useState('');
  const [hospitalNames, setHospitalNames] = useState<Record<string, string>>({});

  const loadItems = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getStaffingRequests(page, 50, undefined, statusFilter || undefined);
      setItems(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally { setLoading(false); }
  };

// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadItems(); }, [statusFilter]);

  const openCreate = () => {
    setForm({ profession: '', specialty: '', staff_needed: 1, department: '', reason: '', duration_days: 7, priority: 'normal', start_date: '', end_date: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    let hospital_name = '';
    try {
      const hosp = await getHospital(user.hospital_id || '');
      if (hosp) hospital_name = hosp.hospital_name;
    } catch {}
    await createStaffingRequest({
      hospital_id: user.hospital_id || '', hospital_name,
      profession: form.profession, specialty: form.specialty,
      staff_needed: form.staff_needed, department: form.department,
      reason: form.reason, duration_days: form.duration_days,
      priority: form.priority, start_date: form.start_date, end_date: form.end_date,
      created_by: user.id, status: 'open',
    });
    setShowModal(false);
    loadItems();
  };

  const isMyRequest = (req: StaffingRequest) => req.hospital_id === user?.hospital_id;

  const openNominations = async (req: StaffingRequest) => {
    setSelectedRequest(req);
    const noms = await getNominations(req.id);
    setNominations(noms);
    try {
      const d = await getAllHospitals();
      const nameMap: Record<string, string> = {};
      const hospList = (d || []).map(h => { nameMap[h.id] = h.hospital_name; return { id: h.id, hospital_name: h.hospital_name }; });
      setHospitals(hospList);
      setHospitalNames(nameMap);
      const empRes = await getEmployees(1, 200, undefined, user?.hospital_id || undefined);
      setEmployees(empRes.data.map((e: any) => ({ id: e.id, full_name: e.full_name, staff_id: e.staff_id, phone_number: e.phone_number, email: e.email, position: e.position })));
    } catch {}
    setShowNominateModal(true);
  };

  const handleAddStaff = async () => {
    if (!selectedRequest || !nomineeId || !user) return;
    const emp = employees.find(e => e.id === nomineeId);
    if (!emp) return;
    await createNomination({
      staffing_request_id: selectedRequest.id,
      employee_id: emp.id, employee_name: emp.full_name, staff_id: emp.staff_id,
      phone_number: emp.phone_number, email: emp.email, position: emp.position,
      source_hospital_id: user.hospital_id || '',
      source_hospital_name: hospitalNames[user.hospital_id || ''] || '',
      nominated_by: user.id, nominated_by_name: user.full_name || '', status: 'pending',
    });

    try {
      const { data: admins } = await getDocsPaginated('users', [
        { field: 'role', op: '==', value: 'hospital_admin' },
        { field: 'hospital_id', op: '==', value: selectedRequest.hospital_id },
      ], undefined, 100, 1);
      for (const admin of admins) {
        if (admin.id === user.id) continue;
        await addDocument('notifications', {
          user_id: admin.id,
          type: 'approval_request',
          title: 'Staff Offered',
          message: `${emp.full_name} (${emp.staff_id}) from ${hospitalNames[user.hospital_id || ''] || 'Your hospital'} has been offered for ${selectedRequest.profession} position.`,
          link: '/staffing-requests',
          read: false,
          created_at: new Date().toISOString(),
        });
      }
    } catch { /* ignore */ }

    const noms = await getNominations(selectedRequest.id);
    setNominations(noms);
    setNomineeId('');
  };

  const notifyNominationAction = async (nom: StaffNomination, action: 'approved' | 'rejected') => {
    try {
      const { data: admins } = await getDocsPaginated('users', [
        { field: 'role', op: '==', value: 'hospital_admin' },
        { field: 'hospital_id', op: '==', value: nom.source_hospital_id },
      ], undefined, 100, 1);
      for (const admin of admins) {
        if (admin.id === user?.id) continue;
        await addDocument('notifications', {
          user_id: admin.id,
          type: 'approval_request',
          title: `Staff Nomination ${action === 'approved' ? 'Accepted' : 'Rejected'}`,
          message: `The nomination of ${nom.employee_name} for ${selectedRequest?.profession || 'a staffing request'} has been ${action}${selectedRequest ? ` by ${selectedRequest.hospital_name || selectedRequest.hospital_id}` : ''}.`,
          link: '/staffing-requests',
          read: false,
          created_at: new Date().toISOString(),
        });
      }
    } catch { /* ignore */ }
  };

  const handleApproveNomination = async (nom: StaffNomination) => {
    await updateNomination(nom.id, { status: 'approved' });
    if (selectedRequest) {
      await updateStaffingRequest(selectedRequest.id, { status: 'filled' });
      const hosp = hospitals.find(h => h.id === selectedRequest.hospital_id);
      const srcHosp = hospitals.find(h => h.id === nom.source_hospital_id);
      await createLocumAssignment({
        staffing_request_id: selectedRequest.id,
        employee_id: nom.employee_id, employee_name: nom.employee_name, staff_id: nom.staff_id,
        source_hospital_id: nom.source_hospital_id, source_hospital_name: srcHosp?.hospital_name || '',
        destination_hospital_id: selectedRequest.hospital_id,
        destination_hospital_name: hosp?.hospital_name || '',
        department: selectedRequest.department, position: selectedRequest.profession,
        start_date: selectedRequest.start_date, end_date: selectedRequest.end_date,
        duration_days: selectedRequest.duration_days, created_by: user?.id || '', status: 'active',
      });
      await notifyNominationAction(nom, 'approved');
    }
    const noms = await getNominations(selectedRequest!.id);
    setNominations(noms);
    loadItems();
  };

  const handleRejectNomination = async (nom: StaffNomination) => {
    await updateNomination(nom.id, { status: 'rejected' });
    await notifyNominationAction(nom, 'rejected');
    const noms = await getNominations(selectedRequest!.id);
    setNominations(noms);
  };

  const canAddStaff = hasRole('hospital_admin', 'super_admin', 'executive_secretary');

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #0f766e 0%, #115e59 50%, #14b8a6 100%)' }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-teal-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0H0v40' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")` }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-teal-200/80 text-sm mb-2">
            <Users size={14} />
            <span>HR</span>
            <span className="text-teal-500/50">/</span>
            <span className="text-white font-medium">Staffing Requests</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Hospital Staffing Requests</h1>
          <p className="mt-1.5 text-teal-100/60 text-sm max-w-xl">Broadcast temporary staffing needs across hospitals and manage nominations</p>
        </div>
      </div>

      {/* Filters + Create */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-3 items-center">
          <div className="relative">
            <select className="input w-44 appearance-none text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="filled">Filled</option>
              <option value="closed">Closed</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
        {canAddStaff && <button onClick={openCreate} className="btn-primary"><Plus size={16} /> New Request</button>}
      </div>

      {/* Table */}
      <div className="card border-t-2 border-t-teal-400 shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="p-4 rounded-2xl bg-slate-50 mb-4">
                <Users size={40} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium">No staffing requests.</p>
              <p className="text-xs text-slate-300 mt-1">Create a request to find temporary staff from other hospitals.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Hospital</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Profession</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Needed</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Duration</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r, i) => (
                  <tr key={r.id} className={`border-b border-slate-50 hover:bg-gradient-to-r hover:from-teal-50/40 hover:to-transparent transition-all duration-200 ${i === items.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                          {r.hospital_name?.charAt(0) || r.hospital_id?.charAt(0) || '?'}
                        </div>
                        <span className="font-semibold text-slate-800">{r.hospital_name || r.hospital_id}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">{r.profession}</p>
                      {r.specialty && <p className="text-[11px] text-slate-400">{r.specialty}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-lg font-bold text-slate-700 tabular-nums">{r.staff_needed}</span>
                      <span className="text-[10px] text-slate-400 ml-1">position{r.staff_needed > 1 ? 's' : ''}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${PRIORITY_BADGES[r.priority] || ''}`}>
                        {r.priority === 'urgent' && <AlertTriangle size={10} />}
                        {r.priority}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-slate-700">{r.duration_days}d</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_BADGES[r.status] || ''}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          r.status === 'open' ? 'bg-emerald-500' :
                          r.status === 'filled' ? 'bg-blue-500' : 'bg-amber-500'
                        }`} />
                        {r.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {r.status === 'open' && isMyRequest(r) && (
                          <button onClick={() => openNominations(r)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-all ring-1 ring-indigo-600/20">
                            <Users size={12} /> View Offers
                          </button>
                        )}
                        {r.status === 'open' && !isMyRequest(r) && canAddStaff && (
                          <button onClick={() => openNominations(r)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-semibold transition-all ring-1 ring-teal-600/20">
                            <Users size={12} /> Add Staff
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
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Staffing Request">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Profession</label><input className="input" value={form.profession} onChange={e => setForm({ ...form, profession: e.target.value })} required placeholder="e.g. Nurse" /></div>
            <div><label className="label">Specialty</label><input className="input" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} placeholder="e.g. ICU" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Staff Needed</label><input type="number" min={1} className="input" value={form.staff_needed} onChange={e => setForm({ ...form, staff_needed: Number(e.target.value) })} required /></div>
            <div><label className="label">Department</label><input className="input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required /></div>
          </div>
          <div><label className="label">Reason</label><textarea className="input" rows={2} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Duration (days)</label><input type="number" min={1} className="input" value={form.duration_days} onChange={e => setForm({ ...form, duration_days: Number(e.target.value) })} required /></div>
            <div><label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as any })}>
                <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
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

      {/* Nomination Modal */}
      {selectedRequest && (
        <Modal open={showNominateModal} onClose={() => setShowNominateModal(false)}
          title={isMyRequest(selectedRequest) ? `Staff Offers — ${selectedRequest.profession}` : `Add Staff — ${selectedRequest.profession}`}
          size="lg">
          <div className="space-y-4">
            {!isMyRequest(selectedRequest) && (
              <div className="flex gap-2">
                <select className="input flex-1" value={nomineeId} onChange={e => setNomineeId(e.target.value)}>
                  <option value="">Select your staff...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.staff_id})</option>)}
                </select>
                <button onClick={handleAddStaff} disabled={!nomineeId} className="btn-primary">Offer Staff</button>
              </div>
            )}
            <div className="border-t border-slate-100 pt-3">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">
                {isMyRequest(selectedRequest) ? 'All Offered Staff' : 'Your Offered Staff'}
              </h4>
              {nominations.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No staff offered yet.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {nominations
                    .filter(n => isMyRequest(selectedRequest) ? true : n.source_hospital_id === user?.hospital_id)
                    .map(n => (
                    <div key={n.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-50 to-transparent border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-xs">
                          {n.employee_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{n.employee_name}</p>
                          <p className="text-[10px] text-slate-400">from {n.source_hospital_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                          n.status === 'approved' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' :
                          n.status === 'rejected' ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20' :
                          'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
                        }`}>{n.status === 'approved' ? 'Nominated' : n.status === 'rejected' ? 'Declined' : 'Offered'}</span>
                        {isMyRequest(selectedRequest) && (
                          <button onClick={() => { setProfileStaff(n); setShowProfileModal(true); }} className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all" title="View Profile">
                            <Users size={13} />
                          </button>
                        )}
                        {isMyRequest(selectedRequest) && n.status === 'pending' && (
                          <>
                            <button onClick={() => handleApproveNomination(n)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition-all ring-1 ring-emerald-600/30">
                              <CheckCircle size={13} /> Nominate
                            </button>
                            <button onClick={() => handleRejectNomination(n)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold transition-all ring-1 ring-red-600/30">
                              <XCircle size={13} /> Decline
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Staff Profile Modal */}
      <Modal open={showProfileModal} onClose={() => setShowProfileModal(false)} title="Staff Profile" size="md">
        {profileStaff && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {profileStaff.employee_name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{profileStaff.employee_name}</h3>
                <p className="text-sm text-slate-400">{profileStaff.position || '—'}</p>
                <p className="text-xs text-slate-400">From {profileStaff.source_hospital_name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Staff ID</p>
                <p className="text-sm text-slate-800 mt-0.5">{profileStaff.staff_id || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Phone Number</p>
                <p className="text-sm text-slate-800 mt-0.5">{profileStaff.phone_number || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Email</p>
                <p className="text-sm text-slate-800 mt-0.5">{profileStaff.email || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Status</p>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold mt-0.5 ${
                  profileStaff.status === 'approved' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' :
                  profileStaff.status === 'rejected' ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20' :
                  'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
                }`}>{profileStaff.status === 'approved' ? 'Nominated' : profileStaff.status === 'rejected' ? 'Declined' : 'Offered'}</span>
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button onClick={() => setShowProfileModal(false)} className="btn-secondary text-sm">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
