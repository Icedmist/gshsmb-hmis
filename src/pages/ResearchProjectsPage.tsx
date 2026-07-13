import { useState, useEffect } from 'react';
import { ResearchProject, ResearchDocument, Pagination as PaginationType } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Pencil, Trash2, FlaskConical, BookOpen, CheckCircle2, Building2, FileText, X, ChevronDown } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getResearchProjects, createResearchProject, updateResearchProject, deleteResearchProject, getResearchDocuments, createResearchDocument, deleteResearchDocument } from '../lib/researchProjects';
import { getAllHospitals } from '../lib/hospitals';

export default function ResearchProjectsPage() {
  const { hasRole } = useAuth();
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState<ResearchProject | null>(null);
  const [form, setForm] = useState({ title: '', principal_investigator: '', hospital_id: '', description: '', start_date: '', end_date: '' });
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [documents, setDocuments] = useState<ResearchDocument[]>([]);
  const [showDocs, setShowDocs] = useState(false);
  const [docForm, setDocForm] = useState({ document_name: '', document_url: '', document_type: '' });
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const isAdmin = hasRole('super_admin') || hasRole('director_prs');

  const loadProjects = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getResearchProjects(page, 50, search);
      setProjects(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadProjects(); };

  const loadDropdowns = async () => {
    const hData = await getAllHospitals();
    setHospitals(hData || []);
  };

  const openCreate = () => {
    setEditProject(null);
    setForm({ title: '', principal_investigator: '', hospital_id: '', description: '', start_date: '', end_date: '' });
    setDocuments([]);
    loadDropdowns();
    setShowModal(true);
  };

  const openEdit = (p: ResearchProject) => {
    setEditProject(p);
    setForm({ title: p.title, principal_investigator: p.principal_investigator, hospital_id: p.hospital_id || '', description: p.description, start_date: p.start_date, end_date: p.end_date });
    loadDropdowns();
    loadDocuments(p.id);
    setShowModal(true);
  };

  const loadDocuments = async (projectId: string) => {
    try {
      const data = await getResearchDocuments(projectId);
      setDocuments(data || []);
    } catch {
      setDocuments([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editProject) {
        await updateResearchProject(editProject.id, form);
      } else {
        await createResearchProject(form);
      }
      setShowModal(false);
      loadProjects(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (p: ResearchProject) => {
    if (!confirm(`Delete project "${p.title}" permanently? This cannot be undone.`)) return;
    try {
      await deleteResearchProject(p.id);
      loadProjects(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleToggleStatus = async (p: ResearchProject) => {
    const newStatus = p.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} "${p.title}"?`)) return;
    try {
      await updateResearchProject(p.id, { status: newStatus });
      loadProjects(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const openDocModal = (projectId: string) => {
    setSelectedProjectId(projectId);
    setDocForm({ document_name: '', document_url: '', document_type: '' });
    setShowDocModal(true);
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    try {
      await createResearchDocument({ ...docForm, project_id: selectedProjectId });
      setShowDocModal(false);
      loadDocuments(selectedProjectId);
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteDocument = async (doc: ResearchDocument) => {
    if (!confirm(`Delete document "${doc.document_name}"?`)) return;
    try {
      await deleteResearchDocument(doc.id);
      if (editProject) loadDocuments(editProject.id);
    } catch (err: any) { alert(err.message); }
  };

  const completedProjects = projects.filter(p => p.status === 'inactive');
  const activeProjects = projects.filter(p => p.status === 'active');
  const uniqueHospitals = new Set(projects.filter(p => p.hospital_id).map(p => p.hospital_id)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <FlaskConical size={14} className="text-[#008751]" />
            <span>PRS</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Research</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Research Projects</h1>
          <p className="text-slate-500 mt-1 text-sm">Track research initiatives and associated documentation</p>
        </div>
        {isAdmin && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Project</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Projects" value={pagination.total} icon={FlaskConical} color="primary" subtitle="All research projects" />
        <StatCard title="Active" value={activeProjects.length} icon={BookOpen} color="teal" subtitle="Ongoing projects" />
        <StatCard title="Completed" value={completedProjects.length} icon={CheckCircle2} color="blue" subtitle="Completed projects" />
        <StatCard title="Hospitals" value={uniqueHospitals} icon={Building2} color="army" subtitle="Participating facilities" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search projects by title or PI..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button type="submit" className="btn-secondary">Search</button>
          </form>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <FlaskConical size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No research projects found.</p>
              {isAdmin && <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Add Project</button>}
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Principal Investigator</th>
                  <th>Hospital</th>
                  <th>Duration</th>
                  <th>Status</th>
                  {isAdmin && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <FlaskConical size={18} className="text-[#008751]" />
                        </div>
                        <div>
                          <span className="font-medium text-slate-900">{p.title}</span>
                          {p.description && <p className="text-xs text-slate-400 line-clamp-1 max-w-xs">{p.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="font-medium text-slate-700">{p.principal_investigator}</td>
                    <td>{p.hospital_name || '-'}</td>
                    <td className="text-sm">
                      <p>{p.start_date}</p>
                      <p className="text-xs text-slate-400">to {p.end_date}</p>
                    </td>
                    <td>
                      <span className={p.status === 'active' ? 'badge-active' : 'badge-inactive'}>{p.status}</span>
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { openEdit(p); }} className="btn btn-sm btn-secondary" title="Edit and manage documents"><Pencil size={14} /></button>
                          <button onClick={() => handleToggleStatus(p)} className="btn btn-sm btn-secondary">
                            {p.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => handleDelete(p)} className="btn btn-sm btn-danger"><Trash2 size={14} /></button>
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
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadProjects} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editProject ? 'Edit Research Project' : 'Add Research Project'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="label">Principal Investigator</label>
              <input className="input" value={form.principal_investigator} onChange={e => setForm({ ...form, principal_investigator: e.target.value })} required />
            </div>
            <div>
              <label className="label">Hospital</label>
              <select className="input" value={form.hospital_id} onChange={e => setForm({ ...form, hospital_id: e.target.value })} required>
                <option value="">Select hospital</option>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div>
              <label className="label">Start Date</label>
              <input type="date" className="input" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" className="input" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required />
            </div>
          </div>

          {editProject && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowDocs(!showDocs)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-[#008751]" />
                  <span className="text-sm font-medium text-slate-700">Documents</span>
                  {documents.length > 0 && (
                    <span className="text-xs bg-[#008751] text-white px-2 py-0.5 rounded-full">{documents.length}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openDocModal(editProject.id); }}
                    className="btn btn-sm btn-primary"
                  >
                    <Plus size={14} /> Add
                  </button>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${showDocs ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {showDocs && (
                <div className="p-4 border-t border-slate-200">
                  {documents.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-3">No documents attached yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {documents.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between bg-slate-50 px-3 py-2.5 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText size={16} className="text-slate-400" />
                            <div>
                              <p className="text-sm font-medium text-slate-700">{doc.document_name}</p>
                              <p className="text-xs text-slate-400">{doc.document_type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {doc.document_url && (
                              <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#008751] hover:underline">View</a>
                            )}
                            <button type="button" onClick={() => handleDeleteDocument(doc)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">
              {editProject ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={showDocModal} onClose={() => setShowDocModal(false)} title="Add Document" size="sm">
        <form onSubmit={handleAddDocument} className="space-y-4">
          <div>
            <label className="label">Document Name</label>
            <input className="input" value={docForm.document_name} onChange={e => setDocForm({ ...docForm, document_name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Document URL</label>
            <input className="input" value={docForm.document_url} onChange={e => setDocForm({ ...docForm, document_url: e.target.value })} />
          </div>
          <div>
            <label className="label">Document Type</label>
            <input className="input" placeholder="e.g. PDF, Report" value={docForm.document_type} onChange={e => setDocForm({ ...docForm, document_type: e.target.value })} required />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowDocModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add Document</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
