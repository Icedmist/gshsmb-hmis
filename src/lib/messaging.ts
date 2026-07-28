import { addDocument, getDocsPaginated, updateDocument, deleteDocument, getDocById } from './firestore';
import type { FilterConstraint } from './firestore';
import type { Message, MessageThread, Announcement } from '../types';

export const getThreads = async (
  userId: string, page = 1, limit = 50, hospitalScope?: string,
): Promise<{ data: MessageThread[]; total: number }> => {
  const filters: FilterConstraint[] = [{ field: 'participants', op: 'array-contains', value: userId }];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  return getDocsPaginated('message_threads', filters, { field: 'last_message_at', dir: 'desc' }, limit, page);
};

export const getThread = async (id: string): Promise<MessageThread | null> => {
  return getDocById('message_threads', id);
};

export const createThread = async (data: Omit<MessageThread, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  const id = await addDocument('message_threads', { ...data, is_broadcast: false, last_message_at: new Date().toISOString() });
  try {
    for (const pid of data.participants) {
      if (pid !== data.last_message_by) {
        await addDocument('notifications', {
          user_id: pid,
          type: 'message_received',
          title: 'New Message Thread',
          message: `You have been added to thread: "${data.subject}"`,
          link: '/messages',
          read: false,
          created_at: new Date().toISOString(),
        });
      }
    }
  } catch { /* notification is optional */ }
  return id;
};

export const getMessages = async (threadId: string): Promise<Message[]> => {
  const { data } = await getDocsPaginated('messages', [{ field: 'thread_id', op: '==', value: threadId }], { field: 'created_at', dir: 'asc' as const }, 500, 1);
  return data;
};

export const sendMessage = async (data: Omit<Message, 'id' | 'created_at'>): Promise<string> => {
  const msgId = await addDocument('messages', { ...data, read_by: [data.sender_id] });
  await updateDocument('message_threads', data.thread_id, {
    last_message: data.content.substring(0, 100),
    last_message_at: new Date().toISOString(),
    last_message_by: data.sender_id,
  });
  try {
    const thread: MessageThread | null = await getDocById('message_threads', data.thread_id);
    if (thread) {
      for (const pid of thread.participants) {
        if (pid !== data.sender_id) {
          await addDocument('notifications', {
            user_id: pid,
            type: 'message_received',
            title: 'New Message',
            message: data.content.substring(0, 100),
            link: '/messages',
            read: false,
            created_at: new Date().toISOString(),
          });
        }
      }
    }
  } catch { /* notification is optional */ }
  return msgId;
};

export const markThreadAsRead = async (threadId: string, userId: string): Promise<void> => {
  const thread: MessageThread | null = await getDocById('message_threads', threadId);
  if (thread && !thread.participants.includes(userId)) return;
  const { data: unread } = await getDocsPaginated('messages', [
    { field: 'thread_id', op: '==', value: threadId },
  ], { field: 'created_at', dir: 'asc' }, 500, 1);
  for (const msg of unread) {
    if (!msg.read_by.includes(userId)) {
      const read_by = [...msg.read_by, userId];
      await updateDocument('messages', msg.id, { read_by });
    }
  }
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  const { data: threads } = await getDocsPaginated('message_threads', [{ field: 'participants', op: 'array-contains', value: userId }], undefined, 100, 1);
  let total = 0;
  for (const t of threads) {
    const { data: msgs } = await getDocsPaginated('messages', [{ field: 'thread_id', op: '==', value: t.id }], undefined, 500, 1);
    for (const m of msgs) {
      if (!m.read_by.includes(userId)) total++;
    }
  }
  return total;
};

export const getAnnouncements = async (page = 1, limit = 50): Promise<{ data: Announcement[]; total: number }> => {
  return getDocsPaginated('announcements', [], { field: 'created_at', dir: 'desc' as const }, limit, page);
};

export const createAnnouncement = async (data: Omit<Announcement, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  return addDocument('announcements', data);
};

export const updateAnnouncement = async (id: string, data: Partial<Announcement>): Promise<void> => {
  await updateDocument('announcements', id, data);
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  await deleteDocument('announcements', id);
};

export const getUnreadMessageCount = async (userId: string): Promise<number> => {
  const { data: threads } = await getDocsPaginated('message_threads', [{ field: 'participants', op: 'array-contains', value: userId }], undefined, 100, 1);
  let count = 0;
  for (const t of threads) {
    const { data: msgs } = await getDocsPaginated('messages', [{ field: 'thread_id', op: '==', value: t.id }], undefined, 500, 1);
    count += msgs.filter((m: any) => !m.read_by.includes(userId)).length;
  }
  return count;
};
