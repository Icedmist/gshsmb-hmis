import { getDocById, getDocsPaginated, addDocument, updateDocument, deleteDocument, getDocsAll, type FilterConstraint, type PaginationResult } from './firestore';
import type { ResearchProject } from '../types';

const enrichProject = async (p: any): Promise<any> => {
  let hospital_name = 'Unknown';
  if (p.hospital_id) {
    const hosp = await getDocById('hospitals', p.hospital_id);
    hospital_name = hosp?.hospital_name || 'Unknown';
  }
  return { ...p, hospital_name };
};

export const getResearchProjects = async (
  page: number = 1,
  limit: number = 50,
  search?: string,
  status?: string,
): Promise<PaginationResult<ResearchProject>> => {
  const filters: FilterConstraint[] = [];
  if (status) filters.push({ field: 'status', op: '==', value: status });

  if (search) {
    const { data } = await getDocsPaginated('researchProjects', filters, { field: 'start_date', dir: 'desc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((p: any) =>
      p.title?.toLowerCase().includes(searchLower) ||
      p.principal_investigator?.toLowerCase().includes(searchLower)
    );
    const enriched = await Promise.all(filtered.map(enrichProject));
    return { data: enriched, total: enriched.length };
  }

  const result = await getDocsPaginated('researchProjects', filters, { field: 'start_date', dir: 'desc' }, limit, page);
  const enriched = await Promise.all(result.data.map(enrichProject));
  return { data: enriched, total: result.total };
};

export const getResearchProject = async (id: string): Promise<any | null> => {
  const p = await getDocById('researchProjects', id);
  if (!p) return null;
  return enrichProject(p);
};

export const createResearchProject = async (data: any): Promise<string> => {
  return addDocument('researchProjects', { ...data, status: data.status || 'active' });
};

export const updateResearchProject = async (id: string, data: any): Promise<void> => {
  await updateDocument('researchProjects', id, data);
};

export const deleteResearchProject = async (id: string): Promise<void> => {
  await deleteDocument('researchProjects', id);
};

export const getResearchDocuments = async (projectId: string): Promise<any[]> => {
  return getDocsAll('researchDocuments', [{ field: 'project_id', op: '==', value: projectId }], { field: 'created_at', dir: 'desc' });
};

export const createResearchDocument = async (data: any): Promise<string> => {
  return addDocument('researchDocuments', data);
};

export const deleteResearchDocument = async (id: string): Promise<void> => {
  await deleteDocument('researchDocuments', id);
};
