import { useState, useEffect } from 'react';
import { getRevenueRecords, createRevenueRecord, updateRevenueRecord, deleteRevenueRecord } from '../lib/finance';
import { getAllHospitals } from '../lib/hospitals';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, Plus, Edit3, Trash2 } from 'lucide-react';

export default function RevenueManagementPage() {
  const { hasRole } = useAuth();
  const isFinance = hasRole('director_finance');
  const [records, setRecords] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ hospital_id: '', source: '', amount: 0, revenue_date: '', description: '', reference_number: '' });

  const load = async () => {
    setLoading(true);
    const [r, h] = await Promise.all([getRevenueRecords(1, 100, search), getAllHospitals()]);
    setRecords(r.data);
    setHospitals(h);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const payload = { ...form, amount: Number(form.amount), status: 'active' as const };
    if (editing) {
      await updateRevenueRecord(editing.id, payload);
    } else {
      const hospital = hospitals.find(h => h.id === form.hospital_id);
      await createRevenueRecord({ ...payload, hospital_name: hospital?.hospital_name || 'Board-wide' });
    }
    setShowForm(false); setEditing(null); setForm({ hospital_id: '', source: '', amount: 0, revenue_date: '', description: '', reference_number: '' }); load();
  };

  const handleEdit = (r: any) => { setForm(r); setEditing(r); setShowForm(true); };
  const handleDelete = async (id: string) => { if (confirm('Delete this record?')) { await deleteRevenueRecord(id); load(); } };

  const totalRevenue = records.reduce((s, r) => s + (r.amount || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-700 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #022c22 0%, #0d7667 40%, #0d9488 100%)' }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-teal-400/10 blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-teal-200/80 text-sm mb-2"><TrendingUp size={14} /><span>Finance</span><span className="text-teal-500/50">/</span><span className="text-white font-medium">Revenue Management</span></div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Revenue Management</h1>
          <p className="mt-1.5 text-teal-100/60 text-sm">Internally generated revenue and funding monitoring</p>
        </div>
      </div>

      <div className="card p-5 text-center"><p className="text-xs text-slate-500 uppercase tracking-wide">Total Revenue Recorded</p><p className="text-3xl font-bold text-teal-700 mt-1 tabular-nums">₦{totalRevenue.toLocaleString()}</p><p className="text-xs text-slate-400 mt-1">{records.length} records</p></div>

      <div className="flex items-center justify-between">
        <input className="input w-64" placeholder="Search by source or reference..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
        {isFinance && <button onClick={() => { setEditing(null); setForm({ hospital_id: '', source: '', amount: 0, revenue_date: '', description: '', reference_number: '' }); setShowForm(true); }} className="btn-primary"><Plus size={16} /> Record Revenue</button>}
      </div>

      {isFinance && showForm && (
        <div className="card p-6 border-t-2 border-t-teal-400">
          <h3 className="font-semibold text-slate-900 mb-4">{editing ? 'Edit Revenue Record' : 'New Revenue Record'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="label">Hospital</label><select className="input" value={form.hospital_id} onChange={e => setForm({...form, hospital_id: e.target.value})} required><option value="">Select hospital</option>{hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}</select></div>
            <div><label className="label">Revenue Source</label><input className="input" value={form.source} onChange={e => setForm({...form, source: e.target.value})} placeholder="e.g. IGR, Grant" required /></div>
            <div><label className="label">Amount (₦)</label><input type="number" className="input" value={form.amount} onChange={e => setForm({...form, amount: +e.target.value})} required /></div>
            <div><label className="label">Date</label><input type="date" className="input" value={form.revenue_date} onChange={e => setForm({...form, revenue_date: e.target.value})} required /></div>
            <div><label className="label">Reference Number</label><input className="input" value={form.reference_number} onChange={e => setForm({...form, reference_number: e.target.value})} required /></div>
            <div><label className="label">Description</label><input className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary">{editing ? 'Update' : 'Record'} Revenue</button>
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
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Source</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Amount (₦)</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Reference</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-teal-50/40 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600">{r.revenue_date}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{r.hospital_name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{r.source}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-teal-700 text-right tabular-nums">₦{(r.amount || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-500">{r.reference_number}</td>
                    <td className="px-6 py-4 text-center">
                      {isFinance && <><button onClick={() => handleEdit(r)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 mr-1"><Edit3 size={14} /></button>
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={14} /></button></>}
                      {!isFinance && <span className="text-[10px] text-slate-400 italic">View only</span>}
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
          {records.length === 0 && <p className="text-center py-8 text-slate-400">No revenue records found.</p>}
        </div>
      </div>
    </div>
  );
}
