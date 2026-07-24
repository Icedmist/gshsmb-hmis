import { addDocument, getDocsPaginated, updateDocument, deleteDocument, getDocById, getDocsAll } from './firestore';
import type {
  LocumRequest, StaffingRequest, StaffNomination,
  LocumAssignment, LocumApproval, LocumHistory,
  LocumRequestStatus, StaffingRequestStatus,
} from '../types';

// ─── Locum Requests (Employee-Initiated) ───

export const getLocumRequests = async (
  page = 1, limit = 50, employeeId?: string,
  status?: string, hospitalScope?: string,
): Promise<{ data: LocumRequest[]; total: number }> => {
  const filters: any[] = [];
  if (employeeId) filters.push({ field: 'employee_id', op: '==', value: employeeId });
  if (status) filters.push({ field: 'status', op: '==', value: status });
  if (hospitalScope) filters.push({ field: 'source_hospital_id', op: '==', value: hospitalScope });
  return getDocsPaginated('locum_requests', filters, { field: 'created_at', dir: 'desc' }, limit, page);
};

export const getLocumRequest = async (id: string): Promise<LocumRequest | null> => {
  return getDocById('locum_requests', id);
};

export const createLocumRequest = async (data: Omit<LocumRequest, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  const id = await addDocument('locum_requests', { ...data, status: 'pending_hospital_admin', current_step: 'Source Hospital Admin' });
  try {
    await addDocument('notifications', {
      user_id: data.source_hospital_id,
      type: 'approval_request',
      title: 'New Locum Request',
      message: `${data.employee_name} has requested a locum to ${data.destination_hospital_name}`,
      link: '/locum-requests',
      read: false,
      created_at: new Date().toISOString(),
    });
  } catch { /* ignore */ }
  return id;
};

export const updateLocumRequest = async (id: string, data: Partial<LocumRequest>): Promise<void> => {
  await updateDocument('locum_requests', id, { ...data, updated_at: new Date().toISOString() });
};

export const cancelLocumRequest = async (id: string): Promise<void> => {
  await updateDocument('locum_requests', id, { status: 'cancelled', updated_at: new Date().toISOString() });
};

// ─── Staffing Requests (Hospital-Initiated) ───

export const getStaffingRequests = async (
  page = 1, limit = 50, hospitalId?: string,
  status?: string,
): Promise<{ data: StaffingRequest[]; total: number }> => {
  const filters: any[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  if (status) filters.push({ field: 'status', op: '==', value: status });
  return getDocsPaginated('staffing_requests', filters, { field: 'created_at', dir: 'desc' }, limit, page);
};

export const getStaffingRequest = async (id: string): Promise<StaffingRequest | null> => {
  return getDocById('staffing_requests', id);
};

export const createStaffingRequest = async (data: Omit<StaffingRequest, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  const id = await addDocument('staffing_requests', { ...data, status: 'open' });
  return id;
};

export const updateStaffingRequest = async (id: string, data: Partial<StaffingRequest>): Promise<void> => {
  await updateDocument('staffing_requests', id, { ...data, updated_at: new Date().toISOString() });
};

// ─── Staff Nominations ───

export const getNominations = async (
  staffingRequestId?: string,
  employeeId?: string,
): Promise<StaffNomination[]> => {
  const filters: any[] = [];
  if (staffingRequestId) filters.push({ field: 'staffing_request_id', op: '==', value: staffingRequestId });
  if (employeeId) filters.push({ field: 'employee_id', op: '==', value: employeeId });
  const { data } = await getDocsPaginated('staff_nominations', filters, { field: 'created_at', dir: 'desc' }, 100, 1);
  return data;
};

export const createNomination = async (data: Omit<StaffNomination, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  return addDocument('staff_nominations', { ...data, status: 'pending' });
};

export const updateNomination = async (id: string, data: Partial<StaffNomination>): Promise<void> => {
  await updateDocument('staff_nominations', id, { ...data, updated_at: new Date().toISOString() });
};

// ─── Locum Assignments ───

export const getLocumAssignments = async (
  page = 1, limit = 50, status?: string,
  hospitalScope?: string,
): Promise<{ data: LocumAssignment[]; total: number }> => {
  const filters: any[] = [];
  if (status) filters.push({ field: 'status', op: '==', value: status });
  if (hospitalScope) {
    filters.push({
      field: 'destination_hospital_id', op: '==', value: hospitalScope,
    });
  }
  return getDocsPaginated('locum_assignments', filters, { field: 'start_date', dir: 'desc' }, limit, page);
};

export const getLocumAssignment = async (id: string): Promise<LocumAssignment | null> => {
  return getDocById('locum_assignments', id);
};

export const createLocumAssignment = async (data: Omit<LocumAssignment, 'id' | 'created_at'>): Promise<string> => {
  const id = await addDocument('locum_assignments', { ...data, status: 'active' });
  return id;
};

export const updateLocumAssignment = async (id: string, data: Partial<LocumAssignment>): Promise<void> => {
  await updateDocument('locum_assignments', id, data);
};

// ─── Locum Approvals ───

export const getLocumApprovals = async (locumRequestId?: string): Promise<LocumApproval[]> => {
  const filters: any[] = [];
  if (locumRequestId) filters.push({ field: 'locum_request_id', op: '==', value: locumRequestId });
  const { data } = await getDocsPaginated('locum_approvals', filters, { field: 'created_at', dir: 'asc' }, 100, 1);
  return data;
};

export const createLocumApproval = async (data: Omit<LocumApproval, 'id' | 'created_at'>): Promise<string> => {
  return addDocument('locum_approvals', data);
};

// ─── Locum History ───

export const getLocumHistory = async (
  employeeId?: string, page = 1, limit = 50,
): Promise<{ data: LocumHistory[]; total: number }> => {
  const filters: any[] = [];
  if (employeeId) filters.push({ field: 'employee_id', op: '==', value: employeeId });
  return getDocsPaginated('locum_history', filters, { field: 'completed_at', dir: 'desc' }, limit, page);
};

// ─── Dashboard Stats ───

export const getLocumDashboardStats = async (hospitalScope?: string): Promise<{
  activeAssignments: number;
  pendingRequests: number;
  openStaffingRequests: number;
  upcomingExpiry: number;
  completedAssignments: number;
}> => {
  const baseFilters: any[] = [];
  if (hospitalScope) baseFilters.push({ field: 'destination_hospital_id', op: '==', value: hospitalScope });

  const activeFilters = [...baseFilters, { field: 'status', op: '==', value: 'active' }];
  const completedFilters = [...baseFilters, { field: 'status', op: '==', value: 'completed' }];
  const today = new Date().toISOString().split('T')[0];

  const [activeRes, pendingRes, openRes, allActive] = await Promise.all([
    getDocsPaginated('locum_assignments', activeFilters, undefined, 1, 1),
    getDocsPaginated('locum_requests', [{ field: 'status', op: 'in', value: ['pending_hospital_admin', 'pending_destination_admin', 'pending_hr'] }], undefined, 1, 1),
    getDocsPaginated('staffing_requests', [{ field: 'status', op: '==', value: 'open' }], undefined, 1, 1),
    getDocsAll('locum_assignments', activeFilters),
  ]);

  const upcomingExpiry = (allActive as LocumAssignment[]).filter(a => a.end_date && a.end_date <= today).length;

  return {
    activeAssignments: activeRes.total,
    pendingRequests: pendingRes.total,
    openStaffingRequests: openRes.total,
    upcomingExpiry,
    completedAssignments: completedFilters.length > 0
      ? (await getDocsPaginated('locum_assignments', completedFilters, undefined, 1, 1)).total
      : 0,
  };
};
