import { collection, query, where, getDocs, limit as firestoreLimit } from 'firebase/firestore';
import { db } from './firebase';
import { getDocById, getDocsPaginated, addDocument, updateDocument, deleteDocument, countDocs, getDocsAll, type FilterConstraint, type PaginationResult } from './firestore';
import type { Hospital } from '../types';

export const getHospitals = async (
  page: number = 1,
  limit: number = 50,
  search?: string,
  status?: string,
  hospitalScope?: string,
): Promise<PaginationResult<Hospital>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: '__name__', op: '==', value: hospitalScope });
  if (status) filters.push({ field: 'status', op: '==', value: status });

  if (search) {
    const { data } = await getDocsPaginated('hospitals', filters, { field: 'hospital_name', dir: 'asc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((h: any) =>
      h.hospital_name?.toLowerCase().includes(searchLower) ||
      h.hospital_code?.toLowerCase().includes(searchLower) ||
      h.lga?.toLowerCase().includes(searchLower)
    );
    return { data: filtered, total: filtered.length };
  }

  return getDocsPaginated('hospitals', filters, { field: 'hospital_name', dir: 'asc' }, limit, page);
};

export const getHospital = async (id: string): Promise<Hospital | null> => {
  return getDocById('hospitals', id);
};

export const getAllHospitals = async (hospitalScope?: string): Promise<Hospital[]> => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: '__name__', op: '==', value: hospitalScope });
  return getDocsAll('hospitals', filters, { field: 'hospital_name', dir: 'asc' });
};

export const createHospital = async (data: Omit<Hospital, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  const existing = await getDocs(
    query(collection(db, 'hospitals'), where('hospital_code', '==', data.hospital_code), firestoreLimit(1))
  );
  if (!existing.empty) {
    throw new Error('A hospital with this code already exists.');
  }
  return addDocument('hospitals', { ...data, status: data.status || 'active' });
};

export const updateHospital = async (id: string, data: Partial<Hospital>): Promise<void> => {
  if (data.hospital_code) {
    const existing = await getDocs(
      query(collection(db, 'hospitals'), where('hospital_code', '==', data.hospital_code), firestoreLimit(1))
    );
    if (!existing.empty && existing.docs[0].id !== id) {
      throw new Error('A hospital with this code already exists.');
    }
  }
  await updateDocument('hospitals', id, data);
};

export const deleteHospital = async (id: string): Promise<void> => {
  const [deptCount, empCount] = await Promise.all([
    countDocs('departments', [{ field: 'hospital_id', op: '==', value: id }]),
    countDocs('employees', [{ field: 'hospital_id', op: '==', value: id }]),
  ]);
  if (deptCount > 0 || empCount > 0) {
    const details: string[] = [];
    if (deptCount > 0) details.push(`${deptCount} department(s)`);
    if (empCount > 0) details.push(`${empCount} employee(s)`);
    throw new Error(`Cannot delete. ${details.join(' and ')} are linked to this hospital.`);
  }
  await deleteDocument('hospitals', id);
};

export const getPublicStats = async (): Promise<{ total_hospitals: number; total_departments: number; total_employees: number }> => {
  const [total_hospitals, total_departments, total_employees] = await Promise.all([
    countDocs('hospitals', [{ field: 'status', op: '==', value: 'active' }]),
    countDocs('departments', [{ field: 'status', op: '==', value: 'active' }]),
    countDocs('employees', []),
  ]);
  return { total_hospitals, total_departments, total_employees };
};
