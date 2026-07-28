import { useState, useEffect, useRef } from 'react';
import { Search, Send, MessageSquare, Users, Megaphone, Trash2, Mail, MailOpen, Flag, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getThreads, createThread, getMessages, sendMessage, markThreadAsRead, getAnnouncements, createAnnouncement, deleteAnnouncement } from '../lib/messaging';
import { getAllHospitals } from '../lib/hospitals';
import { getHospitalScope } from '../lib/scope';
import { getHospitalAdmins, getExecutiveAdmins } from '../lib/users';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import type { MessageThread, Message, Announcement } from '../types';
import type { Pagination as PaginationType } from '../types';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600 border-slate-200',
  normal: 'bg-blue-50 text-blue-600 border-blue-200',
  high: 'bg-orange-50 text-orange-600 border-orange-200',
  urgent: 'bg-red-50 text-red-600 border-red-200',
};

type Tab = 'messages' | 'announcements';

export default function MessagesPage() {
  const { user, hasRole } = useAuth();
  const isSuperAdmin = hasRole('super_admin');
  const [tab, setTab] = useState<Tab>('messages');

  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [threadPagination, setThreadPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [threadSearch, setThreadSearch] = useState('');
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [hospitals, setHospitals] = useState<{ id: string; hospital_name: string }[]>([]);
  const [showMessageHospital, setShowMessageHospital] = useState(false);
  const [hospitalMsgForm, setHospitalMsgForm] = useState({ hospital_id: '', subject: '', content: '' });
  const [showContactAdmin, setShowContactAdmin] = useState(false);
  const [contactAdminForm, setContactAdminForm] = useState({ subject: '', content: '' });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadThreads = async (page = 1) => {
    if (!user) return;
    setThreadsLoading(true);
    try {
      const scope = getHospitalScope(user);
      const { data, total } = await getThreads(user.id, page, 50, scope);
      setThreads(data);
      setThreadPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally {
      setThreadsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'messages') loadThreads();
    const interval = setInterval(() => { if (tab === 'messages') loadThreads(); }, 15000);
    return () => clearInterval(interval);
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, user, loadThreads]);

  useEffect(() => {
    (async () => {
      try { const d = await getAllHospitals(); setHospitals((d || []).map(h => ({ id: h.id, hospital_name: h.hospital_name }))); } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!user || threads.length === 0) { setUnreadCounts({}); return; }
    const compute = async () => {
      const counts: Record<string, number> = {};
      const results = await Promise.allSettled(
        threads.map(t => getMessages(t.id).then(msgs => ({ threadId: t.id, msgs })))
      );
      for (const r of results) {
        if (r.status === 'fulfilled') {
          counts[r.value.threadId] = r.value.msgs.filter(m => !m.read_by.includes(user.id)).length;
        }
      }
      setUnreadCounts(counts);
    };
    compute();
  }, [threads, user]);

  const openThread = async (thread: MessageThread) => {
    setSelectedThread(thread);
    setMessagesLoading(true);
    try {
      const data = await getMessages(thread.id);
      setMessages(data || []);
      await markThreadAsRead(thread.id, user?.id || '');
      setUnreadCounts(prev => ({ ...prev, [thread.id]: 0 }));
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread || !user) return;
    try {
      await sendMessage({
        thread_id: selectedThread.id,
        sender_id: user.id,
        sender_name: user.full_name,
        sender_hospital_id: user.hospital_id || undefined,
        sender_hospital_name: hospitals.find(h => h.id === user.hospital_id)?.hospital_name,
        content: newMessage.trim(),
        read_by: [user.id],
      });
      setNewMessage('');
      const data = await getMessages(selectedThread.id);
      setMessages(data || []);
      loadThreads(threadPagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleMessageHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalMsgForm.hospital_id || !hospitalMsgForm.subject || !hospitalMsgForm.content || !user) return;
    try {
      const admins = await getHospitalAdmins(hospitalMsgForm.hospital_id);
      const participantIds = [user.id, ...admins.map(a => a.id)];
      const participantNames = [user.full_name || 'Me', ...admins.map(a => a.full_name)];
      const hospital = hospitals.find(h => h.id === hospitalMsgForm.hospital_id);
      const threadId = await createThread({
        subject: `[${hospital?.hospital_name || 'Hospital'}] ${hospitalMsgForm.subject}`,
        participants: participantIds,
        participant_names: participantNames,
        hospital_id: hospitalMsgForm.hospital_id,
        is_broadcast: false,
        last_message: hospitalMsgForm.content.substring(0, 100),
        last_message_at: null,
        last_message_by: user.id,
      });
      await sendMessage({
        thread_id: threadId,
        sender_id: user.id,
        sender_name: user.full_name,
        sender_hospital_id: user.hospital_id || undefined,
        sender_hospital_name: hospitals.find(h => h.id === user.hospital_id)?.hospital_name,
        content: hospitalMsgForm.content.trim(),
        read_by: [user.id],
      });
      setShowMessageHospital(false);
      setHospitalMsgForm({ hospital_id: '', subject: '', content: '' });
      loadThreads(threadPagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleContactAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactAdminForm.subject || !contactAdminForm.content || !user) return;
    try {
      const admins = await getExecutiveAdmins();
      const participantIds = [user.id, ...admins.map(a => a.id)];
      const participantNames = [user.full_name || 'Me', ...admins.map(a => a.full_name)];
      const threadId = await createThread({
        subject: contactAdminForm.subject,
        participants: participantIds,
        participant_names: participantNames,
        hospital_id: user.hospital_id || '',
        is_broadcast: false,
        last_message: contactAdminForm.content.substring(0, 100),
        last_message_at: null,
        last_message_by: user.id,
      });
      await sendMessage({
        thread_id: threadId,
        sender_id: user.id,
        sender_name: user.full_name,
        sender_hospital_id: user.hospital_id || undefined,
        sender_hospital_name: hospitals.find(h => h.id === user.hospital_id)?.hospital_name,
        content: contactAdminForm.content.trim(),
        read_by: [user.id],
      });
      setShowContactAdmin(false);
      setContactAdminForm({ subject: '', content: '' });
      loadThreads(threadPagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annPagination, setAnnPagination] = useState<PaginationType>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [annLoading, setAnnLoading] = useState(true);
  const [showCreateAnn, setShowCreateAnn] = useState(false);
  const [annForm, setAnnForm] = useState({ title: '', content: '', priority: 'normal' as Announcement['priority'] });

  const loadAnnouncements = async (page = 1) => {
    setAnnLoading(true);
    try {
      const { data, total } = await getAnnouncements(page, 50);
      setAnnouncements(data);
      setAnnPagination({ page, limit: 50, total, totalPages: Math.ceil(total / 50) });
    } finally {
      setAnnLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'announcements') loadAnnouncements();
  }, [tab]);

  const handleCreateAnn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annForm.title || !annForm.content || !user) return;
    try {
      await createAnnouncement({
        title: annForm.title,
        content: annForm.content,
        priority: annForm.priority,
        created_by: user.id,
        created_by_name: user.full_name,
        pinned: false,
      });
      setShowCreateAnn(false);
      setAnnForm({ title: '', content: '', priority: 'normal' });
      loadAnnouncements(annPagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteAnn = async (item: Announcement) => {
    if (!confirm(`Delete announcement "${item.title}"?`)) return;
    try {
      await deleteAnnouncement(item.id);
      loadAnnouncements(annPagination.page);
    } catch (err: any) { alert(err.message); }
  };

  const formatDate = (d: any) => d?.toDate?.()?.toLocaleDateString() || d || '-';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <MessageSquare size={14} className="text-[#008751]" />
            <span>Communication</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Messages</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-500 mt-1 text-sm">Internal messaging and announcements</p>
        </div>
        {tab === 'messages' && (
          <div className="flex gap-2">
            <button onClick={async () => {
              try { const d = await getAllHospitals(); setHospitals((d || []).map(h => ({ id: h.id, hospital_name: h.hospital_name }))); } catch {}
              setHospitalMsgForm({ hospital_id: '', subject: '', content: '' });
              setShowMessageHospital(true);
            }} className="btn-secondary"><Building2 size={16} /> Message a Hospital</button>
            {!isSuperAdmin && (
              <button onClick={() => { setContactAdminForm({ subject: '', content: '' }); setShowContactAdmin(true); }} className="btn-secondary"><Users size={16} /> Contact Admin</button>
            )}
          </div>
        )}
        {tab === 'announcements' && isSuperAdmin && (
          <button onClick={() => { setShowCreateAnn(true); setAnnForm({ title: '', content: '', priority: 'normal' }); }} className="btn-primary"><Megaphone size={18} /> New Announcement</button>
        )}
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('messages')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'messages' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <MessageSquare size={16} />
          Messages
        </button>
        <button
          onClick={() => setTab('announcements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'announcements' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Megaphone size={16} />
          Announcements
        </button>
      </div>

      {tab === 'messages' && (
        <div className="flex gap-6">
          <div className="w-80 shrink-0">
            <div className="card">
              <div className="p-3 border-b border-slate-100">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="input pl-9 text-sm"
                    placeholder="Search threads..."
                    value={threadSearch}
                    onChange={e => setThreadSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
                {threadsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-6 h-6 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : threads.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare size={36} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 text-xs">No threads yet.</p>
                  </div>
                ) : (
                  threads
                    .filter(t => !threadSearch || t.subject.toLowerCase().includes(threadSearch.toLowerCase()))
                    .map(t => {
                      const unread = unreadCounts[t.id] || 0;
                      const isSelected = selectedThread?.id === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => openThread(t)}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                            isSelected ? 'bg-emerald-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {unread > 0 ? (
                                  <Mail size={14} className="text-[#008751] shrink-0" />
                                ) : (
                                  <MailOpen size={14} className="text-slate-400 shrink-0" />
                                )}
                                <span className={`text-sm truncate ${unread > 0 ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                                  {t.subject}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 truncate mt-1 ml-6">
                                {t.last_message || 'No messages yet'}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className="text-[10px] text-slate-400">{t.last_message_at ? formatDate(t.last_message_at) : ''}</span>
                              {unread > 0 && (
                                <span className="bg-[#008751] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                  {unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                )}
              </div>
              <Pagination page={threadPagination.page} totalPages={threadPagination.totalPages} onPageChange={loadThreads} />
            </div>
          </div>

          <div className="flex-1">
            {selectedThread ? (
              <div className="card flex flex-col h-[600px]">
                <div className="px-6 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-[#008751]" />
                    <h3 className="text-sm font-semibold text-slate-900">{selectedThread.subject}</h3>
                  </div>
                  {selectedThread.participant_names && selectedThread.participant_names.length > 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedThread.participant_names.join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {messagesLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-6 h-6 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare size={36} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500 text-xs">No messages yet. Start the conversation.</p>
                    </div>
                  ) : (
                    messages.map(m => {
                      const isMine = m.sender_id === user?.id;
                      return (
                        <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${isMine ? 'order-1' : 'order-1'}`}>
                            <div className={`px-4 py-2.5 rounded-2xl ${
                              isMine
                                ? 'bg-[#008751] text-white rounded-br-sm'
                                : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                            }`}>
                              {!isMine && m.sender_name && (
                                <p className="text-[11px] font-medium opacity-70 mb-1">
                                  {m.sender_name}
                                  {m.sender_hospital_name && <span className="opacity-60"> · {m.sender_hospital_name}</span>}
                                </p>
                              )}
                              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                            </div>
                            <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-[10px] text-slate-400">{formatDate(m.created_at)}</span>
                              {isMine && (
                                m.read_by.length > 1 ? (
                                  <MailOpen size={10} className="text-emerald-500" />
                                ) : (
                                  <MailOpen size={10} className="text-slate-300" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="px-6 py-4 border-t border-slate-100">
                  <form onSubmit={handleSend} className="flex gap-3">
                    <input
                      className="input flex-1"
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="btn-primary disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="card flex flex-col items-center justify-center h-[600px]">
                <MessageSquare size={48} className="text-slate-200 mb-4" />
                <p className="text-slate-400 text-sm">Select a thread to view messages</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'announcements' && (
        <div className="card">
          <div className="overflow-x-auto">
            {annLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-12">
                <Megaphone size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">No announcements yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {announcements.map(a => (
                  <div key={a.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_COLORS[a.priority] || PRIORITY_COLORS.normal}`}>
                            <Flag size={10} />
                            {a.priority}
                          </span>
                          <span className="text-sm font-semibold text-slate-900">{a.title}</span>
                        </div>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{a.content}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                          <span>By {a.created_by_name || 'Unknown'}</span>
                          <span>{formatDate(a.created_at)}</span>
                          {a.pinned && <span className="text-amber-600 font-medium">Pinned</span>}
                        </div>
                      </div>
                      {isSuperAdmin && (
                        <button
                          onClick={() => handleDeleteAnn(a)}
                          className="btn btn-sm btn-danger shrink-0 ml-4"
                          title="Delete"
                        ><Trash2 size={14} /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Pagination page={annPagination.page} totalPages={annPagination.totalPages} onPageChange={loadAnnouncements} />
        </div>
      )}

      <Modal open={showCreateAnn} onClose={() => setShowCreateAnn(false)} title="New Announcement" size="md">
        <form onSubmit={handleCreateAnn} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" value={annForm.title} onChange={e => setAnnForm({ ...annForm, title: e.target.value })} required />
          </div>
          <div>
            <label className="label">Content</label>
            <textarea className="input" rows={4} value={annForm.content} onChange={e => setAnnForm({ ...annForm, content: e.target.value })} required />
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={annForm.priority} onChange={e => setAnnForm({ ...annForm, priority: e.target.value as Announcement['priority'] })}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowCreateAnn(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Post Announcement</button>
          </div>
        </form>
      </Modal>

      <Modal open={showMessageHospital} onClose={() => setShowMessageHospital(false)} title="Message a Hospital" size="md">
        <form onSubmit={handleMessageHospital} className="space-y-4">
          <div>
            <label className="label">Hospital</label>
            <select className="input" value={hospitalMsgForm.hospital_id} onChange={e => setHospitalMsgForm({ ...hospitalMsgForm, hospital_id: e.target.value })} required>
              <option value="">Select hospital...</option>
              {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Subject</label>
            <input className="input" value={hospitalMsgForm.subject} onChange={e => setHospitalMsgForm({ ...hospitalMsgForm, subject: e.target.value })} required />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea className="input" rows={4} value={hospitalMsgForm.content} onChange={e => setHospitalMsgForm({ ...hospitalMsgForm, content: e.target.value })} required />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowMessageHospital(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Send to Hospital</button>
          </div>
        </form>
      </Modal>

      <Modal open={showContactAdmin} onClose={() => setShowContactAdmin(false)} title="Contact Administration" size="md">
        <form onSubmit={handleContactAdmin} className="space-y-4">
          <div>
            <label className="label">Subject</label>
            <input className="input" value={contactAdminForm.subject} onChange={e => setContactAdminForm({ ...contactAdminForm, subject: e.target.value })} required />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea className="input" rows={4} value={contactAdminForm.content} onChange={e => setContactAdminForm({ ...contactAdminForm, content: e.target.value })} required />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowContactAdmin(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Send</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
