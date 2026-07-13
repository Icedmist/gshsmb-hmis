import { getDocById, getDocsPaginated, addDocument, updateDocument, type FilterConstraint, type PaginationResult } from './firestore';
import type { GeneratedReport } from '../types';

const enrichReport = async (r: any): Promise<any> => {
  let hospital_name: string | undefined;
  let department_name: string | undefined;
  if (r.hospital_id) {
    const hosp = await getDocById('hospitals', r.hospital_id);
    hospital_name = hosp?.hospital_name;
  }
  if (r.department_id) {
    const dept = await getDocById('departments', r.department_id);
    department_name = dept?.department_name;
  }
  return { ...r, hospital_name, department_name };
};

export const getGeneratedReports = async (
  page: number = 1,
  limit: number = 50,
  category?: string,
): Promise<PaginationResult<GeneratedReport>> => {
  const filters: FilterConstraint[] = [];
  if (category) filters.push({ field: 'report_category', op: '==', value: category });

  const result = await getDocsPaginated('generatedReports', filters, { field: 'created_at', dir: 'desc' }, limit, page);
  const enriched = await Promise.all(result.data.map(enrichReport));
  return { data: enriched, total: result.total };
};

export const createGeneratedReport = async (data: any): Promise<string> => {
  return addDocument('generatedReports', { ...data, status: data.status || 'active' });
};

export const updateGeneratedReport = async (id: string, data: any): Promise<void> => {
  await updateDocument('generatedReports', id, data);
};
