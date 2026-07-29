import { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, ClipboardCheck, Clock, AlertTriangle, MessageSquare, UserCheck, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getApprovals, approveRequest, rejectRequest, returnRequest, getApprovalComments, getApprovalsSummary } from '../lib/approvals';
import { getHospitalScope } from '../lib/scope';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import StatCard from '../components/common/StatCard';
import type { Approval, ApprovalComment } from '../types';
import type { Pagination as PaginationType } from '../types';

const ENTITY_TYPES = [
  { value: 'report', label: 'Report' },
  { value: 'document', label: 'Document' },
  { value: 'workflow', label: 'Workflow' },
  { value: 'budget', label: 'Budget' },
  { value: 'audit', label: 'Audit' },
  { value: 'transfer', label: 'Transfer' },
];

export default function ApprovalsPage() {
  const { hasRole, user } = useAuth();
  const isReviewer = hasRole('super_admin', 'executive_secretary', 'hospital_admin', 'director_hr', 'director_medical_services', 'director_nursing_services', 'director_prs', 'director_pharmaceutical_services', 'director_laboratory_services', 'director_finance');
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEntityType, setFilterEntityType] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ pending: 0, approved: 0, rejected: 0, returned: 0 });
  const [showDetail, setShowDetail] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [comments, setComments] = useState<ApprovalComment[]>([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approved' | 'rejected' | 'returned'>('approved');
  const [actionComment, setActionComment] = useState('');

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const scope = getHospitalScope(user);
      const { data, total } = await getApprovals(page, 50, search || undefined, user?.id || undefined, undefined, filterStatus || undefined, filterEntityType || undefined, scope);
      setApprovals(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const scope = getHospitalScope(user);
      const s = await getApprovalsSummary(user?.id, scope);
      setSummary(s);
    } catch {}
  };

  useEffect(() => { loadData(); loadSummary(); }, [filterStatus, filterEntityType]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadData(); };

  const openDetail = async (item: Approval) => {
    setSelectedApproval(item);
    try {
      const data = await getApprovalComments(item.id);
      setComments(data || []);
    } catch {
      setComments([]);
    }
    setShowDetail(true);
  };

  const openAction = (type: 'approved' | 'rejected' | 'returned') => {
    setActionType(type);
    setActionComment('');
    setShowActionModal(true);
  };

  const handleAction = async () => {
    if (!selectedApproval || !user) return;
    try {
      if (actionType === 'approved') {
        await approveRequest(selectedApproval.id, user.id, actionComment || undefined);
      } else if (actionType === 'rejected') {
        await rejectRequest(selectedApproval.id, user.id, actionComment || undefined);
      } else {
        await returnRequest(selectedApproval.id, user.id, actionComment || undefined);
      }
      setShowActionModal(false);
      setShowDetail(false);
      setSelectedApproval(null);
      loadData(pagination.page);
      loadSummary();
    } catch (err: any) { alert(err.message); }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={14} className="text-amber-500" />;
      case 'approved': return <CheckCircle size={14} className="text-emerald-500" />;
      case 'rejected': return <XCircle size={14} className="text-red-500" />;
      case 'returned': return <RotateCcw size={14} className="text-blue-500" />;
      default: return null;
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    returned: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <ClipboardCheck size={14} className="text-[#008751]" />
            <span>Workflow</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Approvals</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Approval Center</h1>
          <p className="text-slate-500 mt-1 text-sm">Review and manage approval requests across the organization</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pending (My)" value={summary.pending} icon={Clock} color="primary" subtitle="Awaiting your review" />
        <StatCard title="Approved" value={summary.approved} icon={CheckCircle} color="teal" subtitle="Approved requests" />
        <StatCard title="Rejected" value={summary.rejected} icon={XCircle} color="blue" subtitle="Rejected requests" />
        <StatCard title="Returned" value={summary.returned} icon={RotateCcw} color="army" subtitle="Returned for revision" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search by title or requester..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input max-w-[140px]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="returned">Returned</option>
            </select>
            <select className="input max-w-[160px]" value={filterEntityType} onChange={e => setFilterEntityType(e.target.value)}>
              <option value="">All Types</option>
              {ENTITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <button type="submit" className="btn-secondary">Search</button>
          </form>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : approvals.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardCheck size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No approval requests found.</p>
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Entity Type</th>
                  <th>Entity Title</th>
                  <th>Requester</th>
                  <th>Reviewer</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Submitted</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map(a => (
                  <tr key={a.id}>
                    <td>
                      <span className="badge-active text-xs">{a.entity_type.replace('_', ' ')}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <ClipboardCheck size={18} className="text-[#008751]" />
                        </div>
                        <span className="font-medium text-slate-900">{a.entity_title || 'Untitled'}</span>
                      </div>
                    </td>
                    <td className="text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <UserCheck size={14} className="text-slate-400" />
                        {a.requester_name || '-'}
                      </div>
                    </td>
                    <td className="text-slate-600 text-sm">{a.reviewer_name || '-'}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[a.status] || ''}`}>
                        {statusIcon(a.status)}
                        {a.status}
                      </span>
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                        a.priority === 'urgent' ? 'text-red-600' :
                        a.priority === 'high' ? 'text-amber-600' :
                        a.priority === 'medium' ? 'text-blue-600' :
                        'text-slate-500'
                      }`}>
                        <AlertTriangle size={12} />
                        {a.priority}
                      </span>
                    </td>
                    <td className="text-slate-500 text-sm">{a.submitted_at?.toDate?.()?.toLocaleDateString() || a.submitted_at || '-'}</td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openDetail(a)} className="btn btn-sm btn-secondary">View</button>
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

      <Modal open={showDetail} onClose={() => setShowDetail(false)} title="Approval Details" size="lg">
        {selectedApproval && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label text-xs text-slate-400">Entity Type</label>
                <p className="text-sm font-medium text-slate-800 capitalize">{selectedApproval.entity_type.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="label text-xs text-slate-400">Status</label>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[selectedApproval.status] || ''}`}>
                  {statusIcon(selectedApproval.status)}
                  {selectedApproval.status}
                </span>
              </div>
              <div className="col-span-2">
                <label className="label text-xs text-slate-400">Entity Title</label>
                <p className="text-sm font-medium text-slate-800">{selectedApproval.entity_title || 'Untitled'}</p>
              </div>
              <div>
                <label className="label text-xs text-slate-400">Requester</label>
                <p className="text-sm text-slate-700">{selectedApproval.requester_name || '-'}</p>
              </div>
              <div>
                <label className="label text-xs text-slate-400">Reviewer</label>
                <p className="text-sm text-slate-700">{selectedApproval.reviewer_name || '-'}</p>
              </div>
              <div>
                <label className="label text-xs text-slate-400">Priority</label>
                <p className="text-sm font-medium text-slate-800 capitalize">{selectedApproval.priority}</p>
              </div>
              <div>
                <label className="label text-xs text-slate-400">Submitted</label>
                <p className="text-sm text-slate-700">{selectedApproval.submitted_at?.toDate?.()?.toLocaleDateString() || selectedApproval.submitted_at || '-'}</p>
              </div>
              {selectedApproval.hospital_name && (
                <div className="col-span-2">
                  <label className="label text-xs text-slate-400">Hospital</label>
                  <p className="text-sm text-slate-700">{selectedApproval.hospital_name}</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={16} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">Comments</h3>
              </div>
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3">No comments yet.</p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {comments.map(c => (
                    <div key={c.id} className="bg-slate-50 px-4 py-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-700">{c.user_name || 'Unknown'}</span>
                          {c.decision && (
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                              c.decision === 'approved' ? 'text-emerald-600' :
                              c.decision === 'rejected' ? 'text-red-600' : 'text-blue-600'
                            }`}>
                              {c.decision === 'approved' ? <ThumbsUp size={12} /> : c.decision === 'rejected' ? <ThumbsDown size={12} /> : <RotateCcw size={12} />}
                              {c.decision}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">{c.created_at?.toDate?.()?.toLocaleDateString() || c.created_at || '-'}</span>
                      </div>
                      <p className="text-sm text-slate-600">{c.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isReviewer && selectedApproval.reviewer_id === user?.id && selectedApproval.status === 'pending' && (
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button onClick={() => openAction('returned')} className="btn-secondary"><RotateCcw size={16} /> Return</button>
                <button onClick={() => openAction('rejected')} className="btn-danger"><XCircle size={16} /> Reject</button>
                <button onClick={() => openAction('approved')} className="btn-primary"><CheckCircle size={16} /> Approve</button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={showActionModal}
        onClose={() => setShowActionModal(false)}
        title={`${actionType === 'approved' ? 'Approve' : actionType === 'rejected' ? 'Reject' : 'Return'} Request`}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Comment</label>
            <textarea
              className="input"
              rows={4}
              placeholder={actionType === 'approved' ? 'Add approval comment (optional)...' : 'Explain why this request is being returned/rejected...'}
              value={actionComment}
              onChange={e => setActionComment(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowActionModal(false)} className="btn-secondary">Cancel</button>
            <button
              type="button"
              onClick={handleAction}
              className={actionType === 'approved' ? 'btn-primary' : actionType === 'rejected' ? 'btn-danger' : 'btn-secondary'}
            >
              {actionType === 'approved' ? <CheckCircle size={16} /> : actionType === 'rejected' ? <XCircle size={16} /> : <RotateCcw size={16} />}
              {actionType === 'approved' ? 'Approve' : actionType === 'rejected' ? 'Reject' : 'Return'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
