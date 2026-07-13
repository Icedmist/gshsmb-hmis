import { getDocById, getDocsPaginated, addDocument, updateDocument, deleteDocument, type FilterConstraint, type PaginationResult } from './firestore';
import type { ClinicalGuideline } from '../types';

export const getClinicalGuidelines = async (
  page: number = 1,
  limit: number = 50,
  search?: string,
  status?: string,
): Promise<PaginationResult<ClinicalGuideline>> => {
  const filters: FilterConstraint[] = [];
  if (status) filters.push({ field: 'status', op: '==', value: status });

  if (search) {
    const { data } = await getDocsPaginated('clinicalGuidelines', filters, { field: 'title', dir: 'asc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((g: any) =>
      g.title?.toLowerCase().includes(searchLower) ||
      g.code?.toLowerCase().includes(searchLower)
    );
    const enriched = await Promise.all(filtered.map(enrichGuideline));
    return { data: enriched, total: enriched.length };
  }

  const result = await getDocsPaginated('clinicalGuidelines', filters, { field: 'title', dir: 'asc' }, limit, page);
  const enriched = await Promise.all(result.data.map(enrichGuideline));
  return { data: enriched, total: result.total };
};

const enrichGuideline = async (g: any): Promise<any> => {
  let department_name = 'Unknown';
  if (g.department_id) {
    const dept = await getDocById('departments', g.department_id);
    department_name = dept?.department_name || 'Unknown';
  }
  return { ...g, department_name };
};

export const getClinicalGuideline = async (id: string): Promise<any | null> => {
  const g = await getDocById('clinicalGuidelines', id);
  if (!g) return null;
  return enrichGuideline(g);
};

export const createClinicalGuideline = async (data: any): Promise<string> => {
  const existing = await getDocsPaginated('clinicalGuidelines', [{ field: 'code', op: '==', value: data.code }], undefined, 1, 1);
  if (existing.total > 0) throw new Error('A guideline with this code already exists.');
  return addDocument('clinicalGuidelines', { ...data, status: data.status || 'active', version: data.version || 1 });
};

export const updateClinicalGuideline = async (id: string, data: any): Promise<void> => {
  await updateDocument('clinicalGuidelines', id, data);
};

export const deleteClinicalGuideline = async (id: string): Promise<void> => {
  await deleteDocument('clinicalGuidelines', id);
};
