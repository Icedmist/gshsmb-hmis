import { collection, query, where, getDocs, limit as firestoreLimit } from 'firebase/firestore';
import { db } from './firebase';
import { getDocById, getDocsPaginated, addDocument, updateDocument, deleteDocument, type FilterConstraint, type PaginationResult } from './firestore';
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
    const safe = filtered.map(({ firebase_uid, ...rest }: any) => rest);
    return { data: safe, total: safe.length };
  }

  const result = await getDocsPaginated('users', filters, { field: 'created_at', dir: 'desc' }, limit, page);
  const safe = result.data.map(({ firebase_uid, ...rest }: any) => rest);
  return { data: safe, total: result.total };
};

export const getUser = async (id: string): Promise<User | null> => {
  const user = await getDocById('users', id);
  if (!user) return null;
  const { firebase_uid, ...safe } = user;
  return safe;
};

export const updateUser = async (id: string, data: Partial<User>): Promise<void> => {
  await updateDocument('users', id, data);
};

export const deleteUser = async (id: string): Promise<void> => {
  await deleteDocument('users', id);
};
