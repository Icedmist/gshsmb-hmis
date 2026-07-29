import { useState, useEffect } from 'react';
import { Search, ChevronDown, UserCheck, FileText, Activity, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getActivities } from '../lib/activities';
import { getHospitalScope } from '../lib/scope';
import Pagination from '../components/common/Pagination';
import StatCard from '../components/common/StatCard';
import type { OrganizationActivity } from '../types';

const ACTION_ICONS: Record<string, any> = {
  create: FileText, update: FileText, delete: FileText,
  submit: FileText, approve: UserCheck, reject: UserCheck,
  login: UserCheck, logout: UserCheck, upload: FileText,
  comment: FileText, assign: UserCheck, complete: UserCheck,
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-emerald-50 text-emerald-600', update: 'bg-blue-50 text-blue-600',
  delete: 'bg-red-50 text-red-600', submit: 'bg-indigo-50 text-indigo-600',
  approve: 'bg-emerald-50 text-emerald-600', reject: 'bg-red-50 text-red-600',
  login: 'bg-slate-50 text-slate-600', upload: 'bg-purple-50 text-purple-600',
  comment: 'bg-amber-50 text-amber-600', assign: 'bg-cyan-50 text-cyan-600',
  complete: 'bg-teal-50 text-teal-600',
};

export default function ActivityTimelinePage() {
  const { user } = useAuth();
  const hospitalScope = getHospitalScope(user);
  const [items, setItems] = useState<OrganizationActivity[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadItems = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getActivities(page, 50, entityFilter || undefined, actionFilter || undefined, undefined, hospitalScope);
      if (search) {
        const sl = search.toLowerCase();
        const filtered = data.filter((a: any) => a.user_name?.toLowerCase().includes(sl) || a.entity_title?.toLowerCase().includes(sl));
        setItems(filtered);
        setPagination({ page, limit: 50, total: filtered.length, totalPages: Math.ceil(filtered.length / 50) });
      } else {
        setItems(data);
        setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { loadItems(); }, [entityFilter, actionFilter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadItems(); };

  const timeAgo = (ts: any) => {
    const diff = Date.now() - new Date(ts.seconds ? ts.seconds * 1000 : ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts.seconds ? ts.seconds * 1000 : ts).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Activity size={14} className="text-[#008751]" /><span>Collaboration</span><span className="text-slate-300">/</span><span className="text-slate-800 font-medium">Activity Timeline</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Organization Activity Timeline</h1>
          <p className="text-slate-500 mt-1 text-sm">Track all user activities across the platform</p>
        </div>
      </div>

      <StatCard title="Total Activities" value={pagination.total} icon={Activity} color="primary" subtitle="Recorded events" />

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search by user or entity..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="relative">
              <select className="input w-36 appearance-none" value={entityFilter} onChange={e => setEntityFilter(e.target.value)}>
                <option value="">All Entities</option>
                <option value="employee">Employee</option><option value="hospital">Hospital</option>
                <option value="department">Department</option><option value="document">Document</option>
                <option value="task">Task</option><option value="approval">Approval</option>
                <option value="workflow">Workflow</option><option value="report">Report</option>
                <option value="audit">Audit</option><option value="user">User</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select className="input w-36 appearance-none" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                <option value="">All Actions</option>
                <option value="create">Create</option><option value="update">Update</option>
                <option value="delete">Delete</option><option value="submit">Submit</option>
                <option value="approve">Approve</option><option value="reject">Reject</option>
                <option value="login">Login</option><option value="upload">Upload</option>
                <option value="comment">Comment</option><option value="assign">Assign</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button type="submit" className="btn-secondary"><Filter size={16} /> Filter</button>
          </form>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12"><div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-12"><Activity size={40} className="mx-auto text-slate-300 mb-3" /><p className="text-slate-500 text-sm">No activities found.</p></div>
          ) : (
            <div className="p-4">
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
                <div className="space-y-0">
                  {items.map((a, i) => {
                    const Icon = ACTION_ICONS[a.action?.toLowerCase()] || Activity;
                    const color = ACTION_COLORS[a.action?.toLowerCase()] || 'bg-slate-50 text-slate-600';
                    return (
                      <div key={a.id || i} className="relative flex items-start gap-4 pb-4">
                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                          <Icon size={14} />
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-900">
                              {a.user_name || 'System'}
                              <span className="text-slate-400 font-normal"> {a.action} </span>
                              <span className="font-medium">{a.entity_type}</span>
                            </p>
                            <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">{timeAgo(a.created_at)}</span>
                          </div>
                          {a.entity_title && <p className="text-xs text-slate-500 mt-0.5">{a.entity_title}</p>}
                          {(a.hospital_name || a.details) && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {a.hospital_name && `${a.hospital_name}`}
                              {a.details && ` — ${a.details}`}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadItems} />
      </div>
    </div>
  );
}
