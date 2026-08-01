import { useState, useEffect } from 'react';
import Modal from '../components/common/Modal';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, TrendingUp, BarChart3, Activity } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getPerformanceIndicators, createPerformanceIndicator, getAllKPIs } from '../lib/kpis';

export default function PerformanceIndicatorsPage() {
  const { hasRole } = useAuth();
  const [indicators, setIndicators] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ kpi_id: '', indicator_name: '', value: 0, unit: '', reporting_period: '' });
  const [kpis, setKpis] = useState<any[]>([]);
  const isAdmin = hasRole('super_admin') || hasRole('director_prs') || hasRole('hospital_admin');

  const loadIndicators = async () => {
    setLoading(true);
    try {
      const data = await getPerformanceIndicators();
      setIndicators(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadIndicators(); }, []);

  const loadDropdowns = async () => {
    const kpiData = await getAllKPIs();
    setKpis(kpiData || []);
  };

  const openCreate = () => {
    setForm({ kpi_id: '', indicator_name: '', value: 0, unit: '', reporting_period: '' });
    loadDropdowns();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPerformanceIndicator({ ...form, value: Number(form.value) });
      setShowModal(false);
      loadIndicators();
    } catch (err: any) { alert(err.message); }
  };

  const filtered = indicators.filter(i =>
    !search || i.indicator_name?.toLowerCase().includes(search.toLowerCase()) || i.kpi_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <BarChart3 size={14} className="text-[#008751]" />
            <span>PRS</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Performance Indicators</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Performance Indicators</h1>
          <p className="text-slate-500 mt-1 text-sm">Track performance indicator data submitted across KPIs</p>
        </div>
        {isAdmin && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Indicator</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Indicators" value={indicators.length} icon={TrendingUp} color="primary" subtitle="All records" />
        <StatCard title="Linked KPIs" value={new Set(indicators.map(i => i.kpi_id).filter(Boolean)).size} icon={BarChart3} color="blue" subtitle="Unique KPIs" />
        <StatCard title="Reporting Periods" value={new Set(indicators.map(i => i.reporting_period).filter(Boolean)).size} icon={Activity} color="teal" subtitle="Distinct periods" />
        <StatCard title="Latest Period" value={indicators.length > 0 ? indicators.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))[0]?.reporting_period || 'N/A' : 'N/A'} icon={Activity} color="army" subtitle="Most recent" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={e => { e.preventDefault(); }} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search indicators by name or KPI..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </form>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No performance indicators found.</p>
              {isAdmin && <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Add Indicator</button>}
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Indicator Name</th>
                  <th>Linked KPI</th>
                  <th>Value</th>
                  <th>Unit</th>
                  <th>Period</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(i => (
                  <tr key={i.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
                          <TrendingUp size={18} className="text-amber-600" />
                        </div>
                        <span className="font-medium text-slate-900">{i.indicator_name}</span>
                      </div>
                    </td>
                    <td><span className="text-sm text-slate-600">{i.kpi_name}</span></td>
                    <td className="font-mono font-medium">{i.value}</td>
                    <td>{i.unit}</td>
                    <td className="text-sm text-slate-500">{i.reporting_period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Performance Indicator" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Linked KPI</label>
              <select className="input" value={form.kpi_id} onChange={e => setForm({ ...form, kpi_id: e.target.value })} required>
                <option value="">Select KPI...</option>
                {kpis.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Indicator Name</label>
              <input className="input" value={form.indicator_name} onChange={e => setForm({ ...form, indicator_name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Value</label>
              <input type="number" className="input" value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })} required />
            </div>
            <div>
              <label className="label">Unit</label>
              <input className="input" placeholder="e.g. %, count" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} required />
            </div>
            <div>
              <label className="label">Reporting Period</label>
              <input className="input" placeholder="e.g. Q1 2025" value={form.reporting_period} onChange={e => setForm({ ...form, reporting_period: e.target.value })} required />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add Indicator</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
