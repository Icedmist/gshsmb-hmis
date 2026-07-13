import { getDocById, getDocsPaginated, addDocument, updateDocument, deleteDocument, type FilterConstraint, type PaginationResult } from './firestore';
import type { NursingAudit } from '../types';

const enrichAudit = async (a: any): Promise<any> => {
  let hospital_name = 'Unknown';
  let department_name = 'Unknown';
  if (a.hospital_id) {
    const hosp = await getDocById('hospitals', a.hospital_id);
    hospital_name = hosp?.hospital_name || 'Unknown';
  }
  if (a.department_id) {
    const dept = await getDocById('departments', a.department_id);
    department_name = dept?.department_name || 'Unknown';
  }
  return { ...a, hospital_name, department_name };
};

export const getNursingAudits = async (
  page: number = 1,
  limit: number = 50,
  search?: string,
  hospitalId?: string,
  status?: string,
): Promise<PaginationResult<NursingAudit>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  if (status) filters.push({ field: 'status', op: '==', value: status });

  if (search) {
    const { data } = await getDocsPaginated('nursingAudits', filters, { field: 'audit_date', dir: 'desc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((a: any) =>
      a.audit_name?.toLowerCase().includes(searchLower)
    );
    const enriched = await Promise.all(filtered.map(enrichAudit));
    return { data: enriched, total: enriched.length };
  }

  const result = await getDocsPaginated('nursingAudits', filters, { field: 'audit_date', dir: 'desc' }, limit, page);
  const enriched = await Promise.all(result.data.map(enrichAudit));
  return { data: enriched, total: result.total };
};

export const createNursingAudit = async (data: any): Promise<string> => {
  return addDocument('nursingAudits', { ...data, status: data.status || 'active' });
};

export const updateNursingAudit = async (id: string, data: any): Promise<void> => {
  await updateDocument('nursingAudits', id, data);
};

export const deleteNursingAudit = async (id: string): Promise<void> => {
  await deleteDocument('nursingAudits', id);
};

export const getNursingSupervisionReports = async (
  page: number = 1,
  limit: number = 50,
  hospitalId?: string,
): Promise<PaginationResult<any>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });

  const result = await getDocsPaginated('nursingSupervisionReports', filters, { field: 'report_date', dir: 'desc' }, limit, page);
  const enriched = await Promise.all(result.data.map(async (r: any) => {
    let hospital_name = 'Unknown';
    let department_name = 'Unknown';
    if (r.hospital_id) {
      const hosp = await getDocById('hospitals', r.hospital_id);
      hospital_name = hosp?.hospital_name || 'Unknown';
    }
    if (r.department_id) {
      const dept = await getDocById('departments', r.department_id);
      department_name = dept?.department_name || 'Unknown';
    }
    return { ...r, hospital_name, department_name };
  }));
  return { data: enriched, total: result.total };
};

export const createNursingSupervisionReport = async (data: any): Promise<string> => {
  return addDocument('nursingSupervisionReports', { ...data, status: data.status || 'active' });
};

export const updateNursingSupervisionReport = async (id: string, data: any): Promise<void> => {
  await updateDocument('nursingSupervisionReports', id, data);
};

export const deleteNursingSupervisionReport = async (id: string): Promise<void> => {
  await deleteDocument('nursingSupervisionReports', id);
};
