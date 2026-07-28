import { useState, useEffect } from 'react';
import { getPayrollReports, createPayrollReport, updatePayrollReport, deletePayrollReport, getPayrollHistory } from '../lib/finance';
import { getAllHospitals } from '../lib/hospitals';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, Plus, Edit3, Trash2, ChevronDown, ChevronUp, Users } from 'lucide-react';

export default function PayrollMonitoringPage() {
  const { user, hasRole } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ hospital_id: '', period: '', total_employees: 0, gross_pay: 0, deductions: 0, net_pay: 0 });

  const load = async () => {
    setLoading(true);
    const [r, h] = await Promise.all([getPayrollReports(1, 100, search), getAllHospitals()]);
    setReports(r.data);
    setHospitals(h);
    setLoading(false);
  };
// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const payload = { ...form, total_employees: Number(form.total_employees), gross_pay: Number(form.gross_pay), deductions: Number(form.deductions), net_pay: Number(form.net_pay), status: 'active' as const, processed_by: user?.full_name };
    if (editing) {
      await updatePayrollReport(editing.id, payload);
    } else {
      const hospital = hospitals.find(h => h.id === form.hospital_id);
      await createPayrollReport({ ...payload, hospital_name: hospital?.hospital_name || 'Board-wide' });
    }
    setShowForm(false); setEditing(null); setForm({ hospital_id: '', period: '', total_employees: 0, gross_pay: 0, deductions: 0, net_pay: 0 }); load();
  };

  const handleEdit = (r: any) => { setForm(r); setEditing(r); setShowForm(true); };
  const handleDelete = async (id: string) => { if (confirm('Delete this payroll report?')) { await deletePayrollReport(id); load(); } };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    const h = await getPayrollHistory(id);
    setHistory(h);
  };

  const isFinance = hasRole('director_finance');
  const totalNetPay = reports.reduce((s, r) => s + (r.net_pay || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-700 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #1a001a 0%, #3b003b 40%, #6b006b 100%)' }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-violet-400/10 blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-violet-200/80 text-sm mb-2"><Wallet size={14} /><span>Finance</span><span className="text-violet-500/50">/</span><span className="text-white font-medium">Payroll Monitoring</span></div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Payroll Monitoring</h1>
          <p className="mt-1.5 text-violet-100/60 text-sm">Payroll administration oversight, reconciliation, and reporting</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-5 text-center"><p className="text-xs text-slate-500 uppercase">Reports</p><p className="text-3xl font-bold text-slate-800 mt-1">{reports.length}</p></div>
        <div className="card p-5 text-center"><p className="text-xs text-slate-500 uppercase">Gross Pay</p><p className="text-2xl font-bold text-slate-800 mt-1 tabular-nums">₦{(reports.reduce((s, r) => s + (r.gross_pay||0), 0) / 1000000).toFixed(1)}M</p></div>
        <div className="card p-5 text-center"><p className="text-xs text-slate-500 uppercase">Total Deductions</p><p className="text-2xl font-bold text-red-600 mt-1 tabular-nums">₦{(reports.reduce((s, r) => s + (r.deductions||0), 0) / 1000000).toFixed(1)}M</p></div>
        <div className="card p-5 text-center"><p className="text-xs text-slate-500 uppercase">Net Pay</p><p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">₦{(totalNetPay / 1000000).toFixed(1)}M</p></div>
      </div>

      <div className="flex items-center justify-between">
        <input className="input w-64" placeholder="Search by period..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
        {isFinance && <button onClick={() => { setEditing(null); setForm({ hospital_id: '', period: '', total_employees: 0, gross_pay: 0, deductions: 0, net_pay: 0 }); setShowForm(true); }} className="btn-primary"><Plus size={16} /> Add Payroll Report</button>}
      </div>

      {showForm && isFinance && (
        <div className="card p-6 border-t-2 border-t-violet-400">
          <h3 className="font-semibold text-slate-900 mb-4">{editing ? 'Edit Payroll Report' : 'New Payroll Report'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="label">Hospital</label><select className="input" value={form.hospital_id} onChange={e => setForm({...form, hospital_id: e.target.value})} required><option value="">Select hospital</option>{hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}</select></div>
            <div><label className="label">Period (e.g. March 2025)</label><input className="input" value={form.period} onChange={e => setForm({...form, period: e.target.value})} required /></div>
            <div><label className="label">Total Employees</label><input type="number" className="input" value={form.total_employees} onChange={e => setForm({...form, total_employees: +e.target.value})} required /></div>
            <div><label className="label">Gross Pay (₦)</label><input type="number" className="input" value={form.gross_pay} onChange={e => setForm({...form, gross_pay: +e.target.value})} required /></div>
            <div><label className="label">Deductions (₦)</label><input type="number" className="input" value={form.deductions} onChange={e => setForm({...form, deductions: +e.target.value})} required /></div>
            <div><label className="label">Net Pay (₦)</label><input type="number" className="input" value={form.net_pay} onChange={e => setForm({...form, net_pay: +e.target.value})} required /></div>
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
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Period</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Hospital</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Employees</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Gross Pay</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Deductions</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Net Pay</th>
              {isFinance && <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map(r => (
                <>
                  <tr key={r.id} className="hover:bg-violet-50/40 transition-colors cursor-pointer" onClick={() => toggleExpand(r.id)}>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{r.period}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{r.hospital_name || 'Board-wide'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700 text-right tabular-nums">{r.total_employees}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700 text-right tabular-nums">₦{(r.gross_pay || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-red-600 text-right tabular-nums">₦{(r.deductions || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-emerald-700 text-right tabular-nums">₦{(r.net_pay || 0).toLocaleString()}</td>
                    {isFinance && <td className="px-6 py-4 text-center">
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(r); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 mr-1"><Edit3 size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={14} /></button>
                      {expandedId === r.id ? <ChevronUp size={16} className="inline ml-1 text-slate-400" /> : <ChevronDown size={16} className="inline ml-1 text-slate-400" />}
                    </td>}
                  </tr>
                  {expandedId === r.id && (
                    <tr key={`${r.id}-hist`}>
                      <td colSpan={isFinance ? 7 : 6} className="px-6 py-4 bg-slate-50/50">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-slate-700">Payroll History</h4>
                          {history.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No detailed history available.</p> : (
                            <div className="space-y-1">
                              {history.map((h: any) => (
                                <div key={h.id} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-100 text-sm">
                                  <div className="flex items-center gap-3"><Users size={14} className="text-slate-400" /><span className="font-medium text-slate-700">{h.employee_name || h.employee_id}</span><span className="text-xs text-slate-400">{h.staff_id}</span></div>
                                  <div className="flex gap-4 text-right text-xs">
                                    <span>₦{(h.basic_salary || 0).toLocaleString()}</span>
                                    <span className="text-emerald-600">+₦{(h.allowances || 0).toLocaleString()}</span>
                                    <span className="text-red-600">-₦{(h.deductions || 0).toLocaleString()}</span>
                                    <span className="font-bold text-slate-800">₦{(h.net_pay || 0).toLocaleString()}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {reports.length === 0 && <p className="text-center py-8 text-slate-400">No payroll reports found.</p>}
        </div>
      </div>
    </div>
  );
}
