import { addDocument, getDocsPaginated, updateDocument, deleteDocument, getDocById, getDocsAll } from './firestore';
import { getHospitalAdmins } from './users';
import type { Task, TaskComment } from '../types';

export const getTasks = async (
  page = 1, limit = 50, search?: string,
  assignedTo?: string, status?: string, priority?: string,
  hospitalScope?: string,
): Promise<{ data: Task[]; total: number }> => {
  const filters: any[] = [];
  if (assignedTo) filters.push({ field: 'assigned_to', op: '==', value: assignedTo });
  if (status) filters.push({ field: 'status', op: '==', value: status });
  if (priority) filters.push({ field: 'priority', op: '==', value: priority });
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });

  if (search) {
    const { data } = await getDocsPaginated('tasks', filters, { field: 'created_at', dir: 'desc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((t: any) =>
      t.title?.toLowerCase().includes(searchLower) ||
      t.description?.toLowerCase().includes(searchLower) ||
      t.assigned_to_name?.toLowerCase().includes(searchLower)
    );
    return { data: filtered, total: filtered.length };
  }

  return getDocsPaginated('tasks', filters, { field: 'created_at', dir: 'desc' }, limit, page);
};

export const getTask = async (id: string): Promise<Task | null> => {
  return getDocById('tasks', id);
};

export const createTask = async (data: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  const id = await addDocument('tasks', { ...data, status: 'pending' });
  try {
    const admins = await getHospitalAdmins(data.hospital_id || undefined);
    for (const admin of admins) {
      await addDocument('notifications', {
        user_id: admin.id,
        type: 'task_assigned',
        title: 'New Task for Your Hospital',
        message: `A new task has been assigned: "${data.title}"`,
        link: '/tasks',
        read: false,
        created_at: new Date().toISOString(),
      });
    }
  } catch { /* notification is optional */ }
  return id;
};

export const updateTask = async (id: string, data: Partial<Task>): Promise<void> => {
  const payload: any = { ...data };
  if (data.status === 'completed') {
    payload.completed_at = new Date().toISOString();
    try {
      const task: Task | null = await getDocById('tasks', id);
      if (task) {
        if (task.assigned_by) {
          await addDocument('notifications', {
            user_id: task.assigned_by,
            type: 'task_completed',
            title: 'Task Completed',
            message: `Task "${task.title}" was marked as completed`,
            link: '/tasks',
            read: false,
            created_at: new Date().toISOString(),
          });
        }
        const admins = await getHospitalAdmins(task.hospital_id || undefined);
        for (const admin of admins) {
          await addDocument('notifications', {
            user_id: admin.id,
            type: 'task_completed',
            title: 'Task Completed',
            message: `Task "${task.title}" was marked as completed`,
            link: '/tasks',
            read: false,
            created_at: new Date().toISOString(),
          });
        }
      }
    } catch { /* notification is optional */ }
  }
  await updateDocument('tasks', id, payload);
};

export const deleteTask = async (id: string): Promise<void> => {
  await deleteDocument('tasks', id);
};

export const getTaskComments = async (taskId: string): Promise<TaskComment[]> => {
  const { data } = await getDocsPaginated('task_comments', [{ field: 'task_id', op: '==', value: taskId }], { field: 'created_at', dir: 'asc' }, 200, 1);
  return data;
};

export const addTaskComment = async (data: Omit<TaskComment, 'id' | 'created_at'>): Promise<string> => {
  return addDocument('task_comments', data);
};

export const getTasksSummary = async (userId?: string, hospitalScope?: string): Promise<{ pending: number; in_progress: number; completed: number; overdue: number }> => {
  const filters: any[] = [];
  if (userId) filters.push({ field: 'assigned_to', op: '==', value: userId });
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  const all = await getDocsAll('tasks', filters.length > 0 ? filters : undefined);
  const now = new Date().toISOString();
  const items = all as Task[];
  return {
    pending: items.filter(t => t.status === 'pending').length,
    in_progress: items.filter(t => t.status === 'in_progress').length,
    completed: items.filter(t => t.status === 'completed').length,
    overdue: items.filter(t => t.status !== 'completed' && t.due_date && t.due_date < now).length,
  };
};
