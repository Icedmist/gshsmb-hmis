import { useState, useEffect } from 'react';
import { getComplianceReports, createComplianceReport, updateComplianceReport, deleteComplianceReport } from '../lib/finance';
import { getAllHospitals } from '../lib/hospitals';
import { Scale, Plus, Edit3, Trash2 } from 'lucide-react';

export default function FinancialCompliancePage() {
  const [reports, setReports] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title: '', report_type: 'compliance_status' as const, hospital_id: '', department_id: '', period: '', findings: '', recommendations: '', status: 'open' as const });

  const load = async () => {
    setLoading(true);
    const [r, h] = await Promise.all([getComplianceReports(1, 100, search), getAllHospitals()]);
    setReports(r.data);
    setHospitals(h);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (editing) {
      await updateComplianceReport(editing.id, form);
    } else {
      const hospital = hospitals.find(h => h.id === form.hospital_id);
      await createComplianceReport({ ...form, hospital_name: hospital?.hospital_name || 'Board-wide' });
    }
    setShowForm(false); setEditing(null);
    setForm({ title: '', report_type: 'compliance_status', hospital_id: '', department_id: '', period: '', findings: '', recommendations: '', status: 'open' });
    load();
  };

  const handleEdit = (r: any) => { setForm(r); setEditing(r); setShowForm(true); };
  const handleDelete = async (id: string) => { if (confirm('Delete this report?')) { await deleteComplianceReport(id); load(); } };

  const openItems = reports.filter(r => r.status === 'open' || r.status === 'in_progress').length;
  const resolvedItems = reports.filter(r => r.status === 'resolved' || r.status === 'closed').length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-700 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #1a0000 0%, #3b0000 40%, #6b0000 100%)' }}>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-rose-200/80 text-sm mb-2"><Scale size={14} /><span>Finance</span><span className="text-rose-500/50">/</span><span className="text-white font-medium">Financial Compliance</span></div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Financial Compliance</h1>
          <p className="mt-1.5 text-rose-100/60 text-sm">Compliance monitoring, internal controls, and audit recommendation tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-5 text-center border-t-2 border-t-slate-400"><p className="text-xs text-slate-500 uppercase">Total Reports</p><p className="text-3xl font-bold text-slate-800 mt-1">{reports.length}</p></div>
        <div className="card p-5 text-center border-t-2 border-t-amber-400"><p className="text-xs text-slate-500 uppercase">Open Items</p><p className="text-3xl font-bold text-amber-600 mt-1">{openItems}</p></div>
        <div className="card p-5 text-center border-t-2 border-t-emerald-400"><p className="text-xs text-slate-500 uppercase">Resolved</p><p className="text-3xl font-bold text-emerald-700 mt-1">{resolvedItems}</p></div>
        <div className="card p-5 text-center border-t-2 border-t-blue-400"><p className="text-xs text-slate-500 uppercase">Resolution Rate</p><p className="text-3xl font-bold text-blue-700 mt-1">{reports.length > 0 ? Math.round((resolvedItems / reports.length) * 100) : 0}%</p></div>
      </div>

      <div className="flex items-center justify-between">
        <input className="input w-64" placeholder="Search reports..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
        <button onClick={() => { setEditing(null); setForm({ title: '', report_type: 'compliance_status', hospital_id: '', department_id: '', period: '', findings: '', recommendations: '', status: 'open' }); setShowForm(true); }} className="btn-primary"><Plus size={16} /> New Report</button>
      </div>

      {showForm && (
        <div className="card p-6 border-t-2 border-t-rose-400">
          <h3 className="font-semibold text-slate-900 mb-4">{editing ? 'Edit Compliance Report' : 'New Compliance Report'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2"><label className="label">Title</label><input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
            <div><label className="label">Report Type</label><select className="input" value={form.report_type} onChange={e => setForm({...form, report_type: e.target.value as any})}><option value="compliance_status">Compliance Status</option><option value="internal_control">Internal Control</option><option value="audit_recommendation">Audit Recommendation</option></select></div>
            <div><label className="label">Hospital</label><select className="input" value={form.hospital_id} onChange={e => setForm({...form, hospital_id: e.target.value})}><option value="">Board-wide</option>{hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}</select></div>
            <div><label className="label">Period</label><input className="input" value={form.period} onChange={e => setForm({...form, period: e.target.value})} placeholder="e.g. Q1 2025" required /></div>
            <div><label className="label">Status</label><select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value as any})}><option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></div>
            <div><label className="label">Findings</label><textarea className="input" rows={3} value={form.findings} onChange={e => setForm({...form, findings: e.target.value})} required /></div>
            <div><label className="label">Recommendations</label><textarea className="input" rows={3} value={form.recommendations} onChange={e => setForm({...form, recommendations: e.target.value})} required /></div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'} Report</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Title</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Hospital</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Period</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map(r => (
                <tr key={r.id} className="hover:bg-rose-50/40 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{r.title}</td>
                  <td className="px-6 py-4 text-sm text-slate-600"><span className="capitalize">{r.report_type?.replace(/_/g, ' ')}</span></td>
                  <td className="px-6 py-4 text-sm text-slate-600">{r.hospital_name || 'Board-wide'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{r.period}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      r.status === 'closed' || r.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' :
                      r.status === 'in_progress' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20' :
                      'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleEdit(r)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 mr-1"><Edit3 size={14} /></button>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reports.length === 0 && <p className="text-center py-8 text-slate-400">No compliance reports found.</p>}
        </div>
      </div>
    </div>
  );
}
