import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ReferralStatistic, EmergencyReport, Pagination as PaginationType } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Pencil, Trash2, BarChart3, AlertTriangle, Building2, Activity, FileText } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getReferralStats, createReferralStat, updateReferralStat, deleteReferralStat } from '../lib/referralStats';
import { getEmergencyReports, createEmergencyReport, updateEmergencyReport, deleteEmergencyReport } from '../lib/emergencyReports';
import { getAllHospitals } from '../lib/hospitals';

type TabType = 'referral' | 'emergency';

export default function ReferralOversightPage() {
  const { hasRole } = useAuth();
  const location = useLocation();
  const canManage = hasRole('super_admin', 'hospital_admin');
  const [activeTab, setActiveTab] = useState<TabType>(location.pathname === '/emergency-reports' ? 'emergency' : 'referral');

  // Referral state
  const [referrals, setReferrals] = useState<ReferralStatistic[]>([]);
  const [refPagination, setRefPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [refSearch, setRefSearch] = useState('');
  const [refLoading, setRefLoading] = useState(true);
  const [showRefModal, setShowRefModal] = useState(false);
  const [editRef, setEditRef] = useState<ReferralStatistic | null>(null);
  const [refForm, setRefForm] = useState({ hospital_id: '', referral_count: 0, incident_type: '', reporting_period: '', notes: '' });

  // Emergency state
  const [emergencies, setEmergencies] = useState<EmergencyReport[]>([]);
  const [emgPagination, setEmgPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [emgSearch, setEmgSearch] = useState('');
  const [emgLoading, setEmgLoading] = useState(true);
  const [showEmgModal, setShowEmgModal] = useState(false);
  const [editEmg, setEditEmg] = useState<EmergencyReport | null>(null);
  const [emgForm, setEmgForm] = useState({ hospital_id: '', incident_type: '', description: '', incident_date: '', actions_taken: '' });

  const [hospitals, setHospitals] = useState<{ id: string; hospital_name: string }[]>([]);

  const loadHospitals = async () => {
    try {
      const data = await getAllHospitals();
      setHospitals((data || []).map((h: any) => ({ id: h.id, hospital_name: h.hospital_name })));
    } catch {}
  };

  // Referral CRUD
  const loadReferrals = async (page = 1) => {
    setRefLoading(true);
    try {
      const { data, total } = await getReferralStats(page, 50, refSearch || undefined);
      setReferrals(data);
      setRefPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally {
      setRefLoading(false);
    }
  };

  useEffect(() => { loadReferrals(); }, []);

  const handleRefSearch = (e: React.FormEvent) => { e.preventDefault(); loadReferrals(); };

  const openCreateRef = () => {
    setEditRef(null);
    setRefForm({ hospital_id: '', referral_count: 0, incident_type: '', reporting_period: '', notes: '' });
    loadHospitals();
    setShowRefModal(true);
  };

  const openEditRef = (item: ReferralStatistic) => {
    setEditRef(item);
    setRefForm({ hospital_id: item.hospital_id, referral_count: item.referral_count, incident_type: item.incident_type, reporting_period: item.reporting_period, notes: item.notes });
    loadHospitals();
    setShowRefModal(true);
  };

  const handleRefSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editRef) {
        await updateReferralStat(editRef.id, refForm);
      } else {
        await createReferralStat(refForm);
      }
      setShowRefModal(false);
      loadReferrals(refPagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteRef = async (item: ReferralStatistic) => {
    if (!confirm(`Delete this referral statistic permanently? This cannot be undone.`)) return;
    try {
      await deleteReferralStat(item.id);
      loadReferrals(refPagination.page);
    } catch (err: any) { alert(err.message); }
  };

  // Emergency CRUD
  const loadEmergencies = async (page = 1) => {
    setEmgLoading(true);
    try {
      const { data, total } = await getEmergencyReports(page, 50, emgSearch || undefined);
      setEmergencies(data);
      setEmgPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally {
      setEmgLoading(false);
    }
  };

  useEffect(() => { loadEmergencies(); }, []);

  const handleEmgSearch = (e: React.FormEvent) => { e.preventDefault(); loadEmergencies(); };

  const openCreateEmg = () => {
    setEditEmg(null);
    setEmgForm({ hospital_id: '', incident_type: '', description: '', incident_date: '', actions_taken: '' });
    loadHospitals();
    setShowEmgModal(true);
  };

  const openEditEmg = (item: EmergencyReport) => {
    setEditEmg(item);
    setEmgForm({ hospital_id: item.hospital_id, incident_type: item.incident_type, description: item.description, incident_date: item.incident_date, actions_taken: item.actions_taken });
    loadHospitals();
    setShowEmgModal(true);
  };

  const handleEmgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editEmg) {
        await updateEmergencyReport(editEmg.id, emgForm);
      } else {
        await createEmergencyReport(emgForm);
      }
      setShowEmgModal(false);
      loadEmergencies(emgPagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteEmg = async (item: EmergencyReport) => {
    if (!confirm(`Delete this emergency report permanently? This cannot be undone.`)) return;
    try {
      await deleteEmergencyReport(item.id);
      loadEmergencies(emgPagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleToggleEmgStatus = async (item: EmergencyReport) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this report?`)) return;
    try {
      await updateEmergencyReport(item.id, { status: newStatus });
      loadEmergencies(emgPagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'referral', label: 'Referral Statistics', icon: BarChart3 },
    { key: 'emergency', label: 'Emergency Reports', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <BarChart3 size={14} className="text-[#008751]" />
            <span>Clinical Services</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Referral Oversight</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Referral & Emergency Oversight</h1>
          <p className="text-slate-500 mt-1 text-sm">Track referral statistics and emergency incident reports</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-[#008751] text-[#008751]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Referral Statistics Tab */}
      {activeTab === 'referral' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Referrals" value={refPagination.total} icon={BarChart3} color="primary" subtitle="All referral records" />
            <StatCard title="Total Count" value={referrals.reduce((sum, r) => sum + (r.referral_count || 0), 0)} icon={Building2} color="teal" subtitle="Aggregated referrals" />
            <StatCard title="Incident Types" value={new Set(referrals.map(r => r.incident_type)).size} icon={AlertTriangle} color="blue" subtitle="Distinct types" />
            <StatCard title="Hospitals" value={new Set(referrals.map(r => r.hospital_id)).size} icon={Building2} color="army" subtitle="Reporting facilities" />
          </div>

          <div className="card">
            <div className="card-header">
              <form onSubmit={handleRefSearch} className="flex gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className="input pl-10" placeholder="Search by incident type..." value={refSearch} onChange={e => setRefSearch(e.target.value)} />
                </div>
                <button type="submit" className="btn-secondary">Search</button>
                {canManage && <button onClick={openCreateRef} className="btn-primary"><Plus size={16} /> Add Record</button>}
              </form>
            </div>
            <div className="overflow-x-auto">
              {refLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : referrals.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 text-sm">No referral statistics found.</p>
                  {canManage && <button onClick={openCreateRef} className="btn-primary mt-4"><Plus size={16} /> Add Record</button>}
                </div>
              ) : (
                <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Hospital</th>
                      <th>Incident Type</th>
                      <th>Referral Count</th>
                      <th>Reporting Period</th>
                      <th>Notes</th>
                      {canManage && <th className="text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map(r => (
                      <tr key={r.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                              <Building2 size={18} className="text-[#008751]" />
                            </div>
                            <span className="font-medium text-slate-900">{r.hospital_name || '-'}</span>
                          </div>
                        </td>
                        <td>
                          <span className="inline-flex items-center px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium border border-amber-100">
                            {r.incident_type}
                          </span>
                        </td>
                        <td className="font-semibold">{r.referral_count}</td>
                        <td>{r.reporting_period}</td>
                        <td className="max-w-xs truncate text-slate-500">{r.notes || '-'}</td>
                        {canManage && (
                          <td>
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openEditRef(r)} className="btn btn-sm btn-secondary"><Pencil size={14} /></button>
                              <button onClick={() => handleDeleteRef(r)} className="btn btn-sm btn-danger"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
            <Pagination page={refPagination.page} totalPages={refPagination.totalPages} onPageChange={loadReferrals} />
          </div>
        </>
      )}

      {/* Emergency Reports Tab */}
      {activeTab === 'emergency' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Reports" value={emgPagination.total} icon={AlertTriangle} color="primary" subtitle="All emergency reports" />
            <StatCard title="Active" value={emergencies.filter(e => e.status === 'active').length} icon={Activity} color="teal" subtitle="Open incidents" />
            <StatCard title="Resolved" value={emergencies.filter(e => e.status === 'inactive').length} icon={FileText} color="blue" subtitle="Closed incidents" />
            <StatCard title="Hospitals" value={new Set(emergencies.map(e => e.hospital_id)).size} icon={Building2} color="army" subtitle="Affected facilities" />
          </div>

          <div className="card">
            <div className="card-header">
              <form onSubmit={handleEmgSearch} className="flex gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className="input pl-10" placeholder="Search by incident type or description..." value={emgSearch} onChange={e => setEmgSearch(e.target.value)} />
                </div>
                <button type="submit" className="btn-secondary">Search</button>
                {canManage && <button onClick={openCreateEmg} className="btn-primary"><Plus size={16} /> Add Report</button>}
              </form>
            </div>
            <div className="overflow-x-auto">
              {emgLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : emergencies.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 text-sm">No emergency reports found.</p>
                  {canManage && <button onClick={openCreateEmg} className="btn-primary mt-4"><Plus size={16} /> Add Report</button>}
                </div>
              ) : (
                <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Hospital</th>
                      <th>Incident Type</th>
                      <th>Incident Date</th>
                      <th>Description</th>
                      <th>Actions Taken</th>
                      <th>Status</th>
                      {canManage && <th className="text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {emergencies.map(e => (
                      <tr key={e.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                              <Building2 size={18} className="text-[#008751]" />
                            </div>
                            <span className="font-medium text-slate-900">{e.hospital_name || '-'}</span>
                          </div>
                        </td>
                        <td>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-medium border border-red-100">
                            <AlertTriangle size={10} />
                            {e.incident_type}
                          </span>
                        </td>
                        <td>{e.incident_date}</td>
                        <td className="max-w-xs truncate text-slate-500">{e.description}</td>
                        <td className="max-w-xs truncate text-slate-500">{e.actions_taken || '-'}</td>
                        <td>
                          <span className={e.status === 'active' ? 'badge-active' : 'badge-inactive'}>{e.status === 'active' ? 'Open' : 'Resolved'}</span>
                        </td>
                        {canManage && (
                          <td>
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openEditEmg(e)} className="btn btn-sm btn-secondary"><Pencil size={14} /></button>
                              <button onClick={() => handleToggleEmgStatus(e)} className="btn btn-sm btn-secondary">
                                {e.status === 'active' ? 'Resolve' : 'Reopen'}
                              </button>
                              <button onClick={() => handleDeleteEmg(e)} className="btn btn-sm btn-danger"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
            <Pagination page={emgPagination.page} totalPages={emgPagination.totalPages} onPageChange={loadEmergencies} />
          </div>
        </>
      )}

      {/* Referral Modal */}
      <Modal open={showRefModal} onClose={() => setShowRefModal(false)} title={editRef ? 'Edit Referral Statistic' : 'Add Referral Statistic'} size="lg">
        <form onSubmit={handleRefSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Hospital</label>
              <select className="input" value={refForm.hospital_id} onChange={e => setRefForm({ ...refForm, hospital_id: e.target.value })} required>
                <option value="">Select hospital...</option>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Referral Count</label>
              <input type="number" min={0} className="input" value={refForm.referral_count} onChange={e => setRefForm({ ...refForm, referral_count: parseInt(e.target.value) || 0 })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Incident Type</label>
              <input className="input" value={refForm.incident_type} onChange={e => setRefForm({ ...refForm, incident_type: e.target.value })} required />
            </div>
            <div>
              <label className="label">Reporting Period</label>
              <input className="input" placeholder="e.g. January 2026" value={refForm.reporting_period} onChange={e => setRefForm({ ...refForm, reporting_period: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={3} value={refForm.notes} onChange={e => setRefForm({ ...refForm, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowRefModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editRef ? 'Update' : 'Create Record'}</button>
          </div>
        </form>
      </Modal>

      {/* Emergency Modal */}
      <Modal open={showEmgModal} onClose={() => setShowEmgModal(false)} title={editEmg ? 'Edit Emergency Report' : 'Add Emergency Report'} size="lg">
        <form onSubmit={handleEmgSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Hospital</label>
              <select className="input" value={emgForm.hospital_id} onChange={e => setEmgForm({ ...emgForm, hospital_id: e.target.value })} required>
                <option value="">Select hospital...</option>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Incident Type</label>
              <input className="input" value={emgForm.incident_type} onChange={e => setEmgForm({ ...emgForm, incident_type: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="label">Incident Date</label>
            <input type="date" className="input" value={emgForm.incident_date} onChange={e => setEmgForm({ ...emgForm, incident_date: e.target.value })} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={emgForm.description} onChange={e => setEmgForm({ ...emgForm, description: e.target.value })} required />
          </div>
          <div>
            <label className="label">Actions Taken</label>
            <textarea className="input" rows={3} value={emgForm.actions_taken} onChange={e => setEmgForm({ ...emgForm, actions_taken: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowEmgModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editEmg ? 'Update Report' : 'Create Report'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
