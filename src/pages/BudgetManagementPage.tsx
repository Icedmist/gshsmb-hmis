import { useState, useEffect } from 'react';
import { getBudgets, createBudget, updateBudget, deleteBudget, getBudgetItems, createBudgetItem } from '../lib/finance';
import { getAllHospitals } from '../lib/hospitals';
import { useAuth } from '../contexts/AuthContext';
import { PiggyBank, Plus, Edit3, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export default function BudgetManagementPage() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({ budget_year: new Date().getFullYear(), hospital_id: '', department_id: '', category: '', approved_amount: 0, actual_amount: 0, notes: '' });
  const [itemForm, setItemForm] = useState({ budget_id: '', description: '', line_item: '', approved_amount: 0, actual_amount: 0 });

  const load = async () => {
    setLoading(true);
    const [b, h] = await Promise.all([getBudgets(1, 100, search), getAllHospitals()]);
    setBudgets(b.data);
    setHospitals(h);
    setLoading(false);
  };

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        budget_year: Number(form.budget_year),
        approved_amount: Number(form.approved_amount),
        actual_amount: Number(form.actual_amount),
        variance: Number(form.approved_amount) - Number(form.actual_amount),
        status: 'active' as const,
        created_by: user?.full_name,
      };
      if (editing) {
        await updateBudget(editing.id, payload);
      } else {
        const hospital = hospitals.find(h => h.id === form.hospital_id);
        await createBudget({ ...payload, hospital_name: hospital?.hospital_name || 'Board-wide' });
      }
      setShowForm(false); setEditing(null); resetForm(); load();
    } catch (err: any) {
      alert('Failed to save budget: ' + (err?.message || 'Unknown error. Check console for details.'));
    }
  };

  const resetForm = () => setForm({ budget_year: new Date().getFullYear(), hospital_id: '', department_id: '', category: '', approved_amount: 0, actual_amount: 0, notes: '' });

  const handleEdit = (b: any) => { setForm(b); setEditing(b); setShowForm(true); };

  const handleDelete = async (id: string) => { if (confirm('Delete this budget?')) { await deleteBudget(id); load(); } };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    const i = await getBudgetItems(id);
    setItems(i);
    setItemForm(prev => ({ ...prev, budget_id: id }));
  };

  const handleItemSubmit = async (e: any) => {
    e.preventDefault();
    const payload = {
      ...itemForm,
      approved_amount: Number(itemForm.approved_amount),
      actual_amount: Number(itemForm.actual_amount),
      variance: Number(itemForm.approved_amount) - Number(itemForm.actual_amount),
      status: 'active' as const,
    };
    await createBudgetItem(payload);
    setShowItemForm(false); toggleExpand(itemForm.budget_id);
  };

  const totalApproved = budgets.reduce((s, b) => s + (b.approved_amount || 0), 0);
  const totalActual = budgets.reduce((s, b) => s + (b.actual_amount || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-700 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #022c22 0%, #064e3b 40%, #065f46 100%)' }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-emerald-400/10 blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-emerald-200/80 text-sm mb-2">
            <PiggyBank size={14} /><span>Finance</span><span className="text-emerald-500/50">/</span><span className="text-white font-medium">Budget Management</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Budget Management</h1>
          <p className="mt-1.5 text-emerald-100/60 text-sm">Annual budget preparation, monitoring, and variance analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 text-center"><p className="text-xs text-slate-500 uppercase tracking-wide">Total Approved</p><p className="text-3xl font-bold text-emerald-700 mt-1 tabular-nums">₦{(totalApproved / 1000000).toFixed(1)}M</p></div>
        <div className="card p-5 text-center"><p className="text-xs text-slate-500 uppercase tracking-wide">Total Actual</p><p className="text-3xl font-bold text-blue-700 mt-1 tabular-nums">₦{(totalActual / 1000000).toFixed(1)}M</p></div>
        <div className="card p-5 text-center"><p className="text-xs text-slate-500 uppercase tracking-wide">Variance</p><p className={`text-3xl font-bold mt-1 tabular-nums ${totalApproved >= totalActual ? 'text-emerald-700' : 'text-red-600'}`}>₦{((totalApproved - totalActual) / 1000000).toFixed(1)}M</p></div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input className="input w-64" placeholder="Search budgets..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
        </div>
        <button onClick={() => { setEditing(null); resetForm(); setShowForm(true); }} className="btn-primary"><Plus size={16} /> Create Budget</button>
      </div>

      {showForm && (
        <div className="card p-6 border-t-2 border-t-emerald-400">
          <h3 className="font-semibold text-slate-900 mb-4">{editing ? 'Edit Budget' : 'New Budget'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="label">Budget Year</label><input type="number" className="input" value={form.budget_year} onChange={e => setForm({...form, budget_year: +e.target.value})} required /></div>
            <div><label className="label">Hospital</label><select className="input" value={form.hospital_id} onChange={e => setForm({...form, hospital_id: e.target.value})}><option value="">Board-wide</option>{hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}</select></div>
            <div><label className="label">Category</label><input className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g. Personnel, Capital" required /></div>
            <div><label className="label">Approved Amount (₦)</label><input type="number" className="input" value={form.approved_amount} onChange={e => setForm({...form, approved_amount: +e.target.value})} required /></div>
            <div><label className="label">Actual Amount (₦)</label><input type="number" className="input" value={form.actual_amount} onChange={e => setForm({...form, actual_amount: +e.target.value})} required /></div>
            <div><label className="label">Notes</label><input className="input" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'} Budget</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Year</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Hospital</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Approved (₦)</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actual (₦)</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Variance (₦)</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {budgets.map(b => (
                <>
                  <tr key={b.id} className="hover:bg-emerald-50/40 transition-colors cursor-pointer" onClick={() => toggleExpand(b.id)}>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{b.budget_year}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{b.hospital_name || 'Board-wide'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{b.category}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700 text-right tabular-nums">{(b.approved_amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700 text-right tabular-nums">{(b.actual_amount || 0).toLocaleString()}</td>
                    <td className={`px-6 py-4 text-sm font-semibold text-right tabular-nums ${(b.variance || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {(b.variance || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(b); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 mr-1"><Edit3 size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={14} /></button>
                      {expandedId === b.id ? <ChevronUp size={16} className="inline ml-1 text-slate-400" /> : <ChevronDown size={16} className="inline ml-1 text-slate-400" />}
                    </td>
                  </tr>
                  {expandedId === b.id && (
                    <tr key={`${b.id}-items`}>
                      <td colSpan={7} className="px-6 py-4 bg-slate-50/50">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-700">Budget Items</h4>
                            <button onClick={() => { setItemForm({ budget_id: b.id, description: '', line_item: '', approved_amount: 0, actual_amount: 0 }); setShowItemForm(true); }} className="btn-sm btn-primary"><Plus size={12} /> Add Item</button>
                          </div>
                          {showItemForm && itemForm.budget_id === b.id && (
                            <form onSubmit={handleItemSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-white rounded-xl border">
                              <div><label className="label">Line Item</label><input className="input" value={itemForm.line_item} onChange={e => setItemForm({...itemForm, line_item: e.target.value})} required /></div>
                              <div><label className="label">Description</label><input className="input" value={itemForm.description} onChange={e => setItemForm({...itemForm, description: e.target.value})} /></div>
                              <div><label className="label">Approved (₦)</label><input type="number" className="input" value={itemForm.approved_amount} onChange={e => setItemForm({...itemForm, approved_amount: +e.target.value})} required /></div>
                              <div><label className="label">Actual (₦)</label><input type="number" className="input" value={itemForm.actual_amount} onChange={e => setItemForm({...itemForm, actual_amount: +e.target.value})} required /></div>
                              <div className="flex items-end gap-2">
                                <button type="submit" className="btn-primary btn-sm">Add</button>
                                <button type="button" onClick={() => setShowItemForm(false)} className="btn-secondary btn-sm">Cancel</button>
                              </div>
                            </form>
                          )}
                          <div className="space-y-1">
                            {items.filter(i => i.budget_id === b.id).map(i => (
                              <div key={i.id} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-100 text-sm">
                                <div className="flex-1"><span className="font-medium text-slate-700">{i.line_item}</span><span className="text-slate-400 ml-2">{i.description}</span></div>
                                <div className="flex gap-4 text-right">
                                  <span className="font-semibold text-slate-700 tabular-nums">₦{(i.approved_amount || 0).toLocaleString()}</span>
                                  <span className="font-semibold text-slate-500 tabular-nums">₦{(i.actual_amount || 0).toLocaleString()}</span>
                                </div>
                              </div>
                            ))}
                            {items.filter(i => i.budget_id === b.id).length === 0 && <p className="text-xs text-slate-400 text-center py-4">No items yet.</p>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {budgets.length === 0 && <p className="text-center py-8 text-slate-400">No budgets found.</p>}
        </div>
      </div>
    </div>
  );
}
