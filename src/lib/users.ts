import { getDocById, getDocsPaginated, updateDocument, deleteDocument, type FilterConstraint, type PaginationResult } from './firestore';
import type { User } from '../types';

export const getUsers = async (
  page: number = 1,
  limit: number = 50,
  search?: string,
  hospitalScope?: string,
): Promise<PaginationResult<User>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });

  if (search) {
    const { data } = await getDocsPaginated('users', filters, { field: 'created_at', dir: 'desc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((u: any) =>
      u.full_name?.toLowerCase().includes(searchLower) ||
      u.email?.toLowerCase().includes(searchLower)
    );
    const safe = filtered.map(({ ...rest }: any) => rest);
    return { data: safe, total: safe.length };
  }

  const result = await getDocsPaginated('users', filters, { field: 'created_at', dir: 'desc' }, limit, page);
  const safe = result.data.map(({ ...rest }: any) => rest);
  return { data: safe, total: result.total };
};

export const getUser = async (id: string): Promise<User | null> => {
  const user = await getDocById('users', id);
  if (!user) return null;
  const { ...safe } = user;
  return safe;
};

export const updateUser = async (id: string, data: Partial<User>): Promise<void> => {
  await updateDocument('users', id, data);
};

export const deleteUser = async (id: string): Promise<void> => {
  await deleteDocument('users', id);
};

export const getUsersByNames = async (names: string[]): Promise<{ id: string; full_name: string }[]> => {
  try {
    const { data } = await getDocsPaginated('users', [], undefined, 500, 1);
    const lowerNames = names.map(n => n.toLowerCase());
    return data
      .filter((u: any) => u.full_name && lowerNames.includes(u.full_name.toLowerCase()))
      .map((u: any) => ({ id: u.id, full_name: u.full_name }));
  } catch {
    return [];
  }
};

export const getHospitalAdmins = async (hospitalId?: string): Promise<{ id: string; full_name: string }[]> => {
  try {
    const filters: FilterConstraint[] = [{ field: 'role', op: '==', value: 'hospital_admin' }];
    if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
    const { data } = await getDocsPaginated('users', filters, undefined, 500, 1);
    return data.map((u: any) => ({ id: u.id, full_name: u.full_name }));
  } catch {
    return [];
  }
};

export const getExecutiveAdmins = async (): Promise<{ id: string; full_name: string }[]> => {
  try {
    const { data } = await getDocsPaginated('users', [
      { field: 'role', op: 'in', value: ['super_admin', 'executive_secretary'] },
    ], undefined, 100, 1);
    return data.map((u: any) => ({ id: u.id, full_name: u.full_name }));
  } catch {
    return [];
  }
};
