import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getFinancialReports, createFinancialReport, deleteFinancialReport, getFinancialDocuments, createFinancialDocument, deleteFinancialDocument, getFinancialReviews, respondToFinancialReview } from '../lib/finance';
import { getAllHospitals } from '../lib/hospitals';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Plus, Trash2, Download, Upload, MessageSquare, X, Check } from 'lucide-react';

export default function FinancialReportsPage() {
  const { user, hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title: '', type: 'monthly' as const, period: '', hospital_id: '', report_category: '', content: '', total_revenue: 0, total_expenditure: 0, net_position: 0, format: 'pdf' as const });

  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submitForm, setSubmitForm] = useState({ title: '', type: 'monthly' as const, period: '', content: '', total_revenue: 0, total_expenditure: 0, net_position: 0 });

  const [documents, setDocuments] = useState<any[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({ document_name: '', document_url: '', document_type: 'spreadsheet', notes: '' });

  const [reviews, setReviews] = useState<any[]>([]);
  const [responseText, setResponseText] = useState('');
  const [respondingId, setRespondingId] = useState('');

  const isFinance = hasRole('director_finance');
  const isHospitalAdmin = hasRole('hospital_admin');

  const load = async () => {
    setLoading(true);
    const [r, h] = await Promise.all([getFinancialReports(1, 100, search), getAllHospitals()]);
    let data = r.data;
    if (filterType) data = data.filter((d: any) => d.type === filterType);
    setReports(data);
    setHospitals(h);
    setLoading(false);
  };

  const loadDocuments = async () => {
    const docs = await getFinancialDocuments(user?.hospital_id || undefined);
    setDocuments(docs);
  };

  const loadReviews = async () => {
    const revs = await getFinancialReviews(user?.hospital_id || undefined);
    setReviews(revs);
  };

// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [filterType, load]);

  useEffect(() => {
    const action = searchParams.get('action');
    if (!action) return;
    setSearchParams({}, { replace: true });
    if (action === 'submit' && isHospitalAdmin) {
      setShowSubmitForm(true);
      setShowUploadForm(false);
    } else if (action === 'upload' && isHospitalAdmin) {
      setShowUploadForm(true);
      setShowSubmitForm(false);
      loadDocuments();
    } else if (action === 'reviews' && isHospitalAdmin) {
      loadReviews();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, loadDocuments, loadReviews, isHospitalAdmin, setSearchParams]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const hospital = hospitals.find(h => h.id === form.hospital_id);
    await createFinancialReport({
      ...form,
      total_revenue: Number(form.total_revenue),
      total_expenditure: Number(form.total_expenditure),
      net_position: Number(form.net_position),
      status: 'active' as const,
      hospital_name: hospital?.hospital_name || 'Board-wide',
    });
    setShowForm(false);
    setForm({ title: '', type: 'monthly', period: '', hospital_id: '', report_category: '', content: '', total_revenue: 0, total_expenditure: 0, net_position: 0, format: 'pdf' });
    load();
  };

  const handleSubmitReport = async (e: any) => {
    e.preventDefault();
    const hospital = hospitals.find(h => h.id === user?.hospital_id);
    await createFinancialReport({
      ...submitForm,
      total_revenue: Number(submitForm.total_revenue),
      total_expenditure: Number(submitForm.total_expenditure),
      net_position: Number(submitForm.net_position),
      hospital_id: user?.hospital_id || '',
      hospital_name: hospital?.hospital_name || 'Board-wide',
      report_category: 'submitted',
      format: 'pdf',
      status: 'active',
      created_by: user?.id,
    });
    setShowSubmitForm(false);
    setSubmitForm({ title: '', type: 'monthly', period: '', content: '', total_revenue: 0, total_expenditure: 0, net_position: 0 });
    load();
  };

  const handleUploadDoc = async (e: any) => {
    e.preventDefault();
    const hospital = hospitals.find(h => h.id === user?.hospital_id);
    await createFinancialDocument({
      ...uploadForm,
      hospital_id: user?.hospital_id || '',
      hospital_name: hospital?.hospital_name || 'Board-wide',
      uploaded_by: user?.id || '',
    });
    setShowUploadForm(false);
    setUploadForm({ document_name: '', document_url: '', document_type: 'spreadsheet', notes: '' });
    loadDocuments();
  };

  const handleDeleteDoc = async (id: string) => {
    if (confirm('Delete this document?')) {
      await deleteFinancialDocument(id);
      loadDocuments();
    }
  };

  const handleRespond = async (id: string) => {
    if (!responseText.trim()) return;
    await respondToFinancialReview(id, responseText);
    setResponseText('');
    setRespondingId('');
    loadReviews();
  };

  const handleDelete = async (id: string) => { if (confirm('Delete this report?')) { await deleteFinancialReport(id); load(); } };

  const handleExport = (report: any) => {
    const rows = [['Metric', 'Value'],['Title', report.title],['Period', report.period],['Type', report.type],['Revenue', report.total_revenue || 'N/A'],['Expenditure', report.total_expenditure || 'N/A'],['Net Position', report.net_position || 'N/A']];
    let csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${report.title.replace(/\s+/g, '_')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-700 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 40%, #3a3a3a 100%)' }}>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-slate-200/80 text-sm mb-2"><FileText size={14} /><span>Finance</span><span className="text-slate-500/50">/</span><span className="text-white font-medium">Financial Reports</span></div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Financial Reports</h1>
          <p className="mt-1.5 text-slate-100/60 text-sm">Monthly, quarterly, and annual financial statements and management reports</p>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <input className="input w-64" placeholder="Search reports..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
          <select className="input w-40" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
            <option value="adhoc">Ad-hoc</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          {isHospitalAdmin && (
            <>
              <button onClick={() => { setShowSubmitForm(true); setShowUploadForm(false); }} className="btn-primary"><Plus size={16} /> Submit Report</button>
              <button onClick={() => { setShowUploadForm(true); setShowSubmitForm(false); loadDocuments(); }} className="btn-secondary"><Upload size={16} /> Upload</button>
              <button onClick={() => { loadReviews(); }} className="btn-secondary"><MessageSquare size={16} /> Reviews</button>
            </>
          )}
          {isFinance && <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> Generate Report</button>}
        </div>
      </div>

      {showForm && isFinance && (
        <div className="card p-6 border-t-2 border-t-slate-400">
          <h3 className="font-semibold text-slate-900 mb-4">Generate Financial Report</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2"><label className="label">Title</label><input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
            <div><label className="label">Type</label><select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option><option value="adhoc">Ad-hoc</option></select></div>
            <div><label className="label">Period</label><input className="input" value={form.period} onChange={e => setForm({...form, period: e.target.value})} placeholder="e.g. March 2025" required /></div>
            <div><label className="label">Hospital</label><select className="input" value={form.hospital_id} onChange={e => setForm({...form, hospital_id: e.target.value})}><option value="">Board-wide</option>{hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}</select></div>
            <div><label className="label">Category</label><input className="input" value={form.report_category} onChange={e => setForm({...form, report_category: e.target.value})} placeholder="e.g. Financial Statement" /></div>
            <div><label className="label">Format</label><select className="input" value={form.format} onChange={e => setForm({...form, format: e.target.value as any})}><option value="pdf">PDF</option><option value="excel">Excel</option></select></div>
            <div><label className="label">Revenue (₦)</label><input type="number" className="input" value={form.total_revenue} onChange={e => setForm({...form, total_revenue: +e.target.value})} /></div>
            <div><label className="label">Expenditure (₦)</label><input type="number" className="input" value={form.total_expenditure} onChange={e => setForm({...form, total_expenditure: +e.target.value})} /></div>
            <div><label className="label">Net Position (₦)</label><input type="number" className="input" value={form.net_position} onChange={e => setForm({...form, net_position: +e.target.value})} /></div>
            <div className="md:col-span-3"><label className="label">Report Content</label><textarea className="input" rows={4} value={form.content} onChange={e => setForm({...form, content: e.target.value})} /></div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary">Generate Report</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isHospitalAdmin && showSubmitForm && (
        <div className="card p-6 border-t-2 border-t-blue-400">
          <h3 className="font-semibold text-slate-900 mb-4">Submit Financial Report</h3>
          <form onSubmit={handleSubmitReport} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2"><label className="label">Report Title</label><input className="input" value={submitForm.title} onChange={e => setSubmitForm({...submitForm, title: e.target.value})} required /></div>
            <div><label className="label">Type</label><select className="input" value={submitForm.type} onChange={e => setSubmitForm({...submitForm, type: e.target.value as any})}><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option><option value="adhoc">Ad-hoc</option></select></div>
            <div><label className="label">Period</label><input className="input" value={submitForm.period} onChange={e => setSubmitForm({...submitForm, period: e.target.value})} placeholder="e.g. March 2025" required /></div>
            <div className="md:col-span-2"><label className="label">Content / Summary</label><textarea className="input" rows={3} value={submitForm.content} onChange={e => setSubmitForm({...submitForm, content: e.target.value})} /></div>
            <div><label className="label">Revenue (₦)</label><input type="number" className="input" value={submitForm.total_revenue} onChange={e => setSubmitForm({...submitForm, total_revenue: +e.target.value})} /></div>
            <div><label className="label">Expenditure (₦)</label><input type="number" className="input" value={submitForm.total_expenditure} onChange={e => setSubmitForm({...submitForm, total_expenditure: +e.target.value})} /></div>
            <div><label className="label">Net Position (₦)</label><input type="number" className="input" value={submitForm.net_position} onChange={e => setSubmitForm({...submitForm, net_position: +e.target.value})} /></div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary">Submit Report</button>
              <button type="button" onClick={() => setShowSubmitForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isHospitalAdmin && showUploadForm && (
        <div className="card p-6 border-t-2 border-t-emerald-400">
          <h3 className="font-semibold text-slate-900 mb-4">Upload Supporting Document</h3>
          <form onSubmit={handleUploadDoc} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2"><label className="label">Document Name</label><input className="input" value={uploadForm.document_name} onChange={e => setUploadForm({...uploadForm, document_name: e.target.value})} required /></div>
            <div><label className="label">Document Type</label><select className="input" value={uploadForm.document_type} onChange={e => setUploadForm({...uploadForm, document_type: e.target.value})}><option value="spreadsheet">Spreadsheet</option><option value="pdf">PDF</option><option value="invoice">Invoice</option><option value="receipt">Receipt</option><option value="other">Other</option></select></div>
            <div className="md:col-span-3"><label className="label">Document URL / File Path</label><input className="input" value={uploadForm.document_url} onChange={e => setUploadForm({...uploadForm, document_url: e.target.value})} placeholder="Link to document or upload path" required /></div>
            <div className="md:col-span-3"><label className="label">Notes</label><textarea className="input" rows={2} value={uploadForm.notes} onChange={e => setUploadForm({...uploadForm, notes: e.target.value})} /></div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary"><Upload size={16} /> Upload Document</button>
              <button type="button" onClick={() => setShowUploadForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>

          {documents.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-slate-700 mb-3">Uploaded Documents</h4>
              <div className="space-y-2">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-50"><FileText size={16} className="text-emerald-600" /></div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{doc.document_name}</p>
                        <p className="text-xs text-slate-400 capitalize">{doc.document_type} &middot; {new Date(doc.created_at?.toDate?.() || doc.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteDoc(doc.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isHospitalAdmin && reviews.length > 0 && (
        <div className="card p-6 border-t-2 border-t-amber-400">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Financial Review Requests</h3>
            <button onClick={() => setReviews([])} className="text-xs text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{r.request}</p>
                    {r.report_title && <p className="text-xs text-slate-400">Report: {r.report_title}</p>}
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase ${
                    r.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                    r.status === 'responded' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>{r.status}</span>
                </div>
                {r.response && (
                  <div className="mt-2 p-2.5 rounded-lg bg-blue-50/50 border border-blue-100">
                    <p className="text-xs text-slate-500 mb-1">Your response:</p>
                    <p className="text-sm text-slate-700">{r.response}</p>
                  </div>
                )}
                {r.status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <input className="input flex-1 text-sm" placeholder="Type your response..." value={respondingId === r.id ? responseText : ''} onChange={e => { setRespondingId(r.id); setResponseText(e.target.value); }} />
                    <button onClick={() => handleRespond(r.id)} className="btn-primary text-sm"><Check size={14} /> Respond</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(r => (
          <div key={r.id} className="card p-5 hover:shadow-md transition-shadow border-t-2 border-t-slate-400">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-slate-50"><FileText size={20} className="text-slate-600" /></div>
              {isFinance && <button onClick={() => handleDelete(r.id)} className="p-1 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>}
            </div>
            <h3 className="font-semibold text-slate-800 text-sm mb-1">{r.title}</h3>
            <p className="text-xs text-slate-500 mb-3">{r.period} &middot; <span className="capitalize">{r.type}</span></p>
            {r.total_revenue !== undefined && (
              <div className="space-y-1.5 text-xs mb-3">
                <div className="flex justify-between"><span className="text-slate-500">Revenue</span><span className="font-semibold text-teal-700">₦{(r.total_revenue || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Expenditure</span><span className="font-semibold text-orange-700">₦{(r.total_expenditure || 0).toLocaleString()}</span></div>
                <div className="flex justify-between border-t pt-1"><span className="text-slate-500">Net</span><span className={`font-bold ${(r.net_position || 0) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>₦{(r.net_position || 0).toLocaleString()}</span></div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase ${r.type === 'annual' ? 'bg-purple-50 text-purple-700' : r.type === 'quarterly' ? 'bg-blue-50 text-blue-700' : r.type === 'monthly' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}`}>{r.type}</span>
              <button onClick={() => handleExport(r)} className="ml-auto p-1.5 rounded-lg hover:bg-slate-50 text-slate-400" title="Export CSV"><Download size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      {reports.length === 0 && <p className="text-center py-12 text-slate-400">No reports generated yet.</p>}
    </div>
  );
}
