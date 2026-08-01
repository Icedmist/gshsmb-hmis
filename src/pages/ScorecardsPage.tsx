import { useState, useEffect } from 'react';
import { Pagination as PaginationType } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Pencil, Trash2, Award, Building2, Users, Percent, X, Check } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getHospitalScorecards, createHospitalScorecard, updateHospitalScorecard, deleteHospitalScorecard, getDepartmentScorecards, createDepartmentScorecard, updateDepartmentScorecard, deleteDepartmentScorecard } from '../lib/scorecards';
import { getAllHospitals } from '../lib/hospitals';
import { getAllDepartments } from '../lib/departments';

export default function ScorecardsPage() {
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'hospital' | 'department'>('hospital');
  const isAdmin = hasRole('super_admin') || hasRole('director_prs') || hasRole('hospital_admin');

  const [hospitalScorecards, setHospitalScorecards] = useState<any[]>([]);
  const [deptScorecards, setDeptScorecards] = useState<any[]>([]);
  const [hPagination, setHPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [dPagination, setDPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editType, setEditType] = useState<'hospital' | 'department'>('hospital');
  const [form, setForm] = useState<any>({ hospital_id: '', department_id: '', period: '', type: 'monthly', total_score: 0, max_score: 100, metrics: {} as Record<string, number> });
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [metricKey, setMetricKey] = useState('');
  const [metricValue, setMetricValue] = useState('');

  const tabs = [
    { key: 'hospital' as const, label: 'Hospital Scorecards', icon: Building2 },
    { key: 'department' as const, label: 'Department Scorecards', icon: Users },
  ];

  const loadHospitalScorecards = async (page = 1) => {
    try {
      const { data, total } = await getHospitalScorecards(page, 50);
      setHospitalScorecards(data);
      setHPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } catch {}
  };

  const loadDepartmentScorecards = async (page = 1) => {
    try {
      const { data, total } = await getDepartmentScorecards(page, 50);
      setDeptScorecards(data);
      setDPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } catch {}
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadHospitalScorecards(), loadDepartmentScorecards()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const loadDropdowns = async () => {
    const [hData, dData] = await Promise.all([getAllHospitals(), getAllDepartments()]);
    setHospitals(hData || []);
    setDepartments(dData || []);
  };

  const openCreate = (type: 'hospital' | 'department') => {
    setEditType(type);
    setEditItem(null);
    setForm({ hospital_id: '', department_id: '', period: '', type: 'monthly', total_score: 0, max_score: 100, metrics: {} as Record<string, number> });
    setMetricKey('');
    setMetricValue('');
    loadDropdowns();
    setShowModal(true);
  };

  const openEdit = (item: any, type: 'hospital' | 'department') => {
    setEditType(type);
    setEditItem(item);
    setForm({
      hospital_id: item.hospital_id || '',
      department_id: item.department_id || '',
      period: item.period,
      type: item.type,
      total_score: item.total_score,
      max_score: item.max_score,
      metrics: item.metrics || {},
    });
    setMetricKey('');
    setMetricValue('');
    loadDropdowns();
    setShowModal(true);
  };

  const addMetric = () => {
    if (!metricKey.trim()) return;
    setForm({ ...form, metrics: { ...form.metrics, [metricKey.trim()]: Number(metricValue) || 0 } });
    setMetricKey('');
    setMetricValue('');
  };

  const removeMetric = (key: string) => {
    const newMetrics = { ...form.metrics };
    delete newMetrics[key];
    setForm({ ...form, metrics: newMetrics });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, total_score: Number(form.total_score), max_score: Number(form.max_score) };
      if (editItem) {
        if (editType === 'hospital') {
          await updateHospitalScorecard(editItem.id, payload);
        } else {
          await updateDepartmentScorecard(editItem.id, payload);
        }
      } else {
        if (editType === 'hospital') {
          await createHospitalScorecard(payload);
        } else {
          await createDepartmentScorecard(payload);
        }
      }
      setShowModal(false);
      loadAll();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (item: any, type: 'hospital' | 'department') => {
    if (!confirm(`Delete scorecard permanently? This cannot be undone.`)) return;
    try {
      if (type === 'hospital') {
        await deleteHospitalScorecard(item.id);
      } else {
        await deleteDepartmentScorecard(item.id);
      }
      loadAll();
    } catch (err: any) { alert(err.message); }
  };

  const handleToggleStatus = async (item: any, type: 'hospital' | 'department') => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this scorecard?`)) return;
    try {
      if (type === 'hospital') {
        await updateHospitalScorecard(item.id, { status: newStatus });
      } else {
        await updateDepartmentScorecard(item.id, { status: newStatus });
      }
      loadAll();
    } catch (err: any) { alert(err.message); }
  };

  const getScorePercent = (total: number, max: number) => {
    if (!max) return 0;
    return Math.round((total / max) * 100);
  };

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return 'text-green-600';
    if (pct >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (pct: number) => {
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const allHospital = hospitalScorecards;
  const allDept = deptScorecards;
  const totalScorecards = allHospital.length + allDept.length;
  const avgScore = (() => {
    const all = [...allHospital, ...allDept];
    if (all.length === 0) return 0;
    const total = all.reduce((sum, s) => sum + (s.max_score > 0 ? (s.total_score / s.max_score) * 100 : 0), 0);
    return Math.round(total / all.length);
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Award size={14} className="text-[#008751]" />
            <span>PRS</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Scorecards</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Scorecards</h1>
          <p className="text-slate-500 mt-1 text-sm">Evaluate hospital and department performance against benchmarks</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && <button onClick={() => openCreate('hospital')} className="btn-primary"><Plus size={18} /> Hospital Scorecard</button>}
          {isAdmin && <button onClick={() => openCreate('department')} className="btn-secondary"><Plus size={18} /> Dept Scorecard</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Scorecards" value={totalScorecards} icon={Award} color="primary" subtitle="All scorecards" />
        <StatCard title="Hospital" value={allHospital.length} icon={Building2} color="teal" subtitle="Hospital scorecards" />
        <StatCard title="Department" value={allDept.length} icon={Users} color="blue" subtitle="Department scorecards" />
        <StatCard title="Average Score" value={avgScore} icon={Percent} color="army" subtitle="Overall average" />
      </div>

      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <t.icon size={16} className={activeTab === t.key ? 'text-[#008751]' : ''} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeTab === 'hospital' ? (
            hospitalScorecards.length === 0 ? (
              <div className="text-center py-12">
                <Building2 size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">No hospital scorecards found.</p>
                {isAdmin && <button onClick={() => openCreate('hospital')} className="btn-primary mt-4"><Plus size={16} /> Add Hospital Scorecard</button>}
              </div>
            ) : (
              <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Hospital</th>
                    <th>Period</th>
                    <th>Type</th>
                    <th>Score</th>
                    <th>Performance</th>
                    <th>Status</th>
                    {isAdmin && <th className="text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {hospitalScorecards.map(s => {
                    const pct = getScorePercent(s.total_score, s.max_score);
                    return (
                      <tr key={s.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                              <Building2 size={18} className="text-[#008751]" />
                            </div>
                            <span className="font-medium text-slate-900">{s.hospital_name}</span>
                          </div>
                        </td>
                        <td>{s.period}</td>
                        <td><span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md capitalize">{s.type}</span></td>
                        <td className="font-mono">{s.total_score} / {s.max_score}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-2 w-24">
                              <div className={`h-2 rounded-full ${getScoreBg(pct)}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className={`text-xs font-mono font-medium ${getScoreColor(pct)}`}>{pct}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={s.status === 'active' ? 'badge-active' : 'badge-inactive'}>{s.status}</span>
                        </td>
                        {isAdmin && (
                          <td>
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openEdit(s, 'hospital')} className="btn btn-sm btn-secondary"><Pencil size={14} /></button>
                              <button onClick={() => handleToggleStatus(s, 'hospital')} className="btn btn-sm btn-secondary">
                                {s.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                              <button onClick={() => handleDelete(s, 'hospital')} className="btn btn-sm btn-danger"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            )
          ) : (
            deptScorecards.length === 0 ? (
              <div className="text-center py-12">
                <Users size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">No department scorecards found.</p>
                {isAdmin && <button onClick={() => openCreate('department')} className="btn-primary mt-4"><Plus size={16} /> Add Dept Scorecard</button>}
              </div>
            ) : (
              <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Hospital</th>
                    <th>Period</th>
                    <th>Type</th>
                    <th>Score</th>
                    <th>Performance</th>
                    <th>Status</th>
                    {isAdmin && <th className="text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {deptScorecards.map(s => {
                    const pct = getScorePercent(s.total_score, s.max_score);
                    return (
                      <tr key={s.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                              <Users size={18} className="text-[#008751]" />
                            </div>
                            <span className="font-medium text-slate-900">{s.department_name}</span>
                          </div>
                        </td>
                        <td>{s.hospital_name || '-'}</td>
                        <td>{s.period}</td>
                        <td><span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md capitalize">{s.type}</span></td>
                        <td className="font-mono">{s.total_score} / {s.max_score}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-2 w-24">
                              <div className={`h-2 rounded-full ${getScoreBg(pct)}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className={`text-xs font-mono font-medium ${getScoreColor(pct)}`}>{pct}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={s.status === 'active' ? 'badge-active' : 'badge-inactive'}>{s.status}</span>
                        </td>
                        {isAdmin && (
                          <td>
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openEdit(s, 'department')} className="btn btn-sm btn-secondary"><Pencil size={14} /></button>
                              <button onClick={() => handleToggleStatus(s, 'department')} className="btn btn-sm btn-secondary">
                                {s.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                              <button onClick={() => handleDelete(s, 'department')} className="btn btn-sm btn-danger"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            )
          )}
        </div>
        <Pagination page={activeTab === 'hospital' ? hPagination.page : dPagination.page} totalPages={activeTab === 'hospital' ? hPagination.totalPages : dPagination.totalPages} onPageChange={activeTab === 'hospital' ? loadHospitalScorecards : loadDepartmentScorecards} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? `Edit ${editType === 'hospital' ? 'Hospital' : 'Department'} Scorecard` : `Add ${editType === 'hospital' ? 'Hospital' : 'Department'} Scorecard`} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Hospital</label>
              <select className="input" value={form.hospital_id} onChange={e => setForm({ ...form, hospital_id: e.target.value })} required>
                <option value="">Select hospital</option>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
              </select>
            </div>
            {editType === 'department' && (
              <div>
                <label className="label">Department</label>
                <select className="input" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })} required>
                  <option value="">Select department</option>
                  {departments.filter(d => !form.hospital_id || d.hospital_id === form.hospital_id).map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="label">Period</label>
              <input className="input" placeholder="e.g. Q1 2025" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} required />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            <div>
              <label className="label">Total Score</label>
              <input type="number" className="input" value={form.total_score} onChange={e => setForm({ ...form, total_score: Number(e.target.value) })} required />
            </div>
            <div>
              <label className="label">Max Score</label>
              <input type="number" className="input" value={form.max_score} onChange={e => setForm({ ...form, max_score: Number(e.target.value) })} required />
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <span className="text-sm font-medium text-slate-700">Metrics (key-value pairs)</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="Metric name (e.g. staff_strength)" value={metricKey} onChange={e => setMetricKey(e.target.value)} />
                <input type="number" className="input w-32" placeholder="Value" value={metricValue} onChange={e => setMetricValue(e.target.value)} />
                <button type="button" onClick={addMetric} className="btn-primary text-sm px-3"><Plus size={16} /></button>
              </div>
              {Object.keys(form.metrics).length === 0 ? (
                <p className="text-xs text-slate-400">No metrics added yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {Object.entries(form.metrics).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Check size={14} className="text-[#008751]" />
                        <span className="text-sm font-medium text-slate-700">{key}</span>
                        <span className="text-sm text-slate-400">=</span>
                        <span className="text-sm font-mono font-medium text-slate-900">{val as number}</span>
                      </div>
                      <button type="button" onClick={() => removeMetric(key)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">
              {editItem ? 'Update Scorecard' : 'Create Scorecard'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
