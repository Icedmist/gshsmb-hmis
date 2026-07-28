import { addDocument, getDocsPaginated, updateDocument, getDocById, getDocsAll } from './firestore';
import { getHospitalAdmins } from './users';
import type {
  LocumRequest, StaffingRequest, StaffNomination,
  LocumAssignment, LocumApproval, LocumHistory,
} from '../types';

// ─── Locum Requests (Employee-Initiated) ───

export const getLocumRequests = async (
  page = 1, limit = 50, employeeId?: string,
  status?: string, hospitalId?: string,
): Promise<{ data: LocumRequest[]; total: number }> => {
  if (hospitalId) {
    const baseFilters: any[] = [];
    if (employeeId) baseFilters.push({ field: 'employee_id', op: '==', value: employeeId });
    if (status) baseFilters.push({ field: 'status', op: '==', value: status });

    const [sourceRes, destRes] = await Promise.all([
      getDocsPaginated('locum_requests', [...baseFilters, { field: 'source_hospital_id', op: '==', value: hospitalId }], { field: 'created_at', dir: 'desc' }, 500, 1),
      getDocsPaginated('locum_requests', [...baseFilters, { field: 'destination_hospital_id', op: '==', value: hospitalId }], { field: 'created_at', dir: 'desc' }, 500, 1),
    ]);

    const seen = new Set<string>();
    const merged = [...sourceRes.data, ...destRes.data].filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    merged.sort((a, b) => {
      const aTime = a.created_at?.toDate?.()?.getTime() || new Date(a.created_at ?? 0).getTime();
      const bTime = b.created_at?.toDate?.()?.getTime() || new Date(b.created_at ?? 0).getTime();
      return bTime - aTime;
    });

    const total = merged.length;
    const start = (page - 1) * limit;
    return { data: merged.slice(start, start + limit), total };
  }

  const filters: any[] = [];
  if (employeeId) filters.push({ field: 'employee_id', op: '==', value: employeeId });
  if (status) filters.push({ field: 'status', op: '==', value: status });
  return getDocsPaginated('locum_requests', filters, { field: 'created_at', dir: 'desc' }, limit, page);
};

export const getLocumRequest = async (id: string): Promise<LocumRequest | null> => {
  return getDocById('locum_requests', id);
};

export const createLocumRequest = async (data: Omit<LocumRequest, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  const id = await addDocument('locum_requests', { ...data, status: 'pending_destination_admin', current_step: 'Destination Hospital Admin' });

  const notifyHospital = async (hospitalId: string, title: string, message: string) => {
    try {
      const admins = await getHospitalAdmins(hospitalId);
      for (const admin of admins) {
        await addDocument('notifications', {
          user_id: admin.id,
          type: 'approval_request',
          title,
          message,
          link: '/locum-requests',
          read: false,
          created_at: new Date().toISOString(),
        });
      }
    } catch { /* ignore */ }
  };

  await notifyHospital(
    data.source_hospital_id,
    'Locum Request Submitted',
    `${data.employee_name}'s locum request to ${data.destination_hospital_name} has been submitted and is awaiting destination hospital approval.`,
  );

  await notifyHospital(
    data.destination_hospital_id,
    'New Locum Request',
    `${data.employee_name} from ${data.source_hospital_name} has requested a locum to your hospital.`,
  );

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

  // Notify all hospital admins across every hospital
  try {
    const { data: allAdmins } = await getDocsPaginated('users', [
      { field: 'role', op: '==', value: 'hospital_admin' },
    ], undefined, 500, 1);
    for (const admin of allAdmins) {
      if (admin.id === data.created_by) continue;
      await addDocument('notifications', {
        user_id: admin.id,
        type: 'approval_request',
        title: 'New Staffing Request',
        message: `${data.hospital_name || data.hospital_id} needs ${data.staff_needed} ${data.profession}${data.specialty ? ` (${data.specialty})` : ''} in ${data.department}. ${data.reason.substring(0, 80)}`,
        link: '/staffing-requests',
        read: false,
        created_at: new Date().toISOString(),
      });
    }
  } catch { /* ignore */ }

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

// ─── Badge Counts ───

export const getPendingLocumCount = async (hospitalId: string): Promise<number> => {
  const { total } = await getDocsPaginated('locum_requests', [
    { field: 'destination_hospital_id', op: '==', value: hospitalId },
    { field: 'status', op: '==', value: 'pending_destination_admin' },
  ], undefined, 1, 1);
  return total;
};

export const getOpenStaffingCount = async (): Promise<number> => {
  const { total } = await getDocsPaginated('staffing_requests', [
    { field: 'status', op: '==', value: 'open' },
  ], undefined, 1, 1);
  return total;
};

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
