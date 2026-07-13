import { getDocById, getDocsPaginated, addDocument, updateDocument, deleteDocument, getDocsAll, type FilterConstraint, type PaginationResult } from './firestore';
import type { NursingWorkforce } from '../types';

const enrichEntry = async (e: any): Promise<any> => {
  let hospital_name = 'Unknown';
  let department_name = 'Unknown';
  if (e.hospital_id) {
    const hosp = await getDocById('hospitals', e.hospital_id);
    hospital_name = hosp?.hospital_name || 'Unknown';
  }
  if (e.department_id) {
    const dept = await getDocById('departments', e.department_id);
    department_name = dept?.department_name || 'Unknown';
  }
  return { ...e, hospital_name, department_name };
};

export const getNursingWorkforce = async (
  page: number = 1,
  limit: number = 50,
  search?: string,
  hospitalId?: string,
): Promise<PaginationResult<NursingWorkforce>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });

  if (search) {
    const { data } = await getDocsPaginated('nursingWorkforce', filters, { field: 'reporting_period', dir: 'desc' }, limit, page);
    const enriched = await Promise.all(data.map(enrichEntry));
    const searchLower = search.toLowerCase();
    const filtered = enriched.filter((e: any) =>
      e.hospital_name?.toLowerCase().includes(searchLower) ||
      e.department_name?.toLowerCase().includes(searchLower)
    );
    return { data: filtered, total: filtered.length };
  }

  const result = await getDocsPaginated('nursingWorkforce', filters, { field: 'reporting_period', dir: 'desc' }, limit, page);
  const enriched = await Promise.all(result.data.map(enrichEntry));
  return { data: enriched, total: result.total };
};

export const createNursingWorkforce = async (data: any): Promise<string> => {
  return addDocument('nursingWorkforce', data);
};

export const updateNursingWorkforce = async (id: string, data: any): Promise<void> => {
  await updateDocument('nursingWorkforce', id, data);
};

export const deleteNursingWorkforce = async (id: string): Promise<void> => {
  await deleteDocument('nursingWorkforce', id);
};

export const getNursingWorkforceSummary = async (): Promise<any[]> => {
  const data = await getDocsAll('nursingWorkforce', [], { field: 'hospital_id', dir: 'asc' });
  const enriched = await Promise.all(data.map(enrichEntry));

  const summary = new Map<string, any>();
  for (const e of enriched) {
    if (!summary.has(e.hospital_id)) {
      summary.set(e.hospital_id, {
        hospital_id: e.hospital_id,
        hospital_name: e.hospital_name,
        total_nurses: 0,
        total_vacancies: 0,
        departments: 0,
      });
    }
    const s = summary.get(e.hospital_id)!;
    s.total_nurses += e.nurse_count || 0;
    s.total_vacancies += e.vacancies || 0;
    s.departments += 1;
  }
  return Array.from(summary.values());
};
