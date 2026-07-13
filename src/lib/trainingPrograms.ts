import { getDocById, getDocsPaginated, addDocument, updateDocument, deleteDocument, getDocsAll, type FilterConstraint, type PaginationResult } from './firestore';

export const getTrainingPrograms = async (
  page: number = 1,
  limit: number = 50,
  search?: string,
  status?: string,
): Promise<PaginationResult<any>> => {
  const filters: FilterConstraint[] = [];
  if (status) filters.push({ field: 'status', op: '==', value: status });

  if (search) {
    const { data } = await getDocsPaginated('trainingPrograms', filters, { field: 'start_date', dir: 'desc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((p: any) =>
      p.title?.toLowerCase().includes(searchLower)
    );
    return { data: filtered, total: filtered.length };
  }

  return getDocsPaginated('trainingPrograms', filters, { field: 'start_date', dir: 'desc' }, limit, page);
};

export const getTrainingProgram = async (id: string): Promise<any | null> => {
  return getDocById('trainingPrograms', id);
};

export const createTrainingProgram = async (data: any): Promise<string> => {
  return addDocument('trainingPrograms', { ...data, status: data.status || 'active' });
};

export const updateTrainingProgram = async (id: string, data: any): Promise<void> => {
  await updateDocument('trainingPrograms', id, data);
};

export const deleteTrainingProgram = async (id: string): Promise<void> => {
  await deleteDocument('trainingPrograms', id);
};

export const getTrainingAttendance = async (programId: string): Promise<any[]> => {
  return getDocsAll('trainingAttendance', [{ field: 'program_id', op: '==', value: programId }], { field: 'created_at', dir: 'asc' });
};

export const createTrainingAttendance = async (data: any): Promise<string> => {
  return addDocument('trainingAttendance', data);
};

export const updateTrainingAttendance = async (id: string, data: any): Promise<void> => {
  await updateDocument('trainingAttendance', id, data);
};

export const getCertifications = async (
  page: number = 1,
  limit: number = 50,
  search?: string,
): Promise<PaginationResult<any>> => {
  if (search) {
    const { data } = await getDocsPaginated('certifications', [], { field: 'issue_date', dir: 'desc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((c: any) =>
      c.certification_name?.toLowerCase().includes(searchLower) ||
      c.employee_name?.toLowerCase().includes(searchLower) ||
      c.certificate_number?.toLowerCase().includes(searchLower)
    );
    return { data: filtered, total: filtered.length };
  }

  return getDocsPaginated('certifications', [], { field: 'issue_date', dir: 'desc' }, limit, page);
};

export const createCertification = async (data: any): Promise<string> => {
  return addDocument('certifications', { ...data, status: data.status || 'active' });
};

export const updateCertification = async (id: string, data: any): Promise<void> => {
  await updateDocument('certifications', id, data);
};

export const deleteCertification = async (id: string): Promise<void> => {
  await deleteDocument('certifications', id);
};
