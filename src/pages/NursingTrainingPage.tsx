import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { Pagination as PaginationType } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Search, Pencil, Trash2, GraduationCap, Award, Plus, BookOpen, CheckCircle, Clock, Users, ChevronDown, ChevronUp } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getTrainingPrograms, createTrainingProgram, updateTrainingProgram, deleteTrainingProgram, getTrainingAttendance, createTrainingAttendance, getCertifications, createCertification, updateCertification, deleteCertification } from '../lib/trainingPrograms';
import { getEmployees } from '../lib/employees';

export default function NursingTrainingPage() {
  const { hasRole } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [form, setForm] = useState({ title: '', description: '', start_date: '', end_date: '', participants: '', status: 'active' });
  const [certForm, setCertForm] = useState({ employee_id: '', certification_name: '', issuing_body: '', certificate_number: '', issue_date: '', expiry_date: '', status: 'active' });
  const location = useLocation();
  const [tab, setTab] = useState<'programs' | 'certifications'>(location.pathname === '/nursing-certifications' ? 'certifications' : 'programs');
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({ employee_id: '', attended: 'true' });
  const [employees, setEmployees] = useState<any[]>([]);
  const canManage = hasRole('super_admin') || hasRole('nursing_admin');

  const loadItems = async (page = 1) => {
    setLoading(true);
    try {
      if (tab === 'programs') {
        const { data, total } = await getTrainingPrograms(page, 50, search);
        setItems(data);
        setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
      } else {
        const { data, total } = await getCertifications(page, 50, search);
        setItems(data);
        setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
      }
    } finally {
      setLoading(false);
    }
  };

// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadItems(); }, [tab, loadItems]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadItems(); };

  const loadFormData = async () => {
    const { data: empData } = await getEmployees(1, 500);
    setEmployees(empData);
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ title: '', description: '', start_date: '', end_date: '', participants: '', status: 'active' });
    setCertForm({ employee_id: '', certification_name: '', issuing_body: '', certificate_number: '', issue_date: '', expiry_date: '', status: 'active' });
    if (tab === 'certifications') loadFormData();
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    if (tab === 'programs') {
      setForm({
        title: item.title || '',
        description: item.description || '',
        start_date: item.start_date || '',
        end_date: item.end_date || '',
        participants: String(item.participants || ''),
        status: item.status,
      });
    } else {
      setCertForm({
        employee_id: item.employee_id || '',
        certification_name: item.certification_name || '',
        issuing_body: item.issuing_body || '',
        certificate_number: item.certificate_number || '',
        issue_date: item.issue_date || '',
        expiry_date: item.expiry_date || '',
        status: item.status,
      });
      loadFormData();
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (tab === 'programs') {
        const payload = {
          title: form.title,
          description: form.description,
          start_date: form.start_date,
          end_date: form.end_date,
          participants: Number(form.participants),
          status: form.status,
        };
        if (editItem) {
          await updateTrainingProgram(editItem.id, payload);
        } else {
          await createTrainingProgram(payload);
        }
      } else {
        const payload = {
          employee_id: certForm.employee_id,
          certification_name: certForm.certification_name,
          issuing_body: certForm.issuing_body,
          certificate_number: certForm.certificate_number,
          issue_date: certForm.issue_date,
          expiry_date: certForm.expiry_date,
          status: certForm.status,
        };
        if (editItem) {
          await updateCertification(editItem.id, payload);
        } else {
          await createCertification(payload);
        }
      }
      setShowModal(false);
      loadItems(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Delete this ${tab === 'programs' ? 'training program' : 'certification'} permanently?`)) return;
    try {
      if (tab === 'programs') {
        await deleteTrainingProgram(item.id);
      } else {
        await deleteCertification(item.id);
      }
      loadItems(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleToggleStatus = async (item: any) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`Set status to ${newStatus}?`)) return;
    try {
      if (tab === 'programs') {
        await updateTrainingProgram(item.id, { status: newStatus });
      } else {
        await updateCertification(item.id, { status: newStatus });
      }
      loadItems(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const toggleAttendance = async (programId: string) => {
    if (expandedProgram === programId) {
      setExpandedProgram(null);
      setAttendance([]);
    } else {
      setExpandedProgram(programId);
      try {
        const data = await getTrainingAttendance(programId);
        setAttendance(data);
      } catch { setAttendance([]); }
    }
  };

  const openAttendanceModal = () => {
    setAttendanceForm({ employee_id: '', attended: 'true' });
    loadFormData();
    setShowAttendanceModal(true);
  };

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedProgram) return;
    try {
      await createTrainingAttendance({
        program_id: expandedProgram,
        employee_id: attendanceForm.employee_id,
        attended: attendanceForm.attended === 'true',
      });
      setShowAttendanceModal(false);
      const data = await getTrainingAttendance(expandedProgram);
      setAttendance(data);
    } catch (err: any) { alert(err.message); }
  };

  const activePrograms = items.filter(i => i.status === 'active').length;
  const activeCerts = items.filter(i => i.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <GraduationCap size={14} className="text-[#008751]" />
            <span>Nursing Services</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Nursing Training</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Nursing Training & Certifications</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage training programs and nurse certifications</p>
        </div>
        {canManage && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add {tab === 'programs' ? 'Program' : 'Certification'}</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Programs" value={tab === 'programs' ? pagination.total : items.length} icon={BookOpen} color="primary" subtitle="Training programs" />
        <StatCard title="Active Programs" value={tab === 'programs' ? activePrograms : 0} icon={CheckCircle} color="teal" subtitle="Currently active" />
        <StatCard title="Total Certifications" value={tab === 'certifications' ? pagination.total : items.length} icon={Award} color="blue" subtitle="Certifications" />
        <StatCard title="Active Certifications" value={tab === 'certifications' ? activeCerts : 0} icon={Clock} color="orange" subtitle="Currently valid" />
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('programs')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'programs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Training Programs</button>
        <button onClick={() => setTab('certifications')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'certifications' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Certifications</button>
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder={`Search ${tab === 'programs' ? 'programs' : 'certifications'}...`} value={search} onChange={e => setSearch(e.target.value)} />
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
              <GraduationCap size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No {tab === 'programs' ? 'programs' : 'certifications'} found.</p>
              {canManage && <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Add {tab === 'programs' ? 'Program' : 'Certification'}</button>}
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {tab === 'programs' ? <th>Title</th> : <th>Certification</th>}
                  {tab === 'programs' ? <th>Duration</th> : <th>Employee</th>}
                  {tab === 'programs' ? <th>Participants</th> : <th>Issuing Body</th>}
                  <th>Status</th>
                  {tab === 'programs' && <th></th>}
                  {canManage && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                          {tab === 'programs' ? <BookOpen size={18} className="text-[#008751]" /> : <Award size={18} className="text-[#008751]" />}
                        </div>
                        <span className="font-medium text-slate-900">{tab === 'programs' ? item.title : item.certification_name}</span>
                      </div>
                    </td>
                    {tab === 'programs' ? (
                      <>
                        <td className="text-sm">{item.start_date} - {item.end_date}</td>
                        <td>{item.participants}</td>
                      </>
                    ) : (
                      <>
                        <td>{item.employee_name || 'Unknown'}</td>
                        <td>{item.issuing_body}</td>
                      </>
                    )}
                    <td>
                      <span className={item.status === 'active' ? 'badge-active' : 'badge-inactive'}>{item.status}</span>
                    </td>
                    {tab === 'programs' && (
                      <td>
                        <button onClick={() => toggleAttendance(item.id)} className="btn btn-sm btn-secondary">
                          {expandedProgram === item.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          <span className="ml-1">Attendance</span>
                        </button>
                      </td>
                    )}
                    {canManage && (
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(item)} className="btn btn-sm btn-secondary"><Pencil size={14} /></button>
                          <button onClick={() => handleToggleStatus(item)} className="btn btn-sm btn-secondary">
                            {item.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => handleDelete(item)} className="btn btn-sm btn-danger"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {expandedProgram && (
              <div className="border-t border-slate-100 bg-slate-50/50">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Users size={14} /> Attendance List</h4>
                    {canManage && <button onClick={openAttendanceModal} className="btn btn-sm btn-primary"><Plus size={14} /> Add Attendance</button>}
                  </div>
                  {attendance.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">No attendance records.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {attendance.map((a: any) => (
                        <div key={a.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-slate-200">
                          <div className={`w-2 h-2 rounded-full ${a.attended ? 'bg-green-500' : 'bg-red-400'}`} />
                          <span className="text-sm text-slate-700">{a.employee_name || a.employee_id}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          )}
        </div>
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadItems} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? `Edit ${tab === 'programs' ? 'Program' : 'Certification'}` : `Add ${tab === 'programs' ? 'Program' : 'Certification'}`} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'programs' ? (
            <>
              <div>
                <label className="label">Title</label>
                <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date</label>
                  <input type="date" className="input" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input type="date" className="input" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="label">Participants</label>
                <input type="number" min="0" className="input" value={form.participants} onChange={e => setForm({ ...form, participants: e.target.value })} required />
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="label">Employee</label>
                <select className="input" value={certForm.employee_id} onChange={e => setCertForm({ ...certForm, employee_id: e.target.value })} required>
                  <option value="">Select Employee</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.staff_id})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Certification Name</label>
                <input className="input" value={certForm.certification_name} onChange={e => setCertForm({ ...certForm, certification_name: e.target.value })} required />
              </div>
              <div>
                <label className="label">Issuing Body</label>
                <input className="input" value={certForm.issuing_body} onChange={e => setCertForm({ ...certForm, issuing_body: e.target.value })} required />
              </div>
              <div>
                <label className="label">Certificate Number</label>
                <input className="input" value={certForm.certificate_number} onChange={e => setCertForm({ ...certForm, certificate_number: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Issue Date</label>
                  <input type="date" className="input" value={certForm.issue_date} onChange={e => setCertForm({ ...certForm, issue_date: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Expiry Date</label>
                  <input type="date" className="input" value={certForm.expiry_date} onChange={e => setCertForm({ ...certForm, expiry_date: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={certForm.status} onChange={e => setCertForm({ ...certForm, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </>
          )}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editItem ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={showAttendanceModal} onClose={() => setShowAttendanceModal(false)} title="Add Attendance Record" size="sm">
        <form onSubmit={handleAttendanceSubmit} className="space-y-4">
          <div>
            <label className="label">Employee</label>
            <select className="input" value={attendanceForm.employee_id} onChange={e => setAttendanceForm({ ...attendanceForm, employee_id: e.target.value })} required>
              <option value="">Select Employee</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.staff_id})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Attended</label>
            <select className="input" value={attendanceForm.attended} onChange={e => setAttendanceForm({ ...attendanceForm, attended: e.target.value })}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowAttendanceModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
