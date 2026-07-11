import { getDocsPaginated, addDocument, type FilterConstraint, type PaginationResult } from './firestore';
import { getDocById } from './firestore';
import type { AuditLog } from '../types';

export const getAuditLogs = async (
  page: number = 1,
  limit: number = 50,
  action?: string,
  userId?: string,
): Promise<PaginationResult<AuditLog>> => {
  const filters: FilterConstraint[] = [];
  if (action) filters.push({ field: 'action', op: '==', value: action });
  if (userId) filters.push({ field: 'user_id', op: '==', value: userId });

  const result = await getDocsPaginated('auditLogs', filters, { field: 'created_at', dir: 'desc' }, limit, page);

  const enriched = await Promise.all(
    result.data.map(async (log: any) => {
      let user_name = 'Unknown';
      if (log.user_id) {
        const user = await getDocById('users', log.user_id);
        if (user) user_name = user.full_name;
      }
      return { ...log, user_name };
    })
  );

  return { data: enriched, total: result.total };
};

export const logAudit = async (
  userId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  details: string,
): Promise<void> => {
  try {
    await addDocument('auditLogs', {
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      ip_address: 'client',
    });
  } catch (error: any) {
    console.error('Audit log error:', error?.message || error);
  }
};
