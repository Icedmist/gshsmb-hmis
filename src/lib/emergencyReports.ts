import { getDocById, getDocsPaginated, addDocument, updateDocument, deleteDocument, type FilterConstraint, type PaginationResult } from './firestore';
import type { EmergencyReport } from '../types';

const enrichReport = async (r: any): Promise<any> => {
  let hospital_name = 'Unknown';
  if (r.hospital_id) {
    const hosp = await getDocById('hospitals', r.hospital_id);
    hospital_name = hosp?.hospital_name || 'Unknown';
  }
  return { ...r, hospital_name };
};

export const getEmergencyReports = async (
  page: number = 1,
  limit: number = 50,
  search?: string,
  hospitalId?: string,
  status?: string,
): Promise<PaginationResult<EmergencyReport>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  if (status) filters.push({ field: 'status', op: '==', value: status });

  if (search) {
    const { data } = await getDocsPaginated('emergencyReports', filters, { field: 'incident_date', dir: 'desc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((r: any) =>
      r.incident_type?.toLowerCase().includes(searchLower) ||
      r.description?.toLowerCase().includes(searchLower)
    );
    const enriched = await Promise.all(filtered.map(enrichReport));
    return { data: enriched, total: enriched.length };
  }

  const result = await getDocsPaginated('emergencyReports', filters, { field: 'incident_date', dir: 'desc' }, limit, page);
  const enriched = await Promise.all(result.data.map(enrichReport));
  return { data: enriched, total: result.total };
};

export const createEmergencyReport = async (data: any): Promise<string> => {
  return addDocument('emergencyReports', { ...data, status: data.status || 'active' });
};

export const updateEmergencyReport = async (id: string, data: any): Promise<void> => {
  await updateDocument('emergencyReports', id, data);
};

export const deleteEmergencyReport = async (id: string): Promise<void> => {
  await deleteDocument('emergencyReports', id);
};
