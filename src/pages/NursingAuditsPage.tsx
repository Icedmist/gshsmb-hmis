import { useState, useEffect } from 'react';
import type { Pagination as PaginationType, Hospital } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Search, Pencil, Trash2, ClipboardCheck, FileText, Plus, CheckCircle, Clock } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getNursingAudits, createNursingAudit, updateNursingAudit, deleteNursingAudit, getNursingSupervisionReports, createNursingSupervisionReport, updateNursingSupervisionReport, deleteNursingSupervisionReport } from '../lib/nursingAudits';
import { getHospitalScope } from '../lib/scope';
import { getHospitals } from '../lib/hospitals';
import { getAllDepartments } from '../lib/departments';

export default function NursingAuditsPage() {
  const { hasRole, user } = useAuth();
  const hospitalScope = getHospitalScope(user);
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [form, setForm] = useState({ audit_name: '', hospital_id: '', department_id: '', audit_date: '', findings: '', recommendations: '', status: 'open' });
  const [supervisionForm, setSupervisionForm] = useState({ hospital_id: '', department_id: '', supervisor_name: '', report_date: '', findings: '', recommendations: '', status: 'open' });
  const [tab, setTab] = useState<'audits' | 'supervision'>('audits');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const canManage = hasRole('super_admin') || hasRole('nursing_admin');

  const loadItems = async (page = 1) => {
    setLoading(true);
    try {
      if (tab === 'audits') {
        const { data, total } = await getNursingAudits(page, 50, search || undefined, hospitalScope);
        setItems(data);
        setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
      } else {
        const { data, total } = await getNursingSupervisionReports(page, 50, hospitalScope);
        setItems(data);
        setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, [tab]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadItems(); };

  const loadFormData = async () => {
    const { data: hData } = await getHospitals(1, 200);
    setHospitals(hData);
    const dData = await getAllDepartments();
    setDepartments(dData);
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ audit_name: '', hospital_id: '', department_id: '', audit_date: '', findings: '', recommendations: '', status: 'open' });
    setSupervisionForm({ hospital_id: '', department_id: '', supervisor_name: '', report_date: '', findings: '', recommendations: '', status: 'open' });
    loadFormData();
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    if (tab === 'audits') {
      setForm({
        audit_name: item.audit_name || '',
        hospital_id: item.hospital_id,
        department_id: item.department_id,
        audit_date: item.audit_date,
        findings: item.findings,
        recommendations: item.recommendations,
        status: item.status,
      });
    } else {
      setSupervisionForm({
        hospital_id: item.hospital_id,
        department_id: item.department_id,
        supervisor_name: item.supervisor_name || '',
        report_date: item.report_date,
        findings: item.findings,
        recommendations: item.recommendations,
        status: item.status,
      });
    }
    loadFormData();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (tab === 'audits') {
        const payload = {
          audit_name: form.audit_name,
          hospital_id: form.hospital_id,
          department_id: form.department_id,
          audit_date: form.audit_date,
          findings: form.findings,
          recommendations: form.recommendations,
          status: form.status,
        };
        if (editItem) {
          await updateNursingAudit(editItem.id, payload);
        } else {
          await createNursingAudit(payload);
        }
      } else {
        const payload = {
          hospital_id: supervisionForm.hospital_id,
          department_id: supervisionForm.department_id,
          supervisor_name: supervisionForm.supervisor_name,
          report_date: supervisionForm.report_date,
          findings: supervisionForm.findings,
          recommendations: supervisionForm.recommendations,
          status: supervisionForm.status,
        };
        if (editItem) {
          await updateNursingSupervisionReport(editItem.id, payload);
        } else {
          await createNursingSupervisionReport(payload);
        }
      }
      setShowModal(false);
      loadItems(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Delete this ${tab === 'audits' ? 'audit' : 'report'} permanently?`)) return;
    try {
      if (tab === 'audits') {
        await deleteNursingAudit(item.id);
      } else {
        await deleteNursingSupervisionReport(item.id);
      }
      loadItems(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleToggleStatus = async (item: any) => {
    const newStatus = item.status === 'open' ? 'completed' : 'open';
    if (!confirm(`Mark as ${newStatus}?`)) return;
    try {
      if (tab === 'audits') {
        await updateNursingAudit(item.id, { status: newStatus });
      } else {
        await updateNursingSupervisionReport(item.id, { status: newStatus });
      }
      loadItems(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const openCount = items.filter(i => i.status === 'open').length;
  const completedCount = items.filter(i => i.status === 'completed' || i.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <ClipboardCheck size={14} className="text-[#008751]" />
            <span>Nursing Services</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Nursing Audits</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Nursing Audits & Supervision</h1>
          <p className="text-slate-500 mt-1 text-sm">Track nursing audits and supervision reports across hospitals</p>
        </div>
        {canManage && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add {tab === 'audits' ? 'Audit' : 'Report'}</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Audits" value={pagination.total} icon={ClipboardCheck} color="primary" subtitle="All records" />
        <StatCard title="Open" value={openCount} icon={Clock} color="orange" subtitle="Pending review" />
        <StatCard title="Completed" value={completedCount} icon={CheckCircle} color="teal" subtitle="Completed" />
        <StatCard title="Supervision Reports" value={tab === 'supervision' ? pagination.total : items.length} icon={FileText} color="blue" subtitle="Supervision records" />
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('audits')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'audits' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Nursing Audits</button>
        <button onClick={() => setTab('supervision')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'supervision' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Supervision Reports</button>
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder={`Search ${tab === 'audits' ? 'audits' : 'reports'}...`} value={search} onChange={e => setSearch(e.target.value)} />
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
              <ClipboardCheck size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No {tab === 'audits' ? 'audits' : 'reports'} found.</p>
              {canManage && <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Add {tab === 'audits' ? 'Audit' : 'Report'}</button>}
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {tab === 'audits' ? <th>Audit Name</th> : <th>Supervisor</th>}
                  <th>Hospital</th>
                  <th>Department</th>
                  <th>{tab === 'audits' ? 'Audit Date' : 'Report Date'}</th>
                  <th>Status</th>
                  {canManage && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                          {tab === 'audits' ? <ClipboardCheck size={18} className="text-[#008751]" /> : <FileText size={18} className="text-[#008751]" />}
                        </div>
                        <span className="font-medium text-slate-900">{tab === 'audits' ? item.audit_name : item.supervisor_name}</span>
                      </div>
                    </td>
                    <td>{item.hospital_name}</td>
                    <td>{item.department_name}</td>
                    <td>{tab === 'audits' ? item.audit_date : item.report_date}</td>
                    <td>
                      <span className={item.status === 'completed' || item.status === 'active' ? 'badge-active' : 'badge-inactive'}>{item.status}</span>
                    </td>
                    {canManage && (
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(item)} className="btn btn-sm btn-secondary"><Pencil size={14} /></button>
                          <button onClick={() => handleToggleStatus(item)} className="btn btn-sm btn-secondary">
                            {item.status === 'open' ? 'Complete' : 'Reopen'}
                          </button>
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
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadItems} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? `Edit ${tab === 'audits' ? 'Audit' : 'Report'}` : `Add ${tab === 'audits' ? 'Audit' : 'Report'}`} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'audits' ? (
            <>
              <div>
                <label className="label">Audit Name</label>
                <input className="input" value={form.audit_name} onChange={e => setForm({ ...form, audit_name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Hospital</label>
                  <select className="input" value={form.hospital_id} onChange={e => setForm({ ...form, hospital_id: e.target.value })} required>
                    <option value="">Select Hospital</option>
                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Department</label>
                  <select className="input" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })} required>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Audit Date</label>
                <input type="date" className="input" value={form.audit_date} onChange={e => setForm({ ...form, audit_date: e.target.value })} required />
              </div>
              <div>
                <label className="label">Findings</label>
                <textarea className="input" rows={3} value={form.findings} onChange={e => setForm({ ...form, findings: e.target.value })} required />
              </div>
              <div>
                <label className="label">Recommendations</label>
                <textarea className="input" rows={3} value={form.recommendations} onChange={e => setForm({ ...form, recommendations: e.target.value })} required />
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="open">Open</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Hospital</label>
                  <select className="input" value={supervisionForm.hospital_id} onChange={e => setSupervisionForm({ ...supervisionForm, hospital_id: e.target.value })} required>
                    <option value="">Select Hospital</option>
                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Department</label>
                  <select className="input" value={supervisionForm.department_id} onChange={e => setSupervisionForm({ ...supervisionForm, department_id: e.target.value })} required>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Supervisor Name</label>
                <input className="input" value={supervisionForm.supervisor_name} onChange={e => setSupervisionForm({ ...supervisionForm, supervisor_name: e.target.value })} required />
              </div>
              <div>
                <label className="label">Report Date</label>
                <input type="date" className="input" value={supervisionForm.report_date} onChange={e => setSupervisionForm({ ...supervisionForm, report_date: e.target.value })} required />
              </div>
              <div>
                <label className="label">Findings</label>
                <textarea className="input" rows={3} value={supervisionForm.findings} onChange={e => setSupervisionForm({ ...supervisionForm, findings: e.target.value })} required />
              </div>
              <div>
                <label className="label">Recommendations</label>
                <textarea className="input" rows={3} value={supervisionForm.recommendations} onChange={e => setSupervisionForm({ ...supervisionForm, recommendations: e.target.value })} required />
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={supervisionForm.status} onChange={e => setSupervisionForm({ ...supervisionForm, status: e.target.value })}>
                  <option value="open">Open</option>
                  <option value="completed">Completed</option>
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
    </div>
  );
}
