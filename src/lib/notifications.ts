import { addDocument, getDocsPaginated, updateDocument, deleteDocument, subscribeToDocs } from './firestore';
import type { FilterConstraint } from './firestore';
import type { Notification, NotificationSetting } from '../types';

export const getNotifications = async (userId: string, page = 1, limit = 50, unreadOnly = false): Promise<{ data: Notification[]; total: number; unread: number }> => {
  const filters: FilterConstraint[] = [{ field: 'user_id', op: '==', value: userId }];
  if (unreadOnly) filters.push({ field: 'read', op: '==' as const, value: false });
  const result = await getDocsPaginated('notifications', filters, { field: 'created_at', dir: 'desc' as const }, limit, page);
  const unreadResult = await getDocsPaginated('notifications', [{ field: 'user_id', op: '==' as const, value: userId }, { field: 'read', op: '==' as const, value: false }], undefined, 1000, 1);
  return { data: result.data, total: result.total, unread: unreadResult.total };
};

export const createNotification = async (data: Omit<Notification, 'id' | 'created_at'>): Promise<string> => {
  return addDocument('notifications', data);
};

export const markAsRead = async (id: string): Promise<void> => {
  await updateDocument('notifications', id, { read: true });
};

export const markAllAsRead = async (userId: string): Promise<void> => {
  const { data } = await getDocsPaginated('notifications', [{ field: 'user_id', op: '==' as const, value: userId }, { field: 'read', op: '==' as const, value: false }], undefined, 500, 1);
  for (const n of data) {
    await updateDocument('notifications', n.id, { read: true });
  }
};

export const deleteNotification = async (id: string): Promise<void> => {
  await deleteDocument('notifications', id);
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  const { total } = await getDocsPaginated('notifications', [
    { field: 'user_id', op: '==' as const, value: userId },
    { field: 'read', op: '==' as const, value: false },
  ], undefined, 1, 1);
  return total;
};

export const clearAllNotifications = async (userId: string): Promise<void> => {
  const { data } = await getDocsPaginated('notifications', [
    { field: 'user_id', op: '==' as const, value: userId },
  ], undefined, 500, 1);
  for (const n of data) {
    await deleteDocument('notifications', n.id);
  }
};

export const getNotificationSettings = async (userId: string): Promise<NotificationSetting | null> => {
  const { data } = await getDocsPaginated('notification_settings', [{ field: 'user_id', op: '==' as const, value: userId }], undefined, 1, 1);
  return data.length > 0 ? data[0] : null;
};

export const saveNotificationSettings = async (userId: string, settings: Partial<NotificationSetting>): Promise<void> => {
  const existing = await getNotificationSettings(userId);
  if (existing) {
    await updateDocument('notification_settings', existing.id, settings);
  } else {
    await addDocument('notification_settings', { user_id: userId, email_notifications: true, in_app_notifications: true, types: {}, ...settings });
  }
};

export const subscribeToNotifications = (
  userId: string,
  onUpdate: (data: { data: Notification[]; unread: number }) => void,
  unreadOnly = false
) => {
  const filters: FilterConstraint[] = [{ field: 'user_id', op: '==', value: userId }];
  if (unreadOnly) filters.push({ field: 'read', op: '==' as const, value: false });
  
  return subscribeToDocs(
    'notifications',
    filters,
    { field: 'created_at', dir: 'desc' as const },
    50,
    (docs) => {
      const unreadCount = docs.filter(n => !n.read).length;
      onUpdate({ data: docs, unread: unreadCount });
    }
  );
};
