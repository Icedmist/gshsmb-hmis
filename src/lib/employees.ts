import { collection, query, where, getDocs, limit as firestoreLimit } from 'firebase/firestore';
import { db } from './firebase';
import { getDocById, getDocsPaginated, addDocument, updateDocument, countDocs, type FilterConstraint, type PaginationResult } from './firestore';
import { Timestamp } from 'firebase/firestore';
import type { Employee } from '../types';

const enrichEmployee = async (e: any): Promise<any> => {
  let department_name = 'Unknown';
  let hospital_name = 'Unknown';
  if (e.department_id) {
    const dept = await getDocById('departments', e.department_id);
    department_name = dept?.department_name || 'Unknown';
  }
  if (e.hospital_id) {
    const hosp = await getDocById('hospitals', e.hospital_id);
    hospital_name = hosp?.hospital_name || 'Unknown';
  }
  return { ...e, department_name, hospital_name };
};

export const getEmployees = async (
  page: number = 1,
  limit: number = 50,
  search?: string,
  hospitalId?: string,
  departmentId?: string,
  status?: string,
  hospitalScope?: string,
): Promise<PaginationResult<Employee>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  if (departmentId) filters.push({ field: 'department_id', op: '==', value: departmentId });
  if (status) filters.push({ field: 'status', op: '==', value: status });

  if (search) {
    const { data } = await getDocsPaginated('employees', filters, { field: 'created_at', dir: 'desc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((e: any) =>
      e.full_name?.toLowerCase().includes(searchLower) ||
      e.staff_id?.toLowerCase().includes(searchLower) ||
      e.email?.toLowerCase().includes(searchLower)
    );
    const enriched = await Promise.all(filtered.map(enrichEmployee));
    return { data: enriched, total: enriched.length };
  }

  const result = await getDocsPaginated('employees', filters, { field: 'created_at', dir: 'desc' }, limit, page);
  const enriched = await Promise.all(result.data.map(enrichEmployee));
  return { data: enriched, total: result.total };
};

export const getEmployee = async (id: string): Promise<any | null> => {
  const employee = await getDocById('employees', id);
  if (!employee) return null;
  return enrichEmployee(employee);
};

export const createEmployee = async (data: any): Promise<string> => {
  const existing = await getDocs(
    query(collection(db, 'employees'), where('staff_id', '==', data.staff_id), firestoreLimit(1))
  );
  if (!existing.empty) {
    throw new Error('An employee with this staff ID already exists.');
  }

  const deptCheck = await getDocById('departments', data.department_id);
  if (!deptCheck) {
    throw new Error('Department not found.');
  }

  return addDocument('employees', {
    staff_id: data.staff_id,
    full_name: data.full_name,
    gender: data.gender || null,
    phone_number: data.phone_number || null,
    email: data.email || null,
    position: data.position,
    department_id: data.department_id,
    hospital_id: data.hospital_id,
    employment_date: data.employment_date,
    status: 'active',
  });
};

export const updateEmployee = async (id: string, data: Partial<Employee>): Promise<void> => {
  if (data.staff_id) {
    const existing = await getDocs(
      query(collection(db, 'employees'), where('staff_id', '==', data.staff_id), firestoreLimit(1))
    );
    if (!existing.empty && existing.docs[0].id !== id) {
      throw new Error('An employee with this staff ID already exists.');
    }
  }
  await updateDocument('employees', id, data);
};

export const transferEmployee = async (
  employeeId: string,
  toHospitalId: string,
  toDepartmentId: string,
  transferDate: string,
  reason: string,
  createdBy: string,
): Promise<void> => {
  const employee = await getDocById('employees', employeeId);
  if (!employee) throw new Error('Employee not found.');

  await addDocument('employeeTransfers', {
    employee_id: employeeId,
    from_hospital_id: employee.hospital_id,
    to_hospital_id: toHospitalId,
    from_department_id: employee.department_id,
    to_department_id: toDepartmentId,
    transfer_date: transferDate,
    reason: reason || null,
    status: 'pending',
    approved_by: null,
    approved_at: null,
    created_by: createdBy,
  });
};
