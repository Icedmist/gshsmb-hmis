import { useState, useEffect } from 'react';
import type { Pagination as PaginationType } from '../types';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Pencil, ShieldCheck, Building2, Calendar, FileText } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { getPharmaceuticalQualityReports, createPharmaceuticalQualityReport, updatePharmaceuticalQualityReport } from '../lib/pharmaceutical';
import { getAllHospitals } from '../lib/hospitals';
import { getHospitalScope } from '../lib/scope';

export default function PharmaceuticalQualityPage() {
  const { hasRole, user } = useAuth();
  const canManage = hasRole('super_admin', 'pharmacy_admin');
  const hospitalScope = getHospitalScope(user);
  const [items, setItems] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<{ id: string; hospital_name: string }[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [form, setForm] = useState({ hospital_id: '', report_title: '', findings: '', recommendations: '', report_date: '' });

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getPharmaceuticalQualityReports(page, 50, search || undefined, hospitalScope);
      setItems(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally {
      setLoading(false);
    }
  };

// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadData(); };

  const loadHospitals = async () => {
    try {
      const data = await getAllHospitals(hospitalScope);
      setHospitals((data || []).map((h: any) => ({ id: h.id, hospital_name: h.hospital_name })));
    } catch {}
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ hospital_id: '', report_title: '', findings: '', recommendations: '', report_date: '' });
    loadHospitals();
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      hospital_id: item.hospital_id,
      report_title: item.report_title,
      findings: item.findings,
      recommendations: item.recommendations,
      report_date: item.report_date,
    });
    loadHospitals();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editItem) {
        await updatePharmaceuticalQualityReport(editItem.id, form);
      } else {
        await createPharmaceuticalQualityReport(form);
      }
      setShowModal(false);
      loadData(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <ShieldCheck size={14} className="text-[#008751]" />
            <span>Pharmaceutical Services</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Quality Assurance</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Pharmaceutical Quality Assurance</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage pharmaceutical quality assurance reports</p>
        </div>
        {canManage && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Report</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Reports" value={pagination.total} icon={ShieldCheck} color="primary" subtitle="All quality reports" />
        <StatCard title="Hospitals" value={new Set(items.map(i => i.hospital_id)).size} icon={Building2} color="teal" subtitle="Hospitals reported" />
        <StatCard title="Reports" value={items.length} icon={FileText} color="blue" subtitle="Current page" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search by report title..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button type="submit" className="btn-secondary">Search</button>
          </form>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <ShieldCheck size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No quality reports found.</p>
              {canManage && <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Add Report</button>}
            </div>
          ) : (
            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Report Title</th>
                  <th>Hospital</th>
                  <th>Report Date</th>
                  <th>Findings</th>
                  <th>Recommendations</th>
                  {canManage && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <ShieldCheck size={18} className="text-[#008751]" />
                        </div>
                        <span className="font-medium text-slate-900">{item.report_title}</span>
                      </div>
                    </td>
                    <td>{item.hospital_name || '-'}</td>
                    <td>
                      <span className="flex items-center gap-1 text-sm">
                        <Calendar size={12} className="text-slate-400" />
                        {item.report_date || '-'}
                      </span>
                    </td>
                    <td className="max-w-xs whitespace-pre-wrap text-sm">{item.findings || '-'}</td>
                    <td className="max-w-xs whitespace-pre-wrap text-sm">{item.recommendations || '-'}</td>
                    {canManage && (
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(item)} className="btn btn-sm btn-secondary"><Pencil size={14} /></button>
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
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadData} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Quality Report' : 'Add Quality Report'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Report Title</label>
              <input className="input" value={form.report_title} onChange={e => setForm({ ...form, report_title: e.target.value })} required />
            </div>
            <div>
              <label className="label">Hospital</label>
              <select className="input" value={form.hospital_id} onChange={e => setForm({ ...form, hospital_id: e.target.value })} required>
                <option value="">Select hospital...</option>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Report Date</label>
            <input type="date" className="input" value={form.report_date} onChange={e => setForm({ ...form, report_date: e.target.value })} required />
          </div>
          <div>
            <label className="label">Findings</label>
            <textarea className="input" rows={3} value={form.findings} onChange={e => setForm({ ...form, findings: e.target.value })} required />
          </div>
          <div>
            <label className="label">Recommendations</label>
            <textarea className="input" rows={3} value={form.recommendations} onChange={e => setForm({ ...form, recommendations: e.target.value })} required />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editItem ? 'Update Report' : 'Create Report'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
