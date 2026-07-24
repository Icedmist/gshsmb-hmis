import { addDocument, getDocsPaginated, updateDocument, deleteDocument, getDocById, getDocsAll } from './firestore';
import type { CalendarEvent } from '../types';

export const getEvents = async (
  page = 1, limit = 50, eventType?: string,
  startDate?: string, endDate?: string,
  hospitalScope?: string,
): Promise<{ data: CalendarEvent[]; total: number }> => {
  const filters: any[] = [];
  if (eventType) filters.push({ field: 'event_type', op: '==', value: eventType });
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  if (startDate) filters.push({ field: 'start_date', op: '>=', value: startDate });

  return getDocsPaginated('calendar_events', filters, { field: 'start_date', dir: 'asc' }, limit, page);
};

export const getAllEvents = async (filters?: any[]): Promise<CalendarEvent[]> => {
  const all = await getDocsAll('calendar_events', filters);
  return all as CalendarEvent[];
};

export const getEvent = async (id: string): Promise<CalendarEvent | null> => {
  return getDocById('calendar_events', id);
};

export const createEvent = async (data: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  return addDocument('calendar_events', data);
};

export const updateEvent = async (id: string, data: Partial<CalendarEvent>): Promise<void> => {
  await updateDocument('calendar_events', id, data);
};

export const deleteEvent = async (id: string): Promise<void> => {
  await deleteDocument('calendar_events', id);
};

export const getUpcomingEvents = async (days = 30, hospitalScope?: string): Promise<CalendarEvent[]> => {
  const filters: any[] = [{ field: 'start_date', op: '>=', value: new Date().toISOString() }];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  const all = await getDocsAll('calendar_events', filters);
  const events = all as CalendarEvent[];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  return events.filter(e => new Date(e.start_date) <= cutoff).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
};
