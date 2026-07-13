import { getDocById, getDocsPaginated, addDocument, updateDocument, deleteDocument, getDocsAll, type FilterConstraint, type PaginationResult } from './firestore';
import type { Specialist } from '../types';

const enrichSpecialist = async (s: any): Promise<any> => {
  let hospital_name = 'Unknown';
  let department_name = 'Unknown';
  if (s.hospital_id) {
    const hosp = await getDocById('hospitals', s.hospital_id);
    hospital_name = hosp?.hospital_name || 'Unknown';
  }
  if (s.department_id) {
    const dept = await getDocById('departments', s.department_id);
    department_name = dept?.department_name || 'Unknown';
  }
  return { ...s, hospital_name, department_name };
};

export const getSpecialists = async (
  page: number = 1,
  limit: number = 50,
  search?: string,
  hospitalId?: string,
  status?: string,
): Promise<PaginationResult<Specialist>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  if (status) filters.push({ field: 'status', op: '==', value: status });

  if (search) {
    const { data } = await getDocsPaginated('specialists', filters, { field: 'full_name', dir: 'asc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((s: any) =>
      s.full_name?.toLowerCase().includes(searchLower) ||
      s.specialty?.toLowerCase().includes(searchLower)
    );
    const enriched = await Promise.all(filtered.map(enrichSpecialist));
    return { data: enriched, total: enriched.length };
  }

  const result = await getDocsPaginated('specialists', filters, { field: 'full_name', dir: 'asc' }, limit, page);
  const enriched = await Promise.all(result.data.map(enrichSpecialist));
  return { data: enriched, total: result.total };
};

export const getSpecialist = async (id: string): Promise<any | null> => {
  const s = await getDocById('specialists', id);
  if (!s) return null;
  return enrichSpecialist(s);
};

export const createSpecialist = async (data: any): Promise<string> => {
  return addDocument('specialists', { ...data, status: data.status || 'active' });
};

export const updateSpecialist = async (id: string, data: any): Promise<void> => {
  await updateDocument('specialists', id, data);
};

export const deleteSpecialist = async (id: string): Promise<void> => {
  await deleteDocument('specialists', id);
};

export const getAllSpecialists = async (hospitalId?: string): Promise<any[]> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  const data = await getDocsAll('specialists', filters, { field: 'full_name', dir: 'asc' });
  return Promise.all(data.map(enrichSpecialist));
};

export const getSpecialistAssignments = async (specialistId: string): Promise<any[]> => {
  return getDocsAll('specialistAssignments', [{ field: 'specialist_id', op: '==', value: specialistId }], { field: 'assigned_date', dir: 'desc' });
};

export const createSpecialistAssignment = async (data: any): Promise<string> => {
  return addDocument('specialistAssignments', { ...data, status: data.status || 'active' });
};

export const updateSpecialistAssignment = async (id: string, data: any): Promise<void> => {
  await updateDocument('specialistAssignments', id, data);
};
