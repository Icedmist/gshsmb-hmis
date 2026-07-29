import { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, CheckCheck, Trash2, FileText, CheckCircle, XCircle, AlertTriangle, MessageSquare, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getNotifications, getUnreadCount as getUnreadNotifCount, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } from '../lib/notifications';
import { getUnreadMessageCount } from '../lib/messaging';
import Pagination from '../components/common/Pagination';
import type { Notification } from '../types';

const TYPE_ICONS: Record<string, any> = {
  report_submitted: FileText, report_approved: CheckCircle, report_rejected: XCircle,
  task_assigned: Clock, task_completed: CheckCircle, deadline_approaching: AlertTriangle,
  document_uploaded: FileText, circular_published: Bell, workflow_update: Bell,
  approval_request: Bell, message_received: MessageSquare, announcement: Bell,
};

const TYPE_COLORS: Record<string, string> = {
  report_submitted: 'text-blue-500', report_approved: 'text-emerald-500', report_rejected: 'text-red-500',
  task_assigned: 'text-orange-500', task_completed: 'text-emerald-500', deadline_approaching: 'text-amber-500',
  document_uploaded: 'text-indigo-500', circular_published: 'text-purple-500',
  approval_request: 'text-rose-500', message_received: 'text-cyan-500', announcement: 'text-sky-500',
};

function playAlarm() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch { /* audio not available */ }
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [msgUnread, setMsgUnread] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [alarm, setAlarm] = useState(false);
  const prevUnread = useRef(0);

  const loadNotifications = async (page = 1) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, total, unread } = await getNotifications(user.id, page, 50, filter === 'unread');
      setNotifications(data);
      setPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
      if (unread > prevUnread.current && prevUnread.current > 0) {
        setAlarm(true);
        playAlarm();
        setTimeout(() => setAlarm(false), 2000);
      }
      prevUnread.current = unread;
      setUnreadCount(unread);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotifications(); }, [filter]);

  useEffect(() => {
    if (!user?.id) return;
    const poll = async () => {
      try {
        const [nu, mu] = await Promise.all([
          getUnreadNotifCount(user.id),
          getUnreadMessageCount(user.id),
        ]);
        if (nu > prevUnread.current && prevUnread.current > 0) {
          setAlarm(true);
          playAlarm();
          setTimeout(() => setAlarm(false), 2000);
        }
        prevUnread.current = nu;
        setUnreadCount(nu);
        setMsgUnread(mu);
      } catch { /* ignore */ }
    };
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    loadNotifications(pagination.page);
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllAsRead(user.id);
    loadNotifications(pagination.page);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notification?')) return;
    await deleteNotification(id);
    loadNotifications(pagination.page);
  };

  const handleClearAll = async () => {
    if (!user || !confirm('Clear all notifications?')) return;
    await clearAllNotifications(user.id);
    loadNotifications(pagination.page);
  };

  const timeAgo = (ts: any) => {
    const diff = Date.now() - new Date(ts.seconds ? ts.seconds * 1000 : ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Bell size={14} className="text-[#008751]" />
            <span>Collaboration</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Notifications</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Notification Center
            {alarm && <span className="inline-block ml-2 w-3 h-3 bg-red-500 rounded-full animate-ping" />}
            {msgUnread > 0 && (
              <span className="inline-flex items-center ml-3 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                <MessageSquare size={12} className="mr-1" />{msgUnread} unread messages
              </span>
            )}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Stay updated on activities and requests</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')} className="btn-secondary">
            {filter === 'all' ? <BellOff size={16} /> : <Bell size={16} />}
            {filter === 'all' ? 'Show Unread' : 'Show All'}
          </button>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn-primary">
              <CheckCheck size={16} /> Mark All Read
            </button>
          )}
          {pagination.total > 0 && (
            <button onClick={handleClearAll} className="btn-danger">
              <Trash2 size={16} /> Clear All
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><Bell size={20} className="text-[#008751]" /></div>
          <div><p className="text-2xl font-bold text-slate-900">{pagination.total}</p><p className="text-xs text-slate-500">Total</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Bell size={20} className="text-amber-600" /></div>
          <div><p className="text-2xl font-bold text-amber-600">{unreadCount}</p><p className="text-xs text-slate-500">Unread</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><CheckCheck size={20} className="text-blue-600" /></div>
          <div><p className="text-2xl font-bold text-blue-600">{pagination.total - unreadCount}</p><p className="text-xs text-slate-500">Read</p></div>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No notifications found.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map(n => {
                const Icon = TYPE_ICONS[n.type] || Bell;
                const color = TYPE_COLORS[n.type] || 'text-slate-500';
                return (
                  <div key={n.id} className={`flex items-start gap-3 px-4 py-3 transition-colors ${!n.read ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${!n.read ? 'bg-white' : 'bg-slate-100'}`}>
                      <Icon size={16} className={color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{n.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!n.read && (
                        <button onClick={() => handleMarkRead(n.id)} className="btn btn-xs btn-secondary p-1.5" title="Mark as read">
                          <CheckCheck size={13} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(n.id)} className="btn btn-xs btn-danger p-1.5" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={loadNotifications} />
      </div>
    </div>
  );
}
