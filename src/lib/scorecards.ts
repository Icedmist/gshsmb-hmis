import { getDocById, getDocsPaginated, addDocument, updateDocument, deleteDocument, type FilterConstraint, type PaginationResult } from './firestore';

const enrichHospitalScorecard = async (s: any): Promise<any> => {
  let hospital_name = 'Unknown';
  if (s.hospital_id) {
    const hosp = await getDocById('hospitals', s.hospital_id);
    hospital_name = hosp?.hospital_name || 'Unknown';
  }
  return { ...s, hospital_name };
};

const enrichDepartmentScorecard = async (s: any): Promise<any> => {
  let department_name = 'Unknown';
  let hospital_name = 'Unknown';
  if (s.department_id) {
    const dept = await getDocById('departments', s.department_id);
    department_name = dept?.department_name || 'Unknown';
  }
  if (s.hospital_id) {
    const hosp = await getDocById('hospitals', s.hospital_id);
    hospital_name = hosp?.hospital_name || 'Unknown';
  }
  return { ...s, department_name, hospital_name };
};

export const getHospitalScorecards = async (
  page: number = 1,
  limit: number = 50,
  hospitalId?: string,
  type?: string,
): Promise<PaginationResult<any>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  if (type) filters.push({ field: 'type', op: '==', value: type });

  const result = await getDocsPaginated('hospitalScorecards', filters, { field: 'period', dir: 'desc' }, limit, page);
  const enriched = await Promise.all(result.data.map(enrichHospitalScorecard));
  return { data: enriched, total: result.total };
};

export const getDepartmentScorecards = async (
  page: number = 1,
  limit: number = 50,
  departmentId?: string,
  type?: string,
): Promise<PaginationResult<any>> => {
  const filters: FilterConstraint[] = [];
  if (departmentId) filters.push({ field: 'department_id', op: '==', value: departmentId });
  if (type) filters.push({ field: 'type', op: '==', value: type });

  const result = await getDocsPaginated('departmentScorecards', filters, { field: 'period', dir: 'desc' }, limit, page);
  const enriched = await Promise.all(result.data.map(enrichDepartmentScorecard));
  return { data: enriched, total: result.total };
};

export const createHospitalScorecard = async (data: any): Promise<string> => {
  return addDocument('hospitalScorecards', { ...data, status: data.status || 'active' });
};

export const createDepartmentScorecard = async (data: any): Promise<string> => {
  return addDocument('departmentScorecards', { ...data, status: data.status || 'active' });
};

export const updateHospitalScorecard = async (id: string, data: any): Promise<void> => {
  await updateDocument('hospitalScorecards', id, data);
};

export const updateDepartmentScorecard = async (id: string, data: any): Promise<void> => {
  await updateDocument('departmentScorecards', id, data);
};

export const deleteHospitalScorecard = async (id: string): Promise<void> => {
  await deleteDocument('hospitalScorecards', id);
};

export const deleteDepartmentScorecard = async (id: string): Promise<void> => {
  await deleteDocument('departmentScorecards', id);
};

export const getHospitalStatistics = async (
  page: number = 1,
  limit: number = 50,
  hospitalId?: string,
): Promise<PaginationResult<any>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });

  const result = await getDocsPaginated('hospitalStatistics', filters, { field: 'reporting_period', dir: 'desc' }, limit, page);
  const enriched = await Promise.all(result.data.map(async (s: any) => {
    let hospital_name = 'Unknown';
    if (s.hospital_id) {
      const hosp = await getDocById('hospitals', s.hospital_id);
      hospital_name = hosp?.hospital_name || 'Unknown';
    }
    return { ...s, hospital_name };
  }));
  return { data: enriched, total: result.total };
};

export const createHospitalStatistic = async (data: any): Promise<string> => {
  return addDocument('hospitalStatistics', data);
};
