import { collection, query, where, getDocs, limit as firestoreLimit } from 'firebase/firestore';
import { db } from './firebase';
import { getDocById, getDocsPaginated, addDocument, updateDocument, deleteDocument, countDocs, getDocsAll, type FilterConstraint, type PaginationResult } from './firestore';
import type { Department } from '../types';

const enrichDepartment = async (d: any): Promise<any> => {
  let hospital_name = 'Unknown';
  if (d.hospital_id) {
    const hospital = await getDocById('hospitals', d.hospital_id);
    hospital_name = hospital?.hospital_name || 'Unknown';
  }
  return { ...d, hospital_name };
};

export const getDepartments = async (
  page: number = 1,
  limit: number = 50,
  search?: string,
  hospitalId?: string,
  hospitalScope?: string,
): Promise<PaginationResult<Department>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });

  if (search) {
    const { data } = await getDocsPaginated('departments', filters, { field: 'department_name', dir: 'asc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((d: any) =>
      d.department_name?.toLowerCase().includes(searchLower) ||
      d.department_code?.toLowerCase().includes(searchLower)
    );
    const enriched = await Promise.all(filtered.map(enrichDepartment));
    return { data: enriched, total: enriched.length };
  }

  const result = await getDocsPaginated('departments', filters, { field: 'department_name', dir: 'asc' }, limit, page);
  const enriched = await Promise.all(result.data.map(enrichDepartment));
  return { data: enriched, total: result.total };
};

export const getDepartment = async (id: string): Promise<any | null> => {
  const dept = await getDocById('departments', id);
  if (!dept) return null;
  return enrichDepartment(dept);
};

export const getAllDepartments = async (hospitalScope?: string): Promise<any[]> => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  return getDocsAll('departments', filters, { field: 'department_name', dir: 'asc' });
};

export const getDepartmentNames = async (hospitalScope?: string): Promise<any[]> => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });
  const data = await getDocsAll('departments', filters, { field: 'department_name', dir: 'asc' });

  const grouped = new Map<string, any>();
  for (const d of data) {
    const baseCode = d.department_code?.includes('-') ? d.department_code.split('-')[0] : d.department_code;
    if (!grouped.has(d.department_name)) {
      grouped.set(d.department_name, {
        department_name: d.department_name,
        base_code: baseCode,
        description: d.description,
        status: d.status,
      });
    }
  }
  return Array.from(grouped.values());
};

export const createDepartment = async (
  departmentName: string,
  departmentCode: string,
  description: string,
  hospitalIds: string[],
): Promise<any[]> => {
  const created: any[] = [];

  for (const hospitalId of hospitalIds) {
    const hospital = await getDocById('hospitals', hospitalId);
    if (!hospital) continue;

    const fullCode = `${departmentCode}-${hospital.hospital_code}`;
    const existing = await getDocs(
      query(collection(db, 'departments'), where('department_code', '==', fullCode), firestoreLimit(1))
    );
    if (!existing.empty) continue;

    const docId = await addDocument('departments', {
      department_name: departmentName,
      department_code: fullCode,
      description: description || null,
      hospital_id: hospitalId,
      status: 'active',
    });

    const result = await getDocById('departments', docId);
    created.push(result);
  }

  if (created.length === 0) {
    throw new Error('No valid hospitals selected.');
  }

  return created;
};

export const updateDepartment = async (id: string, data: Partial<Department>): Promise<void> => {
  if (data.department_code) {
    const existing = await getDocs(
      query(collection(db, 'departments'), where('department_code', '==', data.department_code), firestoreLimit(1))
    );
    if (!existing.empty && existing.docs[0].id !== id) {
      throw new Error('A department with this code already exists.');
    }
  }
  await updateDocument('departments', id, data);
};

export const deleteDepartment = async (id: string): Promise<void> => {
  const empCount = await countDocs('employees', [{ field: 'department_id', op: '==', value: id }]);
  if (empCount > 0) {
    throw new Error(`Cannot delete. ${empCount} employee(s) are assigned to this department.`);
  }
  await deleteDocument('departments', id);
};
