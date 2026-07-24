import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, Calendar, Clock, MapPin, Building2, ChevronDown, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getEvents, createEvent, updateEvent, deleteEvent, getUpcomingEvents } from '../lib/calendar';
import { getAllHospitals } from '../lib/hospitals';
import { getHospitalScope } from '../lib/scope';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import StatCard from '../components/common/StatCard';
import type { CalendarEvent } from '../types';

const TYPE_COLORS: Record<string, string> = {
  audit: 'bg-red-50 text-red-600', meeting: 'bg-blue-50 text-blue-600',
  training: 'bg-emerald-50 text-emerald-600', deadline: 'bg-amber-50 text-amber-600',
  board_event: 'bg-purple-50 text-purple-600', hospital_event: 'bg-cyan-50 text-cyan-600',
  inspection: 'bg-orange-50 text-orange-600', other: 'bg-slate-100 text-slate-600',
};

export default function CalendarPage() {
  const { user, hasRole } = useAuth();
  const hospitalScope = getHospitalScope(user);
  const [items, setItems] = useState<CalendarEvent[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<CalendarEvent | null>(null);
  const [upcoming, setUpcoming] = useState(0);
  const [hospitals, setHospitals] = useState<{ id: string; hospital_name: string }[]>([]);
  const [form, setForm] = useState({ title: '', description: '', event_type: 'meeting', start_date: '', end_date: '', all_day: false, location: '', hospital_id: '', color: '#008751' });

  const loadItems = async (page = 1) => {
    setLoading(true);
    try {
      const { data, total } = await getEvents(page, 50, typeFilter || undefined, undefined, undefined, hospitalScope);
      if (search) {
        const sl = search.toLowerCase();
        const filtered = data.filter((e: any) => e.title?.toLowerCase().includes(sl) || e.location?.toLowerCase().includes(sl));
        setItems(filtered);
        setPagination({ page, limit: 50, total: filtered.length, totalPages: Math.ceil(filtered.length / 50) });
      } else {
        setItems(data);
        setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
      }
      const upcomingEvents = await getUpcomingEvents(30, hospitalScope);
      setUpcoming(upcomingEvents.length);
    } finally { setLoading(false); }
  };

  const loadHospitals = async () => {
    try { const data = await getAllHospitals(hospitalScope); setHospitals((data || []).map((h: any) => ({ id: h.id, hospital_name: h.hospital_name }))); } catch {}
  };

  useEffect(() => { loadItems(); loadHospitals(); }, [typeFilter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadItems(); };

  const openCreate = () => {
    setEditItem(null);
    setForm({ title: '', description: '', event_type: 'meeting', start_date: '', end_date: '', all_day: false, location: '', hospital_id: '', color: '#008751' });
    setShowModal(true);
  };

  const openEdit = (e: CalendarEvent) => {
    setEditItem(e);
    setForm({
      title: e.title, description: e.description || '', event_type: e.event_type,
      start_date: typeof e.start_date === 'string' ? e.start_date.slice(0, 16) : '',
      end_date: e.end_date ? (typeof e.end_date === 'string' ? e.end_date.slice(0, 16) : '') : '',
      all_day: e.all_day || false, location: e.location || '',
      hospital_id: e.hospital_id || '', color: e.color || '#008751',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        title: form.title, description: form.description, event_type: form.event_type as any,
        start_date: form.start_date, end_date: form.end_date || undefined,
        all_day: form.all_day, location: form.location || undefined,
        hospital_id: form.hospital_id || undefined, color: form.color,
        organizer_id: user?.id || '', organizer_name: user?.full_name,
      };
      if (editItem) {
        await updateEvent(editItem.id, data);
      } else {
        await createEvent(data as any);
      }
      setShowModal(false);
      loadItems(pagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (e: CalendarEvent) => {
    if (!confirm(`Delete event "${e.title}"?`)) return;
    await deleteEvent(e.id);
    loadItems(pagination.page);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Calendar size={14} className="text-[#008751]" /><span>Collaboration</span><span className="text-slate-300">/</span><span className="text-slate-800 font-medium">Calendar</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Calendar & Events</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage schedules, meetings, trainings, and deadlines</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Event</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Events" value={pagination.total} icon={Calendar} color="primary" subtitle="All events" />
        <StatCard title="Upcoming (30d)" value={upcoming} icon={Clock} color="blue" subtitle="Events in next 30 days" />
        <StatCard title="This Page" value={items.length} icon={Tag} color="teal" subtitle="Current view" />
      </div>

      <div className="card">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="relative">
              <select className="input w-40 appearance-none" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); }}>
                <option value="">All Types</option>
                <option value="audit">Audit</option><option value="meeting">Meeting</option>
                <option value="training">Training</option><option value="deadline">Deadline</option>
                <option value="board_event">Board Event</option><option value="hospital_event">Hospital Event</option>
                <option value="inspection">Inspection</option><option value="other">Other</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button type="submit" className="btn-secondary">Search</button>
          </form>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12"><div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-12"><Calendar size={40} className="mx-auto text-slate-300 mb-3" /><p className="text-slate-500 text-sm">No events found.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th><th>Type</th><th>Date</th><th>Location</th><th>Hospital</th><th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(e => (
                    <tr key={e.id}>
                      <td className="font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color || '#008751' }} />
                          {e.title}
                        </div>
                      </td>
                      <td><span className={`badge ${TYPE_COLORS[e.event_type] || ''}`}>{e.event_type}</span></td>
                      <td className="text-slate-500">
                        {e.start_date ? new Date(e.start_date).toLocaleDateString() : '-'}
                        {!e.all_day && e.start_date && ` ${new Date(e.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </td>
                      <td>{e.location || '-'}</td>
                      <td>{e.hospital_name || '-'}</td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(e)} className="btn btn-xs btn-secondary p-1.5"><Pencil size={13} /></button>
                          <button onClick={() => handleDelete(e)} className="btn btn-xs btn-danger p-1.5"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadItems} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Event' : 'Add Event'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Title</label><input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Event Type</label>
              <div className="relative">
                <select className="input appearance-none" value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}>
                  <option value="meeting">Meeting</option><option value="audit">Audit</option>
                  <option value="training">Training</option><option value="deadline">Deadline</option>
                  <option value="board_event">Board Event</option><option value="hospital_event">Hospital Event</option>
                  <option value="inspection">Inspection</option><option value="other">Other</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div><label className="label">Color</label><input type="color" className="input h-10" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Start Date/Time</label><input type="datetime-local" className="input" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required /></div>
            <div><label className="label">End Date/Time</label><input type="datetime-local" className="input" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.all_day} onChange={e => setForm({ ...form, all_day: e.target.checked })} className="rounded" /> All Day Event</label>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Location</label><input className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
            {!hospitalScope && (
              <div>
                <label className="label">Hospital</label>
                <div className="relative">
                  <select className="input appearance-none" value={form.hospital_id} onChange={e => setForm({ ...form, hospital_id: e.target.value })}>
                    <option value="">All / Board Level</option>
                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editItem ? 'Update Event' : 'Create Event'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
