import { useState, useEffect } from 'react';
import { getTreasuryRecords, createTreasuryRecord, updateTreasuryRecord, deleteTreasuryRecord } from '../lib/finance';
import { getAllHospitals } from '../lib/hospitals';
import { Landmark, Plus, Edit3, Trash2 } from 'lucide-react';

export default function TreasuryManagementPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ hospital_id: '', transaction_type: 'inflow' as const, amount: 0, source: '', description: '', transaction_date: '', reference_number: '', balance_after: 0 });

  const load = async () => {
    setLoading(true);
    const [r, h] = await Promise.all([getTreasuryRecords(1, 100, search), getAllHospitals()]);
    setRecords(r.data);
    setHospitals(h);
    setLoading(false);
  };
// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const payload = { ...form, amount: Number(form.amount), balance_after: Number(form.balance_after), status: 'active' as const };
    if (editing) {
      await updateTreasuryRecord(editing.id, payload);
    } else {
      const hospital = hospitals.find(h => h.id === form.hospital_id);
      await createTreasuryRecord({ ...payload, hospital_name: hospital?.hospital_name || 'Board-wide' });
    }
    setShowForm(false); setEditing(null);
    setForm({ hospital_id: '', transaction_type: 'inflow', amount: 0, source: '', description: '', transaction_date: '', reference_number: '', balance_after: 0 });
    load();
  };

  const handleEdit = (r: any) => { setForm(r); setEditing(r); setShowForm(true); };
  const handleDelete = async (id: string) => { if (confirm('Delete this record?')) { await deleteTreasuryRecord(id); load(); } };

  const inflows = records.filter(r => r.transaction_type === 'inflow').reduce((s, r) => s + (r.amount || 0), 0);
  const outflows = records.filter(r => r.transaction_type === 'outflow').reduce((s, r) => s + (r.amount || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-700 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3b 40%, #2a2a6b 100%)' }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-indigo-400/10 blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-indigo-200/80 text-sm mb-2"><Landmark size={14} /><span>Finance</span><span className="text-indigo-500/50">/</span><span className="text-white font-medium">Treasury Management</span></div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Treasury Management</h1>
          <p className="mt-1.5 text-indigo-100/60 text-sm">Treasury monitoring, fund releases, and cash flow management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 text-center border-t-2 border-t-teal-400"><p className="text-xs text-slate-500 uppercase">Total Inflows</p><p className="text-2xl font-bold text-teal-700 mt-1 tabular-nums">₦{inflows.toLocaleString()}</p></div>
        <div className="card p-5 text-center border-t-2 border-t-red-400"><p className="text-xs text-slate-500 uppercase">Total Outflows</p><p className="text-2xl font-bold text-red-600 mt-1 tabular-nums">₦{outflows.toLocaleString()}</p></div>
        <div className="card p-5 text-center border-t-2 border-t-emerald-400"><p className="text-xs text-slate-500 uppercase">Net Position</p><p className={`text-2xl font-bold mt-1 tabular-nums ${(inflows - outflows) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>₦{(inflows - outflows).toLocaleString()}</p></div>
      </div>

      <div className="flex items-center justify-between">
        <input className="input w-64" placeholder="Search by source or reference..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
        <button onClick={() => { setEditing(null); setForm({ hospital_id: '', transaction_type: 'inflow', amount: 0, source: '', description: '', transaction_date: '', reference_number: '', balance_after: 0 }); setShowForm(true); }} className="btn-primary"><Plus size={16} /> Add Transaction</button>
      </div>

      {showForm && (
        <div className="card p-6 border-t-2 border-t-indigo-400">
          <h3 className="font-semibold text-slate-900 mb-4">{editing ? 'Edit Transaction' : 'New Treasury Transaction'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="label">Hospital</label><select className="input" value={form.hospital_id} onChange={e => setForm({...form, hospital_id: e.target.value})}><option value="">Board-wide</option>{hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}</select></div>
            <div><label className="label">Type</label><select className="input" value={form.transaction_type} onChange={e => setForm({...form, transaction_type: e.target.value as any})}><option value="inflow">Inflow</option><option value="outflow">Outflow</option><option value="transfer">Transfer</option></select></div>
            <div><label className="label">Amount (₦)</label><input type="number" className="input" value={form.amount} onChange={e => setForm({...form, amount: +e.target.value})} required /></div>
            <div><label className="label">Source</label><input className="input" value={form.source} onChange={e => setForm({...form, source: e.target.value})} required /></div>
            <div><label className="label">Date</label><input type="date" className="input" value={form.transaction_date} onChange={e => setForm({...form, transaction_date: e.target.value})} required /></div>
            <div><label className="label">Reference</label><input className="input" value={form.reference_number} onChange={e => setForm({...form, reference_number: e.target.value})} required /></div>
            <div><label className="label">Balance After (₦)</label><input type="number" className="input" value={form.balance_after} onChange={e => setForm({...form, balance_after: +e.target.value})} /></div>
            <div><label className="label">Description</label><input className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary">{editing ? 'Update' : 'Add'} Transaction</button>
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
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Source</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Amount (₦)</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Balance</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-indigo-50/40 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600">{r.transaction_date}</td>
                  <td className="px-6 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${r.transaction_type === 'inflow' ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/20' : r.transaction_type === 'outflow' ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20' : 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20'}`}>{r.transaction_type}</span></td>
                  <td className="px-6 py-4 text-sm text-slate-600">{r.source}</td>
                  <td className={`px-6 py-4 text-sm font-semibold text-right tabular-nums ${r.transaction_type === 'inflow' ? 'text-teal-700' : 'text-red-600'}`}>₦{(r.amount || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700 text-right tabular-nums">₦{(r.balance_after || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleEdit(r)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 mr-1"><Edit3 size={14} /></button>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {records.length === 0 && <p className="text-center py-8 text-slate-400">No treasury records found.</p>}
        </div>
      </div>
    </div>
  );
}
