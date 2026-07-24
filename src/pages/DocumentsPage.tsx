import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, FileText, Download, Archive, ChevronDown, BookOpen, Layers, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDocuments, createDocument, updateDocument, deleteDocument, getDocumentCategories, getDocumentVersions, archiveDocument, publishDocument } from '../lib/documents';
import { getAllHospitals } from '../lib/hospitals';
import { getHospitalScope } from '../lib/scope';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import StatCard from '../components/common/StatCard';
import type { Document, DocumentCategory, DocumentVersion, DocumentType } from '../types';
import type { Pagination as PaginationType } from '../types';

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'circular', label: 'Circular' },
  { value: 'policy', label: 'Policy' },
  { value: 'guideline', label: 'Guideline' },
  { value: 'sop', label: 'SOP' },
  { value: 'report', label: 'Report' },
  { value: 'meeting_minutes', label: 'Meeting Minutes' },
  { value: 'audit_report', label: 'Audit Report' },
  { value: 'financial_report', label: 'Financial Report' },
  { value: 'research', label: 'Research' },
];

export default function DocumentsPage() {
  const { hasRole, user } = useAuth();
  const canManage = hasRole('super_admin', 'executive_secretary', 'hospital_admin');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [hospitals, setHospitals] = useState<{ id: string; hospital_name: string }[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Document | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', document_type: '' as DocumentType | '', category_id: '',
    file_url: '', file_name: '', hospital_id: '', tags: '',
  });
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [versionsDoc, setVersionsDoc] = useState<Document | null>(null);

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const scope = getHospitalScope(user);
      const { data, total } = await getDocuments(page, 50, search || undefined, undefined, filterType || undefined, filterStatus || undefined, scope);
      setDocuments(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [filterType, filterStatus]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadData(); };

  const loadDropdowns = async () => {
    try {
      const [catData, hospData] = await Promise.all([
        getDocumentCategories(),
        getAllHospitals(),
      ]);
      setCategories(catData || []);
      setHospitals((hospData || []).map(h => ({ id: h.id, hospital_name: h.hospital_name })));
    } catch {}
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ title: '', description: '', document_type: '', category_id: '', file_url: '', file_name: '', hospital_id: '', tags: '' });
    loadDropdowns();
    setShowModal(true);
  };

  const openEdit = (item: Document) => {
    setEditItem(item);
    setForm({
      title: item.title, description: item.description || '', document_type: item.document_type,
      category_id: item.category_id || '', file_url: item.file_url, file_name: item.file_name,
      hospital_id: item.hospital_id || '', tags: (item.tags || []).join(', '),
    });
    loadDropdowns();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.document_type) return;
    try {
      const payload = {
        ...form,
        document_type: form.document_type as DocumentType,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        uploaded_by: user?.id || '',
      };
      if (editItem) {
        await updateDocument(editItem.id, payload);
      } else {
        await createDocument(payload as any);
      }
      setShowModal(false);
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (item: Document) => {
    if (!confirm(`Delete "${item.title}" permanently? This cannot be undone.`)) return;
    try {
      await deleteDocument(item.id);
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleArchive = async (item: Document) => {
    if (!confirm(`Archive "${item.title}"?`)) return;
    try {
      await archiveDocument(item.id);
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handlePublish = async (item: Document) => {
    try {
      await publishDocument(item.id);
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const openVersions = async (item: Document) => {
    try {
      const data = await getDocumentVersions(item.id);
      setVersions(data || []);
      setVersionsDoc(item);
      setShowVersions(true);
    } catch (err: any) { alert(err.message); }
  };

  const published = documents.filter(d => d.status === 'published');
  const archived = documents.filter(d => d.status === 'archived');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <BookOpen size={14} className="text-[#008751]" />
            <span>Documents</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Document Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Document Management</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage circulars, policies, guidelines, and reports</p>
        </div>
        {canManage && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Document</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Documents" value={pagination.total} icon={FileText} color="primary" subtitle="All documents" />
        <StatCard title="Published" value={published.length} icon={BookOpen} color="teal" subtitle="Currently published" />
        <StatCard title="Archived" value={archived.length} icon={Archive} color="blue" subtitle="Archived documents" />
        <StatCard title="Categories" value={categories.length || new Set(documents.map(d => d.category_id)).size} icon={Layers} color="army" subtitle="Document categories" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search by title or description..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input max-w-[160px]" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              {DOCUMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select className="input max-w-[140px]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
              <option value="draft">Draft</option>
            </select>
            <button type="submit" className="btn-secondary">Search</button>
          </form>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No documents found.</p>
              {canManage && <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Add Document</button>}
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Hospital</th>
                  <th>Status</th>
                  <th>Version</th>
                  <th>Uploaded By</th>
                  <th>Date</th>
                  {canManage && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {documents.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <FileText size={18} className="text-[#008751]" />
                        </div>
                        <div>
                          <span className="font-medium text-slate-900">{d.title}</span>
                          {d.description && <p className="text-xs text-slate-400 line-clamp-1 max-w-xs">{d.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge-active text-xs">{d.document_type.replace('_', ' ')}</span>
                    </td>
                    <td>{d.category_name || '-'}</td>
                    <td>{d.hospital_name || '-'}</td>
                    <td>
                      <span className={d.status === 'published' ? 'badge-active' : 'badge-inactive'}>{d.status}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => openVersions(d)}
                        className="flex items-center gap-1 text-sm text-[#008751] hover:underline"
                      >
                        <History size={14} />
                        v{d.version}
                      </button>
                    </td>
                    <td className="text-slate-600 text-sm">{d.uploaded_by_name || '-'}</td>
                    <td className="text-slate-500 text-sm">{d.created_at?.toDate?.()?.toLocaleDateString() || d.created_at || '-'}</td>
                    {canManage && (
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          {d.file_url && (
                            <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary" title="Download">
                              <Download size={14} />
                            </a>
                          )}
                          <button onClick={() => openEdit(d)} className="btn btn-sm btn-secondary" title="Edit"><Pencil size={14} /></button>
                          {d.status === 'published' ? (
                            <button onClick={() => handleArchive(d)} className="btn btn-sm btn-secondary" title="Archive"><Archive size={14} /></button>
                          ) : d.status === 'archived' ? (
                            <button onClick={() => handlePublish(d)} className="btn btn-sm btn-secondary" title="Publish"><BookOpen size={14} /></button>
                          ) : null}
                          <button onClick={() => handleDelete(d)} className="btn btn-sm btn-danger" title="Delete"><Trash2 size={14} /></button>
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
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadData} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Document' : 'Add Document'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Document Type</label>
              <select className="input" value={form.document_type} onChange={e => setForm({ ...form, document_type: e.target.value as DocumentType })} required>
                <option value="">Select type...</option>
                {DOCUMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Select category...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">File URL</label>
              <input className="input" value={form.file_url} onChange={e => setForm({ ...form, file_url: e.target.value })} />
            </div>
            <div>
              <label className="label">File Name</label>
              <input className="input" value={form.file_name} onChange={e => setForm({ ...form, file_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Hospital</label>
              <select className="input" value={form.hospital_id} onChange={e => setForm({ ...form, hospital_id: e.target.value })}>
                <option value="">All hospitals</option>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tags (comma separated)</label>
              <input className="input" placeholder="e.g. policy, health, 2024" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editItem ? 'Update Document' : 'Create Document'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={showVersions} onClose={() => setShowVersions(false)} title={`Version History - ${versionsDoc?.title || ''}`} size="md">
        {versions.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No version history available.</p>
        ) : (
          <div className="space-y-3">
            {versions.map(v => (
              <div key={v.id} className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <FileText size={16} className="text-[#008751]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">v{v.version} - {v.file_name}</p>
                    <p className="text-xs text-slate-400">
                      {v.uploaded_by_name || 'Unknown'} &middot; {v.created_at?.toDate?.()?.toLocaleDateString() || v.created_at || '-'}
                    </p>
                    {v.change_notes && <p className="text-xs text-slate-500 mt-1">{v.change_notes}</p>}
                  </div>
                </div>
                {v.file_url && (
                  <a href={v.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary"><Download size={14} /></a>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
          <button type="button" onClick={() => setShowVersions(false)} className="btn-secondary">Close</button>
        </div>
      </Modal>
    </div>
  );
}
