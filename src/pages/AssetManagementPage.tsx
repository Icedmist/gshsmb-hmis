import { useState, useEffect } from 'react';
import { getAssets, createAsset, updateAsset, deleteAsset, getAssetCategories, createAssetCategory, getAssetAssignments, getAssetMaintenance } from '../lib/finance';
import { getAllHospitals } from '../lib/hospitals';
import { Briefcase, Plus, Edit3, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export default function AssetManagementPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', description: '', depreciation_rate: 0 });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ asset_name: '', category_id: '', hospital_id: '', department_id: '', description: '', serial_number: '', purchase_date: '', purchase_cost: 0, current_value: 0, location: '', assigned_to: '', status: 'operational' as const });

  const load = async () => {
    setLoading(true);
    const [a, c, h] = await Promise.all([getAssets(1, 100, search), getAssetCategories(), getAllHospitals()]);
    setAssets(a.data);
    setCategories(c);
    setHospitals(h);
    setLoading(false);
  };
  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const cat = categories.find(c => c.id === form.category_id);
    const hospital = hospitals.find(h => h.id === form.hospital_id);
    const payload = { ...form, purchase_cost: Number(form.purchase_cost), current_value: Number(form.current_value), category_name: cat?.name || '', hospital_name: hospital?.hospital_name || 'Board-wide' };
    if (editing) { await updateAsset(editing.id, payload); }
    else { await createAsset(payload); }
    setShowForm(false); setEditing(null);
    setForm({ asset_name: '', category_id: '', hospital_id: '', department_id: '', description: '', serial_number: '', purchase_date: '', purchase_cost: 0, current_value: 0, location: '', assigned_to: '', status: 'operational' });
    load();
  };

  const handleEdit = (a: any) => { setForm(a); setEditing(a); setShowForm(true); };
  const handleDelete = async (id: string) => { if (confirm('Delete this asset?')) { await deleteAsset(id); load(); } };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    const [asgn] = await Promise.all([getAssetAssignments(id), getAssetMaintenance(1, 10)]);
    setAssignments(asgn);
  };

  const handleCatSubmit = async (e: any) => {
    e.preventDefault();
    await createAssetCategory({ ...catForm, depreciation_rate: Number(catForm.depreciation_rate), status: 'active' as const });
    setShowCatForm(false); setCatForm({ name: '', description: '', depreciation_rate: 0 }); load();
  };

  const totalValue = assets.reduce((s, a) => s + (a.current_value || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-700 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #001a0a 0%, #002b1a 40%, #00552e 100%)' }}>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-emerald-200/80 text-sm mb-2"><Briefcase size={14} /><span>Finance</span><span className="text-emerald-500/50">/</span><span className="text-white font-medium">Asset Management</span></div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Asset Management</h1>
          <p className="mt-1.5 text-emerald-100/60 text-sm">Asset registry, categorization, assignment, and maintenance tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 text-center"><p className="text-xs text-slate-500 uppercase">Total Assets</p><p className="text-3xl font-bold text-slate-800 mt-1">{assets.length}</p></div>
        <div className="card p-5 text-center"><p className="text-xs text-slate-500 uppercase">Total Value</p><p className="text-3xl font-bold text-emerald-700 mt-1 tabular-nums">₦{totalValue.toLocaleString()}</p></div>
        <div className="card p-5 text-center"><p className="text-xs text-slate-500 uppercase">Categories</p><p className="text-3xl font-bold text-slate-800 mt-1">{categories.length}</p></div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <input className="input w-64" placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCatForm(true)} className="btn-secondary"><Plus size={16} /> Category</button>
          <button onClick={() => { setEditing(null); setForm({ asset_name: '', category_id: '', hospital_id: '', department_id: '', description: '', serial_number: '', purchase_date: '', purchase_cost: 0, current_value: 0, location: '', assigned_to: '', status: 'operational' }); setShowForm(true); }} className="btn-primary"><Plus size={16} /> Register Asset</button>
        </div>
      </div>

      {showCatForm && (
        <div className="card p-6 border-t-2 border-t-emerald-400">
          <h3 className="font-semibold text-slate-900 mb-4">New Asset Category</h3>
          <form onSubmit={handleCatSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="label">Name</label><input className="input" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} required /></div>
            <div><label className="label">Description</label><input className="input" value={catForm.description} onChange={e => setCatForm({...catForm, description: e.target.value})} /></div>
            <div><label className="label">Depreciation Rate (%)</label><input type="number" className="input" value={catForm.depreciation_rate} onChange={e => setCatForm({...catForm, depreciation_rate: +e.target.value})} /></div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary">Create Category</button>
              <button type="button" onClick={() => setShowCatForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {showForm && (
        <div className="card p-6 border-t-2 border-t-emerald-400">
          <h3 className="font-semibold text-slate-900 mb-4">{editing ? 'Edit Asset' : 'Register New Asset'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="label">Asset Name</label><input className="input" value={form.asset_name} onChange={e => setForm({...form, asset_name: e.target.value})} required /></div>
            <div><label className="label">Category</label><select className="input" value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} required><option value="">Select</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="label">Hospital</label><select className="input" value={form.hospital_id} onChange={e => setForm({...form, hospital_id: e.target.value})} required><option value="">Select</option>{hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}</select></div>
            <div><label className="label">Serial Number</label><input className="input" value={form.serial_number} onChange={e => setForm({...form, serial_number: e.target.value})} required /></div>
            <div><label className="label">Purchase Date</label><input type="date" className="input" value={form.purchase_date} onChange={e => setForm({...form, purchase_date: e.target.value})} /></div>
            <div><label className="label">Purchase Cost (₦)</label><input type="number" className="input" value={form.purchase_cost} onChange={e => setForm({...form, purchase_cost: +e.target.value})} /></div>
            <div><label className="label">Current Value (₦)</label><input type="number" className="input" value={form.current_value} onChange={e => setForm({...form, current_value: +e.target.value})} /></div>
            <div><label className="label">Location</label><input className="input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
            <div><label className="label">Status</label><select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value as any})}><option value="operational">Operational</option><option value="under_maintenance">Under Maintenance</option><option value="faulty">Faulty</option><option value="decommissioned">Decommissioned</option></select></div>
            <div><label className="label">Description</label><input className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary">{editing ? 'Update' : 'Register'} Asset</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Asset Name</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Hospital</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Value (₦)</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {assets.map(a => (
                <>
                  <tr key={a.id} className="hover:bg-emerald-50/40 transition-colors cursor-pointer" onClick={() => toggleExpand(a.id)}>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{a.asset_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{a.category_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{a.hospital_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700 text-right tabular-nums">₦{(a.current_value || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-center"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      a.status === 'operational' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' :
                      a.status === 'under_maintenance' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20' :
                      a.status === 'faulty' ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20' :
                      'bg-slate-50 text-slate-500 ring-1 ring-slate-400/20'
                    }`}>{a.status}</span></td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(a); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 mr-1"><Edit3 size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={14} /></button>
                      {expandedId === a.id ? <ChevronUp size={16} className="inline ml-1 text-slate-400" /> : <ChevronDown size={16} className="inline ml-1 text-slate-400" />}
                    </td>
                  </tr>
                  {expandedId === a.id && (
                    <tr key={`${a.id}-detail`}>
                      <td colSpan={6} className="px-6 py-4 bg-slate-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Asset Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between p-2 bg-white rounded-lg border"><span className="text-slate-500">Serial No</span><span className="font-medium">{a.serial_number}</span></div>
                              <div className="flex justify-between p-2 bg-white rounded-lg border"><span className="text-slate-500">Location</span><span className="font-medium">{a.location || 'N/A'}</span></div>
                              <div className="flex justify-between p-2 bg-white rounded-lg border"><span className="text-slate-500">Purchase Cost</span><span className="font-medium tabular-nums">₦{(a.purchase_cost || 0).toLocaleString()}</span></div>
                              <div className="flex justify-between p-2 bg-white rounded-lg border"><span className="text-slate-500">Purchase Date</span><span className="font-medium">{a.purchase_date || 'N/A'}</span></div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Assignments</h4>
                            {assignments.length === 0 ? <p className="text-xs text-slate-400 py-4">No assignments.</p> : (
                              <div className="space-y-1">{assignments.map((as: any) => <div key={as.id} className="p-2 bg-white rounded-lg border text-sm flex justify-between"><span>{as.assigned_to_name || as.assigned_to}</span><span className="text-slate-400 text-xs">{as.assignment_date}</span></div>)}</div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {assets.length === 0 && <p className="text-center py-8 text-slate-400">No assets registered.</p>}
        </div>
      </div>
    </div>
  );
}
