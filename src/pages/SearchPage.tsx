import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Users, Building2, Building, BookOpen, Pill, Microscope, Target, ArrowRight, Clock, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { globalSearch } from '../lib/search';
import { getHospitalScope } from '../lib/scope';
import type { SearchResult } from '../types';

const TYPE_ICONS: Record<string, any> = {
  employee: Users, hospital: Building2, department: Building,
  document: FileText, guideline: BookOpen, audit: FileText,
  medicine: Pill, equipment: Microscope, kpi: Target, research: BookOpen,
};

const TYPE_COLORS: Record<string, string> = {
  employee: 'bg-teal-50 text-teal-600', hospital: 'bg-sky-50 text-sky-600',
  department: 'bg-amber-50 text-amber-600', document: 'bg-indigo-50 text-indigo-600',
  guideline: 'bg-emerald-50 text-emerald-600', audit: 'bg-rose-50 text-rose-600',
  medicine: 'bg-violet-50 text-violet-600', equipment: 'bg-cyan-50 text-cyan-600',
  kpi: 'bg-orange-50 text-orange-600', research: 'bg-purple-50 text-purple-600',
};

export default function SearchPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const hospitalScope = getHospitalScope(user);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await globalSearch(query, hospitalScope);
      setResults(res);
      setRecent(prev => [query, ...prev.filter(r => r !== query)].slice(0, 5));
    } finally { setLoading(false); }
  };

  const grouped = results.reduce((acc, r) => {
    if (!acc[r.entity_type]) acc[r.entity_type] = [];
    acc[r.entity_type].push(r);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Search size={14} className="text-[#008751]" /><span>Collaboration</span><span className="text-slate-300">/</span><span className="text-slate-800 font-medium">Search</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Global Search</h1>
          <p className="text-slate-500 mt-1 text-sm">Search across all modules and records</p>
        </div>
      </div>

      <div className="card">
        <div className="p-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-12 py-3 text-lg" placeholder="Search employees, hospitals, documents, medicines, equipment..." value={query} onChange={e => setQuery(e.target.value)} autoFocus />
            </div>
            <button type="submit" className="btn-primary px-6" disabled={loading}>
              {loading ? <Loader size={18} className="animate-spin" /> : <Search size={18} />}
              Search
            </button>
          </form>
          {recent.length > 0 && !searched && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
              <Clock size={14} /> Recent:
              {recent.map((r, i) => (
                <button key={i} onClick={() => { setQuery(r); handleSearch({ preventDefault: () => {} } as any); }} className="text-[#008751] hover:underline">{r}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm mt-4">Searching across all modules...</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-12">
          <Search size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">No results found for "{query}".</p>
          <p className="text-xs text-slate-400 mt-1">Try different keywords or check your spelling.</p>
        </div>
      )}

      {!loading && Object.keys(grouped).length > 0 && (
        <div className="space-y-6">
          {Object.entries(grouped).map(([type, items]) => {
            const Icon = TYPE_ICONS[type] || FileText;
            const color = TYPE_COLORS[type] || 'bg-slate-50 text-slate-600';
            return (
              <div key={type} className="card">
                <div className="card-header">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${color}`}><Icon size={16} /></div>
                    <span className="font-medium text-slate-700 capitalize">{type}s</span>
                    <span className="text-xs text-slate-400">({items.length})</span>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {items.map(item => (
                    <div key={`${item.entity_type}-${item.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-1.5 rounded-lg flex-shrink-0 ${color}`}><Icon size={14} /></div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                          {item.subtitle && <p className="text-xs text-slate-400 truncate">{item.subtitle}</p>}
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.hospital_name && <span className="text-[10px] text-slate-400">{item.hospital_name}</span>}
                            {item.status && <span className="badge-active text-[10px] px-1.5 py-0.5">{item.status}</span>}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => navigate(item.url)} className="btn btn-sm btn-secondary flex-shrink-0">
                        <ArrowRight size={14} /> Open
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
