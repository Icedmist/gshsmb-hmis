import { addDocument, getDocsPaginated, updateDocument, deleteDocument, getDocById, getDocsAll } from './firestore';
import type { Approval, ApprovalComment } from '../types';

export const getApprovals = async (
  page = 1, limit = 50, search?: string,
  reviewerId?: string, requesterId?: string,
  status?: string, entityType?: string,
  hospitalScope?: string,
): Promise<{ data: Approval[]; total: number }> => {
  const filters: any[] = [];
  if (reviewerId) filters.push({ field: 'reviewer_id', op: '==', value: reviewerId });
  if (requesterId) filters.push({ field: 'requester_id', op: '==', value: requesterId });
  if (status) filters.push({ field: 'status', op: '==', value: status });
  if (entityType) filters.push({ field: 'entity_type', op: '==', value: entityType });
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });

  if (search) {
    const { data } = await getDocsPaginated('approvals', filters, { field: 'created_at', dir: 'desc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((a: any) =>
      a.entity_title?.toLowerCase().includes(searchLower) ||
      a.requester_name?.toLowerCase().includes(searchLower) ||
      a.entity_type?.toLowerCase().includes(searchLower)
    );
    return { data: filtered, total: filtered.length };
  }

  return getDocsPaginated('approvals', filters, { field: 'created_at', dir: 'desc' }, limit, page);
};

export const getApproval = async (id: string): Promise<Approval | null> => {
  return getDocById('approvals', id);
};

export const createApproval = async (data: Omit<Approval, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  return addDocument('approvals', { ...data, status: 'pending', submitted_at: new Date().toISOString() });
};

export const updateApproval = async (id: string, data: Partial<Approval>): Promise<void> => {
  if (data.status && data.status !== 'pending') data.decided_at = new Date().toISOString();
  await updateDocument('approvals', id, data);
};

export const deleteApproval = async (id: string): Promise<void> => {
  await deleteDocument('approvals', id);
};

export const getApprovalComments = async (approvalId: string): Promise<ApprovalComment[]> => {
  const { data } = await getDocsPaginated('approval_comments', [{ field: 'approval_id', op: '==', value: approvalId }], { field: 'created_at', dir: 'asc' }, 200, 1);
  return data;
};

export const addApprovalComment = async (data: Omit<ApprovalComment, 'id' | 'created_at'>): Promise<string> => {
  return addDocument('approval_comments', data);
};

export const approveRequest = async (id: string, reviewerId: string, comment?: string): Promise<void> => {
  await updateDocument('approvals', id, { status: 'approved', reviewer_id: reviewerId, decided_at: new Date().toISOString() });
  if (comment) {
    await addDocument('approval_comments', { approval_id: id, user_id: reviewerId, comment, decision: 'approved', created_at: new Date().toISOString() });
  }
};

export const rejectRequest = async (id: string, reviewerId: string, comment?: string): Promise<void> => {
  await updateDocument('approvals', id, { status: 'rejected', reviewer_id: reviewerId, decided_at: new Date().toISOString() });
  if (comment) {
    await addDocument('approval_comments', { approval_id: id, user_id: reviewerId, comment, decision: 'rejected', created_at: new Date().toISOString() });
  }
};

export const returnRequest = async (id: string, reviewerId: string, comment?: string): Promise<void> => {
  await updateDocument('approvals', id, { status: 'returned', reviewer_id: reviewerId, decided_at: new Date().toISOString() });
  if (comment) {
    await addDocument('approval_comments', { approval_id: id, user_id: reviewerId, comment, decision: 'returned', created_at: new Date().toISOString() });
  }
};

export const getApprovalsSummary = async (userId?: string, hospitalScope?: string): Promise<{ pending: number; approved: number; rejected: number; returned: number }> => {
  const filters: any[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  const all = await getDocsAll('approvals', filters.length > 0 ? filters : undefined);
  const items = all as Approval[];
  const myPending = userId ? items.filter(a => a.reviewer_id === userId && a.status === 'pending').length : items.filter(a => a.status === 'pending').length;
  return {
    pending: myPending,
    approved: items.filter(a => a.status === 'approved').length,
    rejected: items.filter(a => a.status === 'rejected').length,
    returned: items.filter(a => a.status === 'returned').length,
  };
};
