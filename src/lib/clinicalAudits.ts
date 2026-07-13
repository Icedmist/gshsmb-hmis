import { getDocById, getDocsPaginated, addDocument, updateDocument, deleteDocument, getDocsAll, type FilterConstraint, type PaginationResult } from './firestore';
import type { ClinicalAudit } from '../types';

const enrichAudit = async (a: any): Promise<any> => {
  let hospital_name = 'Unknown';
  if (a.hospital_id) {
    const hosp = await getDocById('hospitals', a.hospital_id);
    hospital_name = hosp?.hospital_name || 'Unknown';
  }
  return { ...a, hospital_name };
};

export const getClinicalAudits = async (
  page: number = 1,
  limit: number = 50,
  search?: string,
  hospitalId?: string,
  status?: string,
): Promise<PaginationResult<ClinicalAudit>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  if (status) filters.push({ field: 'status', op: '==', value: status });

  if (search) {
    const { data } = await getDocsPaginated('clinicalAudits', filters, { field: 'audit_date', dir: 'desc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((a: any) => a.title?.toLowerCase().includes(searchLower));
    const enriched = await Promise.all(filtered.map(enrichAudit));
    return { data: enriched, total: enriched.length };
  }

  const result = await getDocsPaginated('clinicalAudits', filters, { field: 'audit_date', dir: 'desc' }, limit, page);
  const enriched = await Promise.all(result.data.map(enrichAudit));
  return { data: enriched, total: result.total };
};

export const getClinicalAudit = async (id: string): Promise<any | null> => {
  const a = await getDocById('clinicalAudits', id);
  if (!a) return null;
  return enrichAudit(a);
};

export const createClinicalAudit = async (data: any): Promise<string> => {
  return addDocument('clinicalAudits', { ...data, status: data.status || 'active' });
};

export const updateClinicalAudit = async (id: string, data: any): Promise<void> => {
  await updateDocument('clinicalAudits', id, data);
};

export const deleteClinicalAudit = async (id: string): Promise<void> => {
  await deleteDocument('clinicalAudits', id);
};

export const getClinicalAuditFindings = async (auditId: string): Promise<any[]> => {
  return getDocsAll('clinicalAuditFindings', [{ field: 'audit_id', op: '==', value: auditId }], { field: 'created_at', dir: 'asc' });
};

export const createClinicalAuditFinding = async (data: any): Promise<string> => {
  return addDocument('clinicalAuditFindings', { ...data, implemented: false });
};

export const updateClinicalAuditFinding = async (id: string, data: any): Promise<void> => {
  await updateDocument('clinicalAuditFindings', id, data);
};

export const deleteClinicalAuditFinding = async (id: string): Promise<void> => {
  await deleteDocument('clinicalAuditFindings', id);
};
