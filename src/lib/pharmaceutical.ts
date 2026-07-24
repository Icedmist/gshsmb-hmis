import { getDocById, getDocsPaginated, getDocsAll, addDocument, updateDocument, deleteDocument, type FilterConstraint, type PaginationResult } from './firestore';

const enrichHospital = async (item: any, field: string = 'hospital_id'): Promise<any> => {
  let hospital_name = 'Unknown';
  if (item[field]) {
    const hosp = await getDocById('hospitals', item[field]);
    hospital_name = hosp?.hospital_name || 'Unknown';
  }
  return { ...item, hospital_name };
};

// Medicines
export const getMedicines = async (page = 1, limit = 50, search?: string, hospitalId?: string): Promise<PaginationResult<any>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  if (search) {
    const { data } = await getDocsPaginated('medicines', filters, { field: 'name', dir: 'asc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((m: any) => m.name?.toLowerCase().includes(searchLower) || m.generic_name?.toLowerCase().includes(searchLower));
    return { data: await Promise.all(filtered.map((m: any) => enrichHospital(m))), total: filtered.length };
  }
  const result = await getDocsPaginated('medicines', filters, { field: 'name', dir: 'asc' }, limit, page);
  return { data: await Promise.all(result.data.map((m: any) => enrichHospital(m))), total: result.total };
};

export const createMedicine = async (data: any): Promise<string> => addDocument('medicines', { ...data, status: data.status || 'active' });
export const updateMedicine = async (id: string, data: any): Promise<void> => updateDocument('medicines', id, data);
export const deleteMedicine = async (id: string): Promise<void> => deleteDocument('medicines', id);
export const getAllMedicines = async (hospitalId?: string): Promise<any[]> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  return getDocsAll('medicines', filters);
};

// Essential Medicines
export const getEssentialMedicines = async (page = 1, limit = 50, search?: string): Promise<PaginationResult<any>> => {
  const filters: FilterConstraint[] = [];
  if (search) {
    const { data } = await getDocsPaginated('essentialMedicines', filters, { field: 'name', dir: 'asc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((m: any) => m.name?.toLowerCase().includes(searchLower) || m.generic_name?.toLowerCase().includes(searchLower));
    return { data: filtered, total: filtered.length };
  }
  return getDocsPaginated('essentialMedicines', filters, { field: 'name', dir: 'asc' }, limit, page);
};

export const createEssentialMedicine = async (data: any): Promise<string> => addDocument('essentialMedicines', { ...data, status: data.status || 'active' });
export const updateEssentialMedicine = async (id: string, data: any): Promise<void> => updateDocument('essentialMedicines', id, data);
export const deleteEssentialMedicine = async (id: string): Promise<void> => deleteDocument('essentialMedicines', id);
export const getAllEssentialMedicines = async (): Promise<any[]> => getDocsAll('essentialMedicines');

// Pharmaceutical Audits
export const getPharmaceuticalAudits = async (page = 1, limit = 50, search?: string, hospitalId?: string): Promise<PaginationResult<any>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  if (search) {
    const { data } = await getDocsPaginated('pharmaceuticalAudits', filters, { field: 'audit_date', dir: 'desc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((a: any) => a.title?.toLowerCase().includes(searchLower));
    return { data: await Promise.all(filtered.map((a: any) => enrichHospital(a))), total: filtered.length };
  }
  const result = await getDocsPaginated('pharmaceuticalAudits', filters, { field: 'audit_date', dir: 'desc' }, limit, page);
  return { data: await Promise.all(result.data.map((a: any) => enrichHospital(a))), total: result.total };
};

export const createPharmaceuticalAudit = async (data: any): Promise<string> => addDocument('pharmaceuticalAudits', { ...data, status: data.status || 'active' });
export const updatePharmaceuticalAudit = async (id: string, data: any): Promise<void> => updateDocument('pharmaceuticalAudits', id, data);
export const deletePharmaceuticalAudit = async (id: string): Promise<void> => deleteDocument('pharmaceuticalAudits', id);

export const getPharmaceuticalAuditFindings = async (auditId: string): Promise<any[]> =>
  getDocsAll('pharmaceuticalAuditFindings', [{ field: 'audit_id', op: '==', value: auditId }], { field: 'created_at', dir: 'asc' });
export const createPharmaceuticalAuditFinding = async (data: any): Promise<string> => addDocument('pharmaceuticalAuditFindings', { ...data, implemented: false });
export const updatePharmaceuticalAuditFinding = async (id: string, data: any): Promise<void> => updateDocument('pharmaceuticalAuditFindings', id, data);

// Pharmaceutical Workforce
export const getPharmaceuticalWorkforce = async (page = 1, limit = 50, search?: string, hospitalId?: string): Promise<PaginationResult<any>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  if (search) {
    const { data } = await getDocsPaginated('pharmaceuticalWorkforce', filters, { field: 'reporting_period', dir: 'desc' }, limit, page);
    return { data: await Promise.all(data.map((w: any) => enrichHospital(w))), total: data.length };
  }
  const result = await getDocsPaginated('pharmaceuticalWorkforce', filters, { field: 'reporting_period', dir: 'desc' }, limit, page);
  return { data: await Promise.all(result.data.map((w: any) => enrichHospital(w))), total: result.total };
};

export const createPharmaceuticalWorkforce = async (data: any): Promise<string> => addDocument('pharmaceuticalWorkforce', data);
export const updatePharmaceuticalWorkforce = async (id: string, data: any): Promise<void> => updateDocument('pharmaceuticalWorkforce', id, data);
export const getAllPharmaceuticalWorkforce = async (hospitalId?: string): Promise<any[]> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  return getDocsAll('pharmaceuticalWorkforce', filters);
};

// Pharmacovigilance
export const getPharmacovigilanceReports = async (page = 1, limit = 50, search?: string, hospitalId?: string): Promise<PaginationResult<any>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  if (search) {
    const { data } = await getDocsPaginated('pharmacovigilanceReports', filters, { field: 'report_date', dir: 'desc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((r: any) => r.drug_name?.toLowerCase().includes(searchLower) || r.adverse_effect?.toLowerCase().includes(searchLower));
    return { data: await Promise.all(filtered.map((r: any) => enrichHospital(r))), total: filtered.length };
  }
  const result = await getDocsPaginated('pharmacovigilanceReports', filters, { field: 'report_date', dir: 'desc' }, limit, page);
  return { data: await Promise.all(result.data.map((r: any) => enrichHospital(r))), total: result.total };
};

export const createPharmacovigilanceReport = async (data: any): Promise<string> => addDocument('pharmacovigilanceReports', { ...data, status: data.status || 'active' });
export const updatePharmacovigilanceReport = async (id: string, data: any): Promise<void> => updateDocument('pharmacovigilanceReports', id, data);
export const getAllPharmacovigilanceReports = async (hospitalId?: string): Promise<any[]> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  return getDocsAll('pharmacovigilanceReports', filters);
};

// Quality Assurance Reports
export const getPharmaceuticalQualityReports = async (page = 1, limit = 50, search?: string, hospitalId?: string): Promise<PaginationResult<any>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  if (search) {
    const { data } = await getDocsPaginated('pharmaceuticalQualityReports', filters, { field: 'report_date', dir: 'desc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((r: any) => r.report_title?.toLowerCase().includes(searchLower));
    return { data: await Promise.all(filtered.map((r: any) => enrichHospital(r))), total: filtered.length };
  }
  const result = await getDocsPaginated('pharmaceuticalQualityReports', filters, { field: 'report_date', dir: 'desc' }, limit, page);
  return { data: await Promise.all(result.data.map((r: any) => enrichHospital(r))), total: result.total };
};

export const createPharmaceuticalQualityReport = async (data: any): Promise<string> => addDocument('pharmaceuticalQualityReports', { ...data, status: data.status || 'active' });
export const updatePharmaceuticalQualityReport = async (id: string, data: any): Promise<void> => updateDocument('pharmaceuticalQualityReports', id, data);
export const getAllPharmaceuticalQualityReports = async (hospitalId?: string): Promise<any[]> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  return getDocsAll('pharmaceuticalQualityReports', filters);
};

// Pharmaceutical Reports (generated)
export const getPharmaceuticalReports = async (page = 1, limit = 50, search?: string, hospitalId?: string): Promise<PaginationResult<any>> => {
  const filters: FilterConstraint[] = [{ field: 'report_category', op: '==', value: 'pharmaceutical' }];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  if (search) {
    const { data } = await getDocsPaginated('generatedReports', filters, { field: 'created_at', dir: 'desc' }, limit, page);
    const filtered = data.filter((r: any) => r.title?.toLowerCase().includes(search.toLowerCase()));
    return { data: filtered, total: filtered.length };
  }
  return getDocsPaginated('generatedReports', filters, { field: 'created_at', dir: 'desc' }, limit, page);
};
