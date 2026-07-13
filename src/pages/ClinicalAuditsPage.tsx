import { useState, useEffect } from 'react';
import { ClinicalAudit, ClinicalAuditFinding, Pagination as PaginationType } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Pencil, Trash2, ClipboardCheck, ClipboardList, Building2, ChevronRight, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getClinicalAudits, createClinicalAudit, updateClinicalAudit, deleteClinicalAudit, getClinicalAuditFindings, createClinicalAuditFinding, updateClinicalAuditFinding } from '../lib/clinicalAudits';
import { getAllHospitals } from '../lib/hospitals';

export default function ClinicalAuditsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('super_admin', 'director_medical_services');
  const [audits, setAudits] = useState<ClinicalAudit[]>([]);
  const [hospitals, setHospitals] = useState<{ id: string; hospital_name: string }[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<ClinicalAudit | null>(null);
  const [form, setForm] = useState({ title: '', hospital_id: '', audit_date: '', findings: '', recommendations: '' });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [findings, setFindings] = useState<Record<string, ClinicalAuditFinding[]>>({});
  const [loadingFindings, setLoadingFindings] = useState<string | null>(null);
  const [showFindingModal, setShowFindingModal] = useState(false);
  const [findingForm, setFindingForm] = useState({ audit_id: '', finding: '', severity: 'medium' as 'low' | 'medium' | 'high' | 'critical', recommendation: '' });
  const [editFinding, setEditFinding] = useState<ClinicalAuditFinding | null>(null);

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getClinicalAudits(page, 50, search || undefined);
      setAudits(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadData(); };

  const loadHospitals = async () => {
    try {
      const data = await getAllHospitals();
      setHospitals((data || []).map((h: any) => ({ id: h.id, hospital_name: h.hospital_name })));
    } catch {}
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ title: '', hospital_id: '', audit_date: '', findings: '', recommendations: '' });
    loadHospitals();
    setShowModal(true);
  };

  const openEdit = (item: ClinicalAudit) => {
    setEditItem(item);
    setForm({ title: item.title, hospital_id: item.hospital_id, audit_date: item.audit_date, findings: item.findings, recommendations: item.recommendations });
    loadHospitals();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editItem) {
        await updateClinicalAudit(editItem.id, form);
      } else {
        await createClinicalAudit(form);
      }
      setShowModal(false);
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (item: ClinicalAudit) => {
    if (!confirm(`Delete ${item.title} permanently? This cannot be undone.`)) return;
    try {
      await deleteClinicalAudit(item.id);
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleToggleStatus = async (item: ClinicalAudit) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} ${item.title}?`)) return;
    try {
      await updateClinicalAudit(item.id, { status: newStatus });
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const toggleFindings = async (auditId: string) => {
    if (expandedId === auditId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(auditId);
    if (!findings[auditId]) {
      setLoadingFindings(auditId);
      try {
        const data = await getClinicalAuditFindings(auditId);
        setFindings(prev => ({ ...prev, [auditId]: data }));
      } catch {}
      setLoadingFindings(null);
    }
  };

  const openAddFinding = (auditId: string) => {
    setEditFinding(null);
    setFindingForm({ audit_id: auditId, finding: '', severity: 'medium', recommendation: '' });
    setShowFindingModal(true);
  };

  const handleSubmitFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editFinding) {
        await updateClinicalAuditFinding(editFinding.id, findingForm);
      } else {
        await createClinicalAuditFinding(findingForm);
      }
      setShowFindingModal(false);
      const data = await getClinicalAuditFindings(findingForm.audit_id);
      setFindings(prev => ({ ...prev, [findingForm.audit_id]: data }));
    } catch (err: any) { alert(err.message); }
  };

  const toggleFindingImplemented = async (finding: ClinicalAuditFinding) => {
    try {
      await updateClinicalAuditFinding(finding.id, { implemented: !finding.implemented, implemented_at: !finding.implemented ? new Date().toISOString() : null });
      const data = await getClinicalAuditFindings(finding.audit_id);
      setFindings(prev => ({ ...prev, [finding.audit_id]: data }));
    } catch (err: any) { alert(err.message); }
  };

  const completedCount = audits.filter(a => a.status === 'inactive').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <ClipboardCheck size={14} className="text-[#008751]" />
            <span>Clinical Services</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Clinical Audits</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Clinical Audits</h1>
          <p className="text-slate-500 mt-1 text-sm">Conduct and manage clinical audits across hospitals</p>
        </div>
        {canManage && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Audit</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Audits" value={pagination.total} icon={ClipboardCheck} color="primary" subtitle="All clinical audits" />
        <StatCard title="Active" value={audits.filter(a => a.status === 'active').length} icon={ClipboardList} color="teal" subtitle="Open audits" />
        <StatCard title="Completed" value={completedCount} icon={CheckCircle} color="blue" subtitle="Closed audits" />
        <StatCard title="Hospitals Covered" value={new Set(audits.map(a => a.hospital_id)).size} icon={Building2} color="army" subtitle="Hospitals audited" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search audits by title..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button type="submit" className="btn-secondary">Search</button>
          </form>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : audits.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardCheck size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No clinical audits found.</p>
              {canManage && <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Add Audit</button>}
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="w-8"></th>
                  <th>Title</th>
                  <th>Hospital</th>
                  <th>Audit Date</th>
                  <th>Status</th>
                  {canManage && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {audits.map(a => (
                  <>
                    <tr key={a.id} className="group cursor-pointer transition-colors hover:bg-slate-50" onClick={() => toggleFindings(a.id)}>
                      <td className="w-8">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleFindings(a.id); }}
                          className="p-1 rounded hover:bg-slate-200 transition-colors"
                        >
                          <ChevronRight size={14} className={`text-slate-400 transition-transform ${expandedId === a.id ? 'rotate-90' : ''}`} />
                        </button>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                            <ClipboardList size={18} className="text-[#008751]" />
                          </div>
                          <span className="font-medium text-slate-900">{a.title}</span>
                        </div>
                      </td>
                      <td>{a.hospital_name || '-'}</td>
                      <td>{a.audit_date}</td>
                      <td>
                        <span className={a.status === 'active' ? 'badge-active' : 'badge-inactive'}>{a.status === 'active' ? 'Active' : 'Completed'}</span>
                      </td>
                      {canManage && (
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={(e) => { e.stopPropagation(); openEdit(a); }} className="btn btn-sm btn-secondary"><Pencil size={14} /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleToggleStatus(a); }} className="btn btn-sm btn-secondary">
                              {a.status === 'active' ? 'Complete' : 'Reopen'}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(a); }} className="btn btn-sm btn-danger"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                    {expandedId === a.id && (
                      <tr key={`${a.id}-findings`}>
                        <td colSpan={6} className="p-0 bg-slate-50/50">
                          <div className="p-4 border-t border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <AlertCircle size={14} className="text-[#008751]" />
                                Audit Findings
                              </h4>
                              {canManage && (
                                <button onClick={() => openAddFinding(a.id)} className="btn btn-xs btn-primary"><Plus size={12} /> Add Finding</button>
                              )}
                            </div>
                            {loadingFindings === a.id ? (
                              <div className="flex justify-center py-4">
                                <div className="w-6 h-6 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
                              </div>
                            ) : (findings[a.id] || []).length === 0 ? (
                              <p className="text-sm text-slate-400 text-center py-3">No findings recorded yet.</p>
                            ) : (
                              <div className="space-y-2">
                                {(findings[a.id] || []).map(f => {
                                  const severityColors: Record<string, string> = {
                                    low: 'bg-blue-100 text-blue-700',
                                    medium: 'bg-amber-100 text-amber-700',
                                    high: 'bg-orange-100 text-orange-700',
                                    critical: 'bg-red-100 text-red-700',
                                  };
                                  return (
                                    <div key={f.id} className="flex items-start justify-between p-3 bg-white rounded-lg border border-slate-200">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${severityColors[f.severity] || ''}`}>{f.severity}</span>
                                          {f.implemented && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle size={12} /> Implemented</span>}
                                        </div>
                                        <p className="text-sm text-slate-800">{f.finding}</p>
                                        {f.recommendation && <p className="text-xs text-slate-500 mt-1">{f.recommendation}</p>}
                                      </div>
                                      <div className="flex items-center gap-1 ml-3">
                                        <button
                                          onClick={() => toggleFindingImplemented(f)}
                                          className={`btn btn-xs ${f.implemented ? 'btn-secondary' : 'btn-primary'}`}
                                          title={f.implemented ? 'Mark as not implemented' : 'Mark as implemented'}
                                        >
                                          {f.implemented ? <XCircle size={12} /> : <CheckCircle size={12} />}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                              <h5 className="text-sm font-medium text-slate-700 mb-1">Recommendations</h5>
                              <p className="text-sm text-slate-600 whitespace-pre-wrap">{a.recommendations || 'None provided'}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadData} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Audit' : 'Add Audit'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="label">Hospital</label>
              <select className="input" value={form.hospital_id} onChange={e => setForm({ ...form, hospital_id: e.target.value })} required>
                <option value="">Select hospital...</option>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
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
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editItem ? 'Update Audit' : 'Create Audit'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={showFindingModal} onClose={() => setShowFindingModal(false)} title={editFinding ? 'Edit Finding' : 'Add Finding'} size="md">
        <form onSubmit={handleSubmitFinding} className="space-y-4">
          <div>
            <label className="label">Finding</label>
            <textarea className="input" rows={3} value={findingForm.finding} onChange={e => setFindingForm({ ...findingForm, finding: e.target.value })} required />
          </div>
          <div>
            <label className="label">Severity</label>
            <select className="input" value={findingForm.severity} onChange={e => setFindingForm({ ...findingForm, severity: e.target.value as any })} required>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="label">Recommendation</label>
            <textarea className="input" rows={2} value={findingForm.recommendation} onChange={e => setFindingForm({ ...findingForm, recommendation: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowFindingModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editFinding ? 'Update' : 'Add Finding'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
