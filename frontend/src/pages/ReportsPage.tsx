import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Download, Building2, Building, Users, ArrowRightLeft, UserCheck, BarChart3 } from 'lucide-react';

interface ReportCard {
  key: string;
  title: string;
  description: string;
  icon: any;
  color: string;
}

const REPORTS: ReportCard[] = [
  { key: 'workforce', title: 'Workforce Distribution', description: 'Employee counts by hospital with active/inactive breakdown', icon: Building2, color: 'bg-emerald-50 text-emerald-600' },
  { key: 'hospital-staffing', title: 'Hospital Staffing Levels', description: 'Staff breakdown by department within each hospital', icon: BarChart3, color: 'bg-blue-50 text-blue-600' },
  { key: 'department-staffing', title: 'Department Staffing Levels', description: 'Staff counts across hospitals by department', icon: Building, color: 'bg-purple-50 text-purple-600' },
  { key: 'transfers', title: 'Employee Transfers', description: 'Complete transfer history with status tracking', icon: ArrowRightLeft, color: 'bg-orange-50 text-orange-600' },
  { key: 'active-employees', title: 'Active Employees', description: 'All currently active employees across the board', icon: UserCheck, color: 'bg-teal-50 text-teal-600' },
];

export default function ReportsPage() {
  const { hasRole } = useAuth();
  const canView = hasRole('super_admin', 'executive_secretary', 'hospital_admin', 'hr_officer');
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [activeReport, setActiveReport] = useState<string | null>(null);

  const loadReport = async (key: string) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    try {
      const result: any = await api.get(`/reports/${key.replace(/-/g, '-')}`);
      setData(prev => ({ ...prev, [key]: Array.isArray(result) ? result : [] }));
      setActiveReport(key);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const mapKeyToEndpoint: Record<string, string> = {
    workforce: 'workforce-distribution',
    'hospital-staffing': 'hospital-staffing',
    'department-staffing': 'department-staffing',
    transfers: 'transfers',
    'active-employees': 'active-employees',
  };

  const handleView = (key: string) => {
    loadReport(key);
  };

  const handleExport = async (key: string) => {
    try {
      const endpoint = mapKeyToEndpoint[key] || key;
      const response = await fetch(`/api/reports/export/csv?type=${endpoint}`, {
        headers: { Authorization: `Bearer ${api.getToken()}` },
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${endpoint}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const renderTable = () => {
    if (!activeReport || !data[activeReport] || data[activeReport].length === 0) {
      return (
        <div className="text-center py-16">
          <FileText size={48} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-400 text-sm">Select a report above to view data</p>
        </div>
      );
    }

    const rows = data[activeReport];
    const headers = Object.keys(rows[0]);

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {headers.map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {h.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                {headers.map(h => (
                  <td key={h} className="px-4 py-3 text-sm text-slate-700">{row[h]?.toString() || '-'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-slate-400 px-4 py-2 border-t border-slate-100">
          Total records: {rows.length}
        </p>
      </div>
    );
  };

  if (!canView) {
    return (
      <div className="text-center py-12">
        <FileText size={40} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500 text-sm">You do not have permission to view reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <FileText size={14} className="text-[#008751]" />
            <span>Records</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Reports</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500 mt-1 text-sm">View workforce reports and export data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map(r => (
          <div key={r.key} className="card hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-lg ${r.color}`}>
                  <r.icon size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{r.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{r.description}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleView(r.key)}
                  className="btn btn-sm btn-primary flex-1"
                  disabled={loading[r.key]}
                >
                  {loading[r.key] ? 'Loading...' : 'View'}
                </button>
                <button
                  onClick={() => handleExport(r.key)}
                  className="btn btn-sm btn-secondary"
                  title="Download CSV"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="section-title">
            {activeReport ? REPORTS.find(r => r.key === activeReport)?.title || 'Report Data' : 'Report Preview'}
          </h3>
        </div>
        {renderTable()}
      </div>
    </div>
  );
}
