import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Play, XCircle, Layers, Clock, CheckCircle, AlertCircle, History, UserCheck, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getWorkflows, createWorkflow, updateWorkflow, deleteWorkflow, getWorkflowSteps, getWorkflowHistory, submitWorkflow, getWorkflowsSummary } from '../lib/workflows';
import { getAllHospitals } from '../lib/hospitals';
import { getHospitalScope } from '../lib/scope';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import StatCard from '../components/common/StatCard';
import type { Workflow, WorkflowStep, WorkflowHistory as WH } from '../types';
import type { Pagination as PaginationType } from '../types';

export default function WorkflowsPage() {
  const { hasRole, user } = useAuth();
  const canCreate = hasRole('super_admin', 'executive_secretary', 'hospital_admin');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ draft: 0, active: 0, completed: 0, cancelled: 0 });
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [history, setHistory] = useState<WH[]>([]);
  const [hospitals, setHospitals] = useState<{ id: string; hospital_name: string }[]>([]);
  const [form, setForm] = useState({ name: '', description: '', entity_type: '', entity_id: '', hospital_id: '' });

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const scope = getHospitalScope(user);
      const { data, total } = await getWorkflows(page, 50, search || undefined, filterStatus || undefined, undefined, scope);
      setWorkflows(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const scope = getHospitalScope(user);
      const s = await getWorkflowsSummary(scope);
      setSummary(s);
    } catch {}
  };

  useEffect(() => { loadData(); loadSummary(); }, [filterStatus]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadData(); };

  const openCreate = async () => {
    setForm({ name: '', description: '', entity_type: '', entity_id: '', hospital_id: '' });
    try {
      const data = await getAllHospitals();
      setHospitals((data || []).map(h => ({ id: h.id, hospital_name: h.hospital_name })));
    } catch {}
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.entity_type || !form.entity_id) return;
    try {
      await createWorkflow({
        name: form.name,
        description: form.description,
        entity_type: form.entity_type,
        entity_id: form.entity_id,
        hospital_id: form.hospital_id || user?.hospital_id || '',
        initiator_id: user?.id || '',
        status: 'draft',
        current_step: 0,
        total_steps: 0,
        started_at: null,
      });
      setShowModal(false);
      loadData(pagination.page);
      loadSummary();
    } catch (err: any) { alert(err.message); }
  };

  const handleSubmitWorkflow = async (item: Workflow) => {
    if (!confirm(`Submit "${item.name}" for review?`)) return;
    try {
      await submitWorkflow(item.id);
      loadData(pagination.page);
      loadSummary();
    } catch (err: any) { alert(err.message); }
  };

  const handleCancel = async (item: Workflow) => {
    if (!confirm(`Cancel "${item.name}"?`)) return;
    try {
      await updateWorkflow(item.id, { status: 'cancelled' });
      loadData(pagination.page);
      loadSummary();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (item: Workflow) => {
    if (!confirm(`Delete "${item.name}" permanently? This cannot be undone.`)) return;
    try {
      await deleteWorkflow(item.id);
      loadData(pagination.page);
      loadSummary();
    } catch (err: any) { alert(err.message); }
  };

  const openDetail = async (item: Workflow) => {
    setSelectedWorkflow(item);
    try {
      const [stepsData, historyData] = await Promise.all([
        getWorkflowSteps(item.id),
        getWorkflowHistory(item.id),
      ]);
      setSteps(stepsData || []);
      setHistory(historyData || []);
    } catch {
      setSteps([]);
      setHistory([]);
    }
    setShowDetail(true);
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock size={14} className="text-slate-400" />;
      case 'active': return <Play size={14} className="text-emerald-500" />;
      case 'completed': return <CheckCircle size={14} className="text-emerald-500" />;
      case 'cancelled': return <XCircle size={14} className="text-red-500" />;
      default: return null;
    }
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-50 text-slate-600 border-slate-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-blue-50 text-blue-700 border-blue-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
  };

  const stepStatusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-600 border-amber-200',
    in_progress: 'bg-blue-50 text-blue-600 border-blue-200',
    approved: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    rejected: 'bg-red-50 text-red-600 border-red-200',
    returned: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  const formatTimeSpent = (minutes?: number) => {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Layers size={14} className="text-[#008751]" />
            <span>Workflow</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Workflows</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Workflows</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage and track workflow processes</p>
        </div>
        {canCreate && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Create Workflow</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Draft" value={summary.draft} icon={Clock} color="primary" subtitle="Draft workflows" />
        <StatCard title="Active" value={summary.active} icon={Play} color="teal" subtitle="In progress" />
        <StatCard title="Completed" value={summary.completed} icon={CheckCircle} color="blue" subtitle="Completed" />
        <StatCard title="Cancelled" value={summary.cancelled} icon={XCircle} color="army" subtitle="Cancelled" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search by name or initiator..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input max-w-[140px]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button type="submit" className="btn-secondary">Search</button>
          </form>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-12">
              <Layers size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No workflows found.</p>
              {canCreate && <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Create Workflow</button>}
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Entity Type</th>
                  <th>Initiator</th>
                  <th>Step</th>
                  <th>Current Reviewer</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workflows.map(w => (
                  <tr key={w.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <Layers size={18} className="text-[#008751]" />
                        </div>
                        <span className="font-medium text-slate-900">{w.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge-active text-xs">{w.entity_type.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <UserCheck size={14} className="text-slate-400" />
                        {w.initiator_name || '-'}
                      </div>
                    </td>
                    <td className="text-slate-600 text-sm">{w.current_step}/{w.total_steps}</td>
                    <td className="text-slate-600 text-sm">{w.current_reviewer_name || '-'}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[w.status] || ''}`}>
                        {statusIcon(w.status)}
                        {w.status}
                      </span>
                    </td>
                    <td className="text-slate-500 text-sm">{w.started_at?.toDate?.()?.toLocaleDateString() || w.started_at || '-'}</td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openDetail(w)} className="btn btn-sm btn-secondary">View</button>
                        {w.status === 'draft' && (
                          <>
                            <button onClick={() => handleSubmitWorkflow(w)} className="btn btn-sm btn-primary" title="Submit"><Play size={14} /></button>
                            <button onClick={() => handleDelete(w)} className="btn btn-sm btn-danger" title="Delete"><Trash2 size={14} /></button>
                          </>
                        )}
                        {w.status === 'active' && (
                          <button onClick={() => handleCancel(w)} className="btn btn-sm btn-danger" title="Cancel"><XCircle size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadData} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Workflow" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Entity Type</label>
            <input className="input" placeholder="e.g. report, document, approval" value={form.entity_type} onChange={e => setForm({ ...form, entity_type: e.target.value })} required />
          </div>
          <div>
            <label className="label">Entity ID</label>
            <input className="input" value={form.entity_id} onChange={e => setForm({ ...form, entity_id: e.target.value })} required />
          </div>
          <div>
            <label className="label">Hospital</label>
            <select className="input" value={form.hospital_id} onChange={e => setForm({ ...form, hospital_id: e.target.value })}>
              <option value="">Select hospital...</option>
              {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Workflow</button>
          </div>
        </form>
      </Modal>

      <Modal open={showDetail} onClose={() => setShowDetail(false)} title="Workflow Details" size="xl">
        {selectedWorkflow && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label text-xs text-slate-400">Name</label>
                <p className="text-sm font-medium text-slate-800">{selectedWorkflow.name}</p>
              </div>
              {selectedWorkflow.description && (
                <div className="col-span-2">
                  <label className="label text-xs text-slate-400">Description</label>
                  <p className="text-sm text-slate-600">{selectedWorkflow.description}</p>
                </div>
              )}
              <div>
                <label className="label text-xs text-slate-400">Status</label>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[selectedWorkflow.status] || ''}`}>
                  {statusIcon(selectedWorkflow.status)}
                  {selectedWorkflow.status}
                </span>
              </div>
              <div>
                <label className="label text-xs text-slate-400">Entity Type</label>
                <p className="text-sm text-slate-700">{selectedWorkflow.entity_type.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <label className="label text-xs text-slate-400">Initiator</label>
                <p className="text-sm text-slate-700">{selectedWorkflow.initiator_name || '-'}</p>
              </div>
              <div>
                <label className="label text-xs text-slate-400">Current Step</label>
                <p className="text-sm text-slate-700">{selectedWorkflow.current_step}/{selectedWorkflow.total_steps}</p>
              </div>
              {selectedWorkflow.current_reviewer_name && (
                <div>
                  <label className="label text-xs text-slate-400">Current Reviewer</label>
                  <p className="text-sm text-slate-700">{selectedWorkflow.current_reviewer_name}</p>
                </div>
              )}
              {selectedWorkflow.hospital_name && (
                <div>
                  <label className="label text-xs text-slate-400">Hospital</label>
                  <p className="text-sm text-slate-700">{selectedWorkflow.hospital_name}</p>
                </div>
              )}
              <div>
                <label className="label text-xs text-slate-400">Started</label>
                <p className="text-sm text-slate-700">{selectedWorkflow.started_at?.toDate?.()?.toLocaleDateString() || selectedWorkflow.started_at || '-'}</p>
              </div>
              {selectedWorkflow.completed_at && (
                <div>
                  <label className="label text-xs text-slate-400">Completed</label>
                  <p className="text-sm text-slate-700">{selectedWorkflow.completed_at?.toDate?.()?.toLocaleDateString() || selectedWorkflow.completed_at || '-'}</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <ChevronDown size={16} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">Steps</h3>
              </div>
              {steps.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3">No steps defined.</p>
              ) : (
                <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Step Name</th>
                      <th>Assignee</th>
                      <th>Status</th>
                      <th>Time Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {steps.map(s => (
                      <tr key={s.id}>
                        <td className="text-slate-500 text-sm">{s.step_number}</td>
                        <td className="text-sm font-medium text-slate-700">{s.name}</td>
                        <td className="text-sm text-slate-600">{s.assignee_name || s.assignee_role || '-'}</td>
                        <td>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${stepStatusColors[s.status] || ''}`}>
                            {s.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="text-sm text-slate-500">{formatTimeSpent(s.time_spent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <History size={16} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">History Timeline</h3>
              </div>
              {history.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3">No history recorded.</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {history.map(h => (
                    <div key={h.id} className="flex gap-3 bg-slate-50 px-4 py-3 rounded-lg">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                          h.action === 'submitted' ? 'border-blue-200 bg-blue-50 text-blue-600' :
                          h.action === 'approved' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' :
                          h.action === 'rejected' ? 'border-red-200 bg-red-50 text-red-600' :
                          h.action === 'returned' ? 'border-purple-200 bg-purple-50 text-purple-600' :
                          h.action === 'cancelled' ? 'border-slate-200 bg-slate-50 text-slate-500' :
                          'border-amber-200 bg-amber-50 text-amber-600'
                        }`}>
                          {h.action === 'submitted' ? <Play size={14} /> :
                           h.action === 'approved' ? <CheckCircle size={14} /> :
                           h.action === 'rejected' || h.action === 'cancelled' ? <XCircle size={14} /> :
                           h.action === 'returned' ? <AlertCircle size={14} /> :
                           <Clock size={14} />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-700">
                            {h.action.charAt(0).toUpperCase() + h.action.slice(1)}
                            {h.user_name && <span className="text-slate-400 font-normal"> by {h.user_name}</span>}
                          </p>
                          <span className="text-xs text-slate-400">{h.created_at?.toDate?.()?.toLocaleDateString() || h.created_at || '-'}</span>
                        </div>
                        {h.comment && <p className="text-xs text-slate-500 mt-1">{h.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
