import { addDocument, getDocsPaginated, updateDocument, deleteDocument, getDocById, getDocsAll } from './firestore';
import type { Workflow, WorkflowStep, WorkflowHistory } from '../types';

export const getWorkflows = async (
  page = 1, limit = 50, search?: string,
  status?: string, initiatorId?: string, hospitalScope?: string,
): Promise<{ data: Workflow[]; total: number }> => {
  const filters: any[] = [];
  if (status) filters.push({ field: 'status', op: '==', value: status });
  if (initiatorId) filters.push({ field: 'initiator_id', op: '==', value: initiatorId });
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });

  if (search) {
    const { data } = await getDocsPaginated('workflows', filters, { field: 'created_at', dir: 'desc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((w: any) =>
      w.name?.toLowerCase().includes(searchLower) ||
      w.initiator_name?.toLowerCase().includes(searchLower) ||
      w.entity_type?.toLowerCase().includes(searchLower)
    );
    return { data: filtered, total: filtered.length };
  }

  return getDocsPaginated('workflows', filters, { field: 'created_at', dir: 'desc' }, limit, page);
};

export const getWorkflow = async (id: string): Promise<Workflow | null> => {
  return getDocById('workflows', id);
};

export const createWorkflow = async (data: Omit<Workflow, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  return addDocument('workflows', { ...data, status: 'draft', current_step: 0 });
};

export const updateWorkflow = async (id: string, data: Partial<Workflow>): Promise<void> => {
  if (data.status === 'completed') data.completed_at = new Date().toISOString();
  await updateDocument('workflows', id, data);
};

export const deleteWorkflow = async (id: string): Promise<void> => {
  await deleteDocument('workflows', id);
};

export const getWorkflowSteps = async (workflowId: string): Promise<WorkflowStep[]> => {
  const { data } = await getDocsPaginated('workflow_steps', [{ field: 'workflow_id', op: '==', value: workflowId }], { field: 'step_number', dir: 'asc' }, 100, 1);
  return data;
};

export const createWorkflowStep = async (data: Omit<WorkflowStep, 'id' | 'created_at'>): Promise<string> => {
  return addDocument('workflow_steps', data);
};

export const updateWorkflowStep = async (id: string, data: Partial<WorkflowStep>): Promise<void> => {
  if (data.status === 'approved' || data.status === 'rejected' || data.status === 'returned') {
    data.completed_at = new Date().toISOString();
  }
  await updateDocument('workflow_steps', id, data);
};

export const getWorkflowHistory = async (workflowId: string): Promise<WorkflowHistory[]> => {
  const { data } = await getDocsPaginated('workflow_history', [{ field: 'workflow_id', op: '==', value: workflowId }], { field: 'created_at', dir: 'asc' }, 200, 1);
  return data;
};

export const addWorkflowHistory = async (data: Omit<WorkflowHistory, 'id' | 'created_at'>): Promise<string> => {
  return addDocument('workflow_history', data);
};

export const submitWorkflow = async (id: string): Promise<void> => {
  await updateDocument('workflows', id, { status: 'active', started_at: new Date().toISOString() });
};

export const getWorkflowsSummary = async (hospitalScope?: string): Promise<{ draft: number; active: number; completed: number; cancelled: number }> => {
  const filters: any[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  const all = await getDocsAll('workflows', filters.length > 0 ? filters : undefined);
  const items = all as Workflow[];
  return {
    draft: items.filter(w => w.status === 'draft').length,
    active: items.filter(w => w.status === 'active').length,
    completed: items.filter(w => w.status === 'completed').length,
    cancelled: items.filter(w => w.status === 'cancelled').length,
  };
};
