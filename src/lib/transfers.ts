import { getDocById, getDocsPaginated, updateDocument, addDocument, type FilterConstraint, type PaginationResult } from './firestore';
import type { EmployeeTransfer } from '../types';

const enrichTransfer = async (t: any): Promise<any> => {
  const [emp, fromHosp, toHosp, fromDept, toDept, creator, approver] = await Promise.all([
    getDocById('employees', t.employee_id),
    getDocById('hospitals', t.from_hospital_id),
    getDocById('hospitals', t.to_hospital_id),
    getDocById('departments', t.from_department_id),
    getDocById('departments', t.to_department_id),
    getDocById('users', t.created_by),
    t.approved_by ? getDocById('users', t.approved_by) : null,
  ]);

  return {
    ...t,
    employee_name: emp?.full_name || 'Unknown',
    staff_id: emp?.staff_id || '',
    from_hospital: fromHosp?.hospital_name || 'Unknown',
    to_hospital: toHosp?.hospital_name || 'Unknown',
    from_department: fromDept?.department_name || 'Unknown',
    to_department: toDept?.department_name || 'Unknown',
    created_by_name: creator?.full_name || 'Unknown',
    approved_by_name: approver?.full_name || null,
  };
};

export const getTransfers = async (
  page: number = 1,
  limit: number = 50,
  search?: string,
  status?: string,
  hospitalScope?: string,
): Promise<PaginationResult<EmployeeTransfer>> => {
  const filters: FilterConstraint[] = [];
  if (status) filters.push({ field: 'status', op: '==', value: status });

  const result = await getDocsPaginated('employeeTransfers', filters, { field: 'created_at', dir: 'desc' }, limit, page);

  let transfers = [...result.data];

  if (hospitalScope) {
    transfers = transfers.filter((t: any) =>
      t.from_hospital_id === hospitalScope || t.to_hospital_id === hospitalScope
    );
  }

  if (search) {
    const searchLower = search.toLowerCase();
    transfers = transfers.filter((t: any) => {
      const empName = t.employee_name?.toLowerCase() || '';
      const staffId = t.staff_id?.toLowerCase() || '';
      return empName.includes(searchLower) || staffId.includes(searchLower);
    });
  }

  const enriched = await Promise.all(transfers.map(enrichTransfer));
  return { data: enriched, total: enriched.length };
};

export const approveTransfer = async (transferId: string, approvedBy: string): Promise<void> => {
  const transfer = await getDocById('employeeTransfers', transferId);
  if (!transfer) throw new Error('Transfer not found.');
  if (transfer.status !== 'pending') throw new Error(`Transfer already ${transfer.status}.`);

  await updateDocument('employeeTransfers', transferId, {
    status: 'approved',
    approved_by: approvedBy,
    approved_at: new Date().toISOString(),
  });

  await updateDocument('employees', transfer.employee_id, {
    hospital_id: transfer.to_hospital_id,
    department_id: transfer.to_department_id,
  });
};

export const rejectTransfer = async (transferId: string, rejectedBy: string): Promise<void> => {
  const transfer = await getDocById('employeeTransfers', transferId);
  if (!transfer) throw new Error('Transfer not found.');
  if (transfer.status !== 'pending') throw new Error(`Transfer already ${transfer.status}.`);

  await updateDocument('employeeTransfers', transferId, {
    status: 'rejected',
    approved_by: rejectedBy,
    approved_at: new Date().toISOString(),
  });
};
