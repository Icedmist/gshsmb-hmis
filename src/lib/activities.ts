import { addDocument, getDocsPaginated } from './firestore';
import type { OrganizationActivity } from '../types';

export const logActivity = async (data: Omit<OrganizationActivity, 'id' | 'created_at'>): Promise<string> => {
  return addDocument('organization_activity', data);
};

export const getActivities = async (
  page = 1, limit = 50,
  entityType?: string, action?: string,
  userId?: string, hospitalScope?: string,
): Promise<{ data: OrganizationActivity[]; total: number }> => {
  const filters: any[] = [];
  if (entityType) filters.push({ field: 'entity_type', op: '==', value: entityType });
  if (action) filters.push({ field: 'action', op: '==', value: action });
  if (userId) filters.push({ field: 'user_id', op: '==', value: userId });
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });

  return getDocsPaginated('organization_activity', filters, { field: 'created_at', dir: 'desc' }, limit, page);
};
