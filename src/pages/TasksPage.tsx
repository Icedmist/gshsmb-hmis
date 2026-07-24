import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, CheckCircle, Clock, AlertTriangle, ChevronDown, ListTodo, Play, UserCheck, Users, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getTasks, createTask, updateTask, deleteTask, getTaskComments, addTaskComment, getTasksSummary } from '../lib/tasks';
import { getAllHospitals } from '../lib/hospitals';
import { getHospitalScope } from '../lib/scope';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import StatCard from '../components/common/StatCard';
import type { Task, TaskComment } from '../types';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600', medium: 'bg-blue-50 text-blue-600',
  high: 'bg-orange-50 text-orange-600', urgent: 'bg-red-50 text-red-600',
};
const STATUS_COLORS: Record<string, string> = {
  pending: 'badge-inactive', in_progress: 'badge-active', completed: 'badge-active', overdue: 'badge-suspended',
};

export default function TasksPage() {
  const { user } = useAuth();
  const hospitalScope = getHospitalScope(user);
  const [items, setItems] = useState<Task[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Task | null>(null);
  const [summary, setSummary] = useState({ pending: 0, in_progress: 0, completed: 0, overdue: 0 });
  const [hospitals, setHospitals] = useState<{ id: string; hospital_name: string }[]>([]);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '', hospital_id: '' });
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'mine'>(hospitalScope ? 'mine' : 'all');

  const loadItems = async (page = 1) => {
    setLoading(true);
    try {
      const assignedTo = !hospitalScope && viewMode === 'mine' ? user?.id : undefined;
      const { data, total } = await getTasks(page, 50, search || undefined, assignedTo, statusFilter || undefined, undefined, hospitalScope);
      setItems(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
      const s = await getTasksSummary(assignedTo, hospitalScope);
      setSummary(s);
    } finally { setLoading(false); }
  };

  const loadHospitals = async () => {
    try { const data = await getAllHospitals(hospitalScope); setHospitals((data || []).map((h: any) => ({ id: h.id, hospital_name: h.hospital_name }))); } catch {}
  };

  useEffect(() => { loadItems(); loadHospitals(); }, [statusFilter, viewMode]);

  useEffect(() => {
    const interval = setInterval(() => loadItems(pagination.page), 30000);
    return () => clearInterval(interval);
  }, [statusFilter, viewMode, pagination.page]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadItems(); };

  const openCreate = () => {
    setEditItem(null);
    setForm({ title: '', description: '', priority: 'medium', due_date: '', hospital_id: '' });
    setShowModal(true);
  };

  const openEdit = (t: Task) => {
    setEditItem(t);
    setForm({ title: t.title, description: t.description, priority: t.priority, due_date: typeof t.due_date === 'string' ? t.due_date.split('T')[0] : '', hospital_id: t.hospital_id || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, any> = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        due_date: form.due_date || null,
      };
      if (form.hospital_id) payload.hospital_id = form.hospital_id;
      if (editItem) {
        await updateTask(editItem.id, payload);
      } else {
        payload.assigned_by = user?.id || '';
        payload.assigned_by_name = user?.full_name || '';
        payload.status = 'pending';
        await createTask(payload as any);
      }
      setShowModal(false);
      loadItems(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateTask(id, { status: status as any, ...(status === 'completed' ? { completed_by_name: user?.full_name } : {}) });
    loadItems(pagination.page);
  };

  const handleDelete = async (t: Task) => {
    if (!confirm(`Delete task "${t.title}"?`)) return;
    await deleteTask(t.id);
    loadItems(pagination.page);
  };

  const loadComments = async (taskId: string) => {
    const c = await getTaskComments(taskId);
    setComments(c);
    setShowComments(taskId);
    setCommentText('');
  };

  const addComment = async () => {
    if (!showComments || !commentText.trim() || !user) return;
    await addTaskComment({ task_id: showComments, user_id: user.id, user_name: user.full_name, comment: commentText });
    setCommentText('');
    loadComments(showComments);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <ListTodo size={14} className="text-[#008751]" /><span>Collaboration</span><span className="text-slate-300">/</span><span className="text-slate-800 font-medium">Tasks</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-500 mt-1 text-sm">{hospitalScope ? 'View and submit tasks assigned to your hospital' : (viewMode === 'mine' ? 'Tasks assigned to your hospital' : 'All tasks in the organization')}</p>
        </div>
        <div className="flex gap-2">
          {!hospitalScope && (
            <button onClick={() => setViewMode(viewMode === 'mine' ? 'all' : 'mine')} className="btn-secondary">
              {viewMode === 'mine' ? <Users size={16} /> : <UserCheck size={16} />}
              {viewMode === 'mine' ? 'All Tasks' : 'My Tasks'}
            </button>
          )}
          {!hospitalScope && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Assign Task</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pending" value={summary.pending} icon={Clock} color="primary" subtitle="Awaiting action" />
        <StatCard title="In Progress" value={summary.in_progress} icon={Play} color="blue" subtitle="Being worked on" />
        <StatCard title="Completed" value={summary.completed} icon={CheckCircle} color="teal" subtitle="Finished" />
        <StatCard title="Overdue" value={summary.overdue} icon={AlertTriangle} color="army" subtitle="Past due date" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="relative">
              <select className="input w-40 appearance-none" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); }}>
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button type="submit" className="btn-secondary">Search</button>
          </form>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12"><div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-12"><ListTodo size={40} className="mx-auto text-slate-300 mb-3" /><p className="text-slate-500 text-sm">No tasks found.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th><th>Hospital</th><th>Priority</th><th>Status</th><th>Due Date</th><th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(t => {
                    const hosp = hospitals.find(h => h.id === t.hospital_id);
                    const canSubmit = !t.hospital_id || t.hospital_id === user?.hospital_id || !hospitalScope;
                    return (
                    <tr key={t.id}>
                      <td className="font-medium text-slate-900">{t.title}</td>
                      <td className="text-sm text-slate-600">{hosp?.hospital_name || (t.hospital_id ? '-' : 'All Hospitals')}</td>
                      <td><span className={`badge ${PRIORITY_COLORS[t.priority] || ''}`}>{t.priority}</span></td>
                      <td><span className={STATUS_COLORS[t.status] || 'badge-inactive'}>{t.status}</span></td>
                      <td className="text-slate-500">{t.due_date ? new Date(t.due_date).toLocaleDateString() : '-'}</td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          {canSubmit && t.status !== 'completed' && (
                            <button onClick={() => handleStatusChange(t.id, 'completed')} className="btn btn-xs btn-primary p-1.5" title="Submit as Complete">
                              <CheckCircle size={13} />
                            </button>
                          )}
                          {!hospitalScope && <button onClick={() => openEdit(t)} className="btn btn-xs btn-secondary p-1.5"><Pencil size={13} /></button>}
                          <button onClick={() => loadComments(t.id)} className="btn btn-xs btn-secondary p-1.5" title="Comments"><MessageSquare size={13} /></button>
                          {!hospitalScope && t.status === 'pending' && <button onClick={() => handleStatusChange(t.id, 'in_progress')} className="btn btn-xs btn-secondary p-1.5" title="Start"><Play size={13} /></button>}
                          {!hospitalScope && t.status === 'in_progress' && <button onClick={() => handleStatusChange(t.id, 'completed')} className="btn btn-xs btn-secondary p-1.5" title="Complete"><CheckCircle size={13} /></button>}
                          {!hospitalScope && <button onClick={() => handleDelete(t)} className="btn btn-xs btn-danger p-1.5"><Trash2 size={13} /></button>}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadItems} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Task' : 'Assign Task to Hospital'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Title</label><input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
          <div><label className="label">Description</label><textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Priority</label>
              <div className="relative">
                <select className="input appearance-none" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div><label className="label">Due Date</label><input type="date" className="input" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
          </div>
          {!hospitalScope && (
            <div>
              <label className="label">Hospital</label>
              <div className="relative">
                <select className="input appearance-none" value={form.hospital_id} onChange={e => setForm({ ...form, hospital_id: e.target.value })}>
                  <option value="">All Hospitals</option>
                  {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editItem ? 'Update Task' : 'Create Task'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={showComments !== null} onClose={() => setShowComments(null)} title="Task Comments">
        <div className="space-y-4">
          <div className="max-h-60 overflow-y-auto space-y-2">
            {comments.map(c => (
              <div key={c.id} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-700">{c.user_name || 'Unknown'}</span>
                  <span className="text-[10px] text-slate-400">{new Date(c.created_at?.seconds ? c.created_at.seconds * 1000 : c.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-slate-600">{c.comment}</p>
              </div>
            ))}
            {comments.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No comments yet.</p>}
          </div>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Add a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} />
            <button onClick={addComment} className="btn-primary">Send</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
