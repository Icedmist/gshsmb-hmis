import { useState, useEffect } from 'react';
import { getExpenditureRecords, createExpenditureRecord, updateExpenditureRecord, deleteExpenditureRecord } from '../lib/finance';
import { getAllHospitals } from '../lib/hospitals';
import { TrendingDown, Plus, Edit3, Trash2 } from 'lucide-react';

export default function ExpenditureManagementPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ hospital_id: '', department_id: '', category: '', amount: 0, expenditure_date: '', description: '', payment_reference: '', payee: '' });

  const load = async () => {
    setLoading(true);
    const [r, h] = await Promise.all([getExpenditureRecords(1, 100, search), getAllHospitals()]);
    setRecords(r.data);
    setHospitals(h);
    setLoading(false);
  };
  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const payload = { ...form, amount: Number(form.amount), status: 'active' as const };
    if (editing) {
      await updateExpenditureRecord(editing.id, payload);
    } else {
      const hospital = hospitals.find(h => h.id === form.hospital_id);
      await createExpenditureRecord({ ...payload, hospital_name: hospital?.hospital_name || 'Board-wide' });
    }
    setShowForm(false); setEditing(null); setForm({ hospital_id: '', department_id: '', category: '', amount: 0, expenditure_date: '', description: '', payment_reference: '', payee: '' }); load();
  };

  const handleEdit = (r: any) => { setForm(r); setEditing(r); setShowForm(true); };
  const handleDelete = async (id: string) => { if (confirm('Delete this record?')) { await deleteExpenditureRecord(id); load(); } };

  const total = records.reduce((s, r) => s + (r.amount || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-700 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #1a0a00 0%, #3b1a00 40%, #6b2a00 100%)' }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-orange-400/10 blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-orange-200/80 text-sm mb-2"><TrendingDown size={14} /><span>Finance</span><span className="text-orange-500/50">/</span><span className="text-white font-medium">Expenditure Management</span></div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Expenditure Management</h1>
          <p className="mt-1.5 text-orange-100/60 text-sm">Expenditure tracking, budget utilization, and spending oversight</p>
        </div>
      </div>

      <div className="card p-5 text-center"><p className="text-xs text-slate-500 uppercase tracking-wide">Total Expenditure</p><p className="text-3xl font-bold text-orange-700 mt-1 tabular-nums">₦{total.toLocaleString()}</p><p className="text-xs text-slate-400 mt-1">{records.length} records</p></div>

      <div className="flex items-center justify-between">
        <input className="input w-64" placeholder="Search by category or payee..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
        <button onClick={() => { setEditing(null); setForm({ hospital_id: '', department_id: '', category: '', amount: 0, expenditure_date: '', description: '', payment_reference: '', payee: '' }); setShowForm(true); }} className="btn-primary"><Plus size={16} /> Record Expenditure</button>
      </div>

      {showForm && (
        <div className="card p-6 border-t-2 border-t-orange-400">
          <h3 className="font-semibold text-slate-900 mb-4">{editing ? 'Edit Expenditure' : 'New Expenditure'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="label">Hospital</label><select className="input" value={form.hospital_id} onChange={e => setForm({...form, hospital_id: e.target.value})} required><option value="">Select hospital</option>{hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}</select></div>
            <div><label className="label">Category</label><input className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g. Salaries, Supplies" required /></div>
            <div><label className="label">Amount (₦)</label><input type="number" className="input" value={form.amount} onChange={e => setForm({...form, amount: +e.target.value})} required /></div>
            <div><label className="label">Date</label><input type="date" className="input" value={form.expenditure_date} onChange={e => setForm({...form, expenditure_date: e.target.value})} required /></div>
            <div><label className="label">Payee</label><input className="input" value={form.payee} onChange={e => setForm({...form, payee: e.target.value})} required /></div>
            <div><label className="label">Payment Reference</label><input className="input" value={form.payment_reference} onChange={e => setForm({...form, payment_reference: e.target.value})} required /></div>
            <div><label className="label">Description</label><input className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary">{editing ? 'Update' : 'Record'} Expenditure</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Hospital</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Amount (₦)</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Payee</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-orange-50/40 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600">{r.expenditure_date}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{r.hospital_name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{r.category}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-orange-700 text-right tabular-nums">₦{(r.amount || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{r.payee}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleEdit(r)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 mr-1"><Edit3 size={14} /></button>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {records.length === 0 && <p className="text-center py-8 text-slate-400">No expenditure records found.</p>}
        </div>
      </div>
    </div>
  );
}
