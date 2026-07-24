import { getDocById, getDocsPaginated, getDocsAll, addDocument, updateDocument, deleteDocument, type FilterConstraint, type PaginationResult } from './firestore';

const enrichHospital = async (item: any, field: string = 'hospital_id'): Promise<any> => {
  let hospital_name = 'Unknown';
  if (item[field]) {
    const hosp = await getDocById('hospitals', item[field]);
    hospital_name = hosp?.hospital_name || 'Unknown';
  }
  return { ...item, hospital_name };
};

// Laboratories
export const getLaboratories = async (page = 1, limit = 50, search?: string, hospitalId?: string): Promise<PaginationResult<any>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  if (search) {
    const { data } = await getDocsPaginated('laboratories', filters, { field: 'lab_name', dir: 'asc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((l: any) => l.lab_name?.toLowerCase().includes(searchLower));
    return { data: await Promise.all(filtered.map((l: any) => enrichHospital(l))), total: filtered.length };
  }
  const result = await getDocsPaginated('laboratories', filters, { field: 'lab_name', dir: 'asc' }, limit, page);
  return { data: await Promise.all(result.data.map((l: any) => enrichHospital(l))), total: result.total };
};

export const createLaboratory = async (data: any): Promise<string> => addDocument('laboratories', { ...data, status: data.status || 'active' });
export const updateLaboratory = async (id: string, data: any): Promise<void> => updateDocument('laboratories', id, data);
export const deleteLaboratory = async (id: string): Promise<void> => deleteDocument('laboratories', id);
export const getAllLaboratories = async (): Promise<any[]> => getDocsAll('laboratories');

// Laboratory Audits
export const getLaboratoryAudits = async (page = 1, limit = 50, search?: string, hospitalId?: string): Promise<PaginationResult<any>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  if (search) {
    const { data } = await getDocsPaginated('laboratoryAudits', filters, { field: 'audit_date', dir: 'desc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((a: any) => a.title?.toLowerCase().includes(searchLower));
    return { data: await Promise.all(filtered.map((a: any) => enrichHospital(a))), total: filtered.length };
  }
  const result = await getDocsPaginated('laboratoryAudits', filters, { field: 'audit_date', dir: 'desc' }, limit, page);
  return { data: await Promise.all(result.data.map((a: any) => enrichHospital(a))), total: result.total };
};

export const createLaboratoryAudit = async (data: any): Promise<string> => addDocument('laboratoryAudits', { ...data, status: data.status || 'active' });
export const updateLaboratoryAudit = async (id: string, data: any): Promise<void> => updateDocument('laboratoryAudits', id, data);
export const deleteLaboratoryAudit = async (id: string): Promise<void> => deleteDocument('laboratoryAudits', id);

export const getLaboratoryAuditFindings = async (auditId: string): Promise<any[]> =>
  getDocsAll('laboratoryAuditFindings', [{ field: 'audit_id', op: '==', value: auditId }], { field: 'created_at', dir: 'asc' });
export const createLaboratoryAuditFinding = async (data: any): Promise<string> => addDocument('laboratoryAuditFindings', { ...data, implemented: false });
export const updateLaboratoryAuditFinding = async (id: string, data: any): Promise<void> => updateDocument('laboratoryAuditFindings', id, data);

// Laboratory Workforce
export const getLaboratoryWorkforce = async (page = 1, limit = 50, search?: string, hospitalId?: string): Promise<PaginationResult<any>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  if (search) {
    const { data } = await getDocsPaginated('laboratoryWorkforce', filters, { field: 'reporting_period', dir: 'desc' }, limit, page);
    return { data: await Promise.all(data.map((w: any) => enrichHospital(w))), total: data.length };
  }
  const result = await getDocsPaginated('laboratoryWorkforce', filters, { field: 'reporting_period', dir: 'desc' }, limit, page);
  return { data: await Promise.all(result.data.map((w: any) => enrichHospital(w))), total: result.total };
};

export const createLaboratoryWorkforce = async (data: any): Promise<string> => addDocument('laboratoryWorkforce', data);
export const updateLaboratoryWorkforce = async (id: string, data: any): Promise<void> => updateDocument('laboratoryWorkforce', id, data);
export const getAllLaboratoryWorkforce = async (): Promise<any[]> => getDocsAll('laboratoryWorkforce');

// Equipment
export const getLaboratoryEquipment = async (page = 1, limit = 50, search?: string, hospitalId?: string): Promise<PaginationResult<any>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  if (search) {
    const { data } = await getDocsPaginated('laboratoryEquipment', filters, { field: 'equipment_name', dir: 'asc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((e: any) => e.equipment_name?.toLowerCase().includes(searchLower));
    return { data: await Promise.all(filtered.map((e: any) => enrichHospital(e))), total: filtered.length };
  }
  const result = await getDocsPaginated('laboratoryEquipment', filters, { field: 'equipment_name', dir: 'asc' }, limit, page);
  return { data: await Promise.all(result.data.map((e: any) => enrichHospital(e))), total: result.total };
};

export const createLaboratoryEquipment = async (data: any): Promise<string> => addDocument('laboratoryEquipment', data);
export const updateLaboratoryEquipment = async (id: string, data: any): Promise<void> => updateDocument('laboratoryEquipment', id, data);
export const getAllLaboratoryEquipment = async (hospitalId?: string): Promise<any[]> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  return getDocsAll('laboratoryEquipment', filters);
};
export const deleteLaboratoryEquipment = async (id: string): Promise<void> => deleteDocument('laboratoryEquipment', id);

// Maintenance Records
export const getEquipmentMaintenance = async (page = 1, limit = 50, search?: string, equipmentId?: string, hospitalId?: string): Promise<PaginationResult<any>> => {
  const filters: FilterConstraint[] = [];
  if (equipmentId) filters.push({ field: 'equipment_id', op: '==', value: equipmentId });
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  if (search) {
    const { data } = await getDocsPaginated('equipmentMaintenance', filters, { field: 'maintenance_date', dir: 'desc' }, limit, page);
    return { data: await Promise.all(data.map((m: any) => enrichHospital(m))), total: data.length };
  }
  const result = await getDocsPaginated('equipmentMaintenance', filters, { field: 'maintenance_date', dir: 'desc' }, limit, page);
  return { data: await Promise.all(result.data.map((m: any) => enrichHospital(m))), total: result.total };
};

export const createEquipmentMaintenance = async (data: any): Promise<string> => addDocument('equipmentMaintenance', { ...data, status: data.status || 'active' });
export const updateEquipmentMaintenance = async (id: string, data: any): Promise<void> => updateDocument('equipmentMaintenance', id, data);
export const getAllEquipmentMaintenance = async (equipmentId?: string): Promise<any[]> => {
  const filters: FilterConstraint[] = [];
  if (equipmentId) filters.push({ field: 'equipment_id', op: '==', value: equipmentId });
  return getDocsAll('equipmentMaintenance', filters);
};

// Reagents
export const getLaboratoryReagents = async (page = 1, limit = 50, search?: string, hospitalId?: string): Promise<PaginationResult<any>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  if (search) {
    const { data } = await getDocsPaginated('laboratoryReagents', filters, { field: 'reagent_name', dir: 'asc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((r: any) => r.reagent_name?.toLowerCase().includes(searchLower));
    return { data: await Promise.all(filtered.map((r: any) => enrichHospital(r))), total: filtered.length };
  }
  const result = await getDocsPaginated('laboratoryReagents', filters, { field: 'reagent_name', dir: 'asc' }, limit, page);
  return { data: await Promise.all(result.data.map((r: any) => enrichHospital(r))), total: result.total };
};

export const createLaboratoryReagent = async (data: any): Promise<string> => addDocument('laboratoryReagents', { ...data, status: data.status || 'active' });
export const updateLaboratoryReagent = async (id: string, data: any): Promise<void> => updateDocument('laboratoryReagents', id, data);
export const getAllLaboratoryReagents = async (hospitalId?: string): Promise<any[]> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  return getDocsAll('laboratoryReagents', filters);
};

// Disease Surveillance
export const getDiseaseSurveillanceReports = async (page = 1, limit = 50, search?: string, hospitalId?: string): Promise<PaginationResult<any>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  if (search) {
    const { data } = await getDocsPaginated('diseaseSurveillanceReports', filters, { field: 'reporting_period', dir: 'desc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((r: any) => r.disease_name?.toLowerCase().includes(searchLower));
    return { data: await Promise.all(filtered.map((r: any) => enrichHospital(r))), total: filtered.length };
  }
  const result = await getDocsPaginated('diseaseSurveillanceReports', filters, { field: 'reporting_period', dir: 'desc' }, limit, page);
  return { data: await Promise.all(result.data.map((r: any) => enrichHospital(r))), total: result.total };
};

export const createDiseaseSurveillanceReport = async (data: any): Promise<string> => addDocument('diseaseSurveillanceReports', { ...data, status: data.status || 'active' });
export const updateDiseaseSurveillanceReport = async (id: string, data: any): Promise<void> => updateDocument('diseaseSurveillanceReports', id, data);
export const deleteDiseaseSurveillanceReport = async (id: string): Promise<void> => deleteDocument('diseaseSurveillanceReports', id);
export const getAllDiseaseSurveillanceReports = async (): Promise<any[]> => getDocsAll('diseaseSurveillanceReports');

// Laboratory Statistics
export const getLaboratoryStatistics = async (page = 1, limit = 50, search?: string, hospitalId?: string): Promise<PaginationResult<any>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  if (search) {
    const { data } = await getDocsPaginated('laboratoryStatistics', filters, { field: 'reporting_period', dir: 'desc' }, limit, page);
    return { data: await Promise.all(data.map((s: any) => enrichHospital(s))), total: data.length };
  }
  const result = await getDocsPaginated('laboratoryStatistics', filters, { field: 'reporting_period', dir: 'desc' }, limit, page);
  return { data: await Promise.all(result.data.map((s: any) => enrichHospital(s))), total: result.total };
};

export const createLaboratoryStatistic = async (data: any): Promise<string> => addDocument('laboratoryStatistics', data);
export const getAllLaboratoryStatistics = async (): Promise<any[]> => getDocsAll('laboratoryStatistics');

// Lab Reports (generated)
export const getLaboratoryReports = async (page = 1, limit = 50, search?: string, hospitalId?: string): Promise<PaginationResult<any>> => {
  const filters: FilterConstraint[] = [{ field: 'report_category', op: '==', value: 'laboratory' }];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  if (search) {
    const { data } = await getDocsPaginated('generatedReports', filters, { field: 'created_at', dir: 'desc' }, limit, page);
    const filtered = data.filter((r: any) => r.title?.toLowerCase().includes(search.toLowerCase()));
    return { data: filtered, total: filtered.length };
  }
  return getDocsPaginated('generatedReports', filters, { field: 'created_at', dir: 'desc' }, limit, page);
};
