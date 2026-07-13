import { getDocById, getDocsPaginated, addDocument, updateDocument, deleteDocument, getDocsAll, type FilterConstraint, type PaginationResult } from './firestore';
import type { KPI } from '../types';

const enrichKPI = async (k: any): Promise<any> => {
  let hospital_name: string | undefined;
  let department_name: string | undefined;
  if (k.hospital_id) {
    const hosp = await getDocById('hospitals', k.hospital_id);
    hospital_name = hosp?.hospital_name;
  }
  if (k.department_id) {
    const dept = await getDocById('departments', k.department_id);
    department_name = dept?.department_name;
  }
  return { ...k, hospital_name, department_name };
};

export const getKPIs = async (
  page: number = 1,
  limit: number = 50,
  search?: string,
  status?: string,
  hospitalId?: string,
): Promise<PaginationResult<KPI>> => {
  const filters: FilterConstraint[] = [];
  if (status) filters.push({ field: 'status', op: '==', value: status });
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });

  if (search) {
    const { data } = await getDocsPaginated('kpis', filters, { field: 'name', dir: 'asc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((k: any) =>
      k.name?.toLowerCase().includes(searchLower)
    );
    const enriched = await Promise.all(filtered.map(enrichKPI));
    return { data: enriched, total: enriched.length };
  }

  const result = await getDocsPaginated('kpis', filters, { field: 'name', dir: 'asc' }, limit, page);
  const enriched = await Promise.all(result.data.map(enrichKPI));
  return { data: enriched, total: result.total };
};

export const getKPI = async (id: string): Promise<any | null> => {
  const k = await getDocById('kpis', id);
  if (!k) return null;
  return enrichKPI(k);
};

export const createKPI = async (data: any): Promise<string> => {
  return addDocument('kpis', { ...data, status: data.status || 'active', actual_value: data.actual_value || 0 });
};

export const updateKPI = async (id: string, data: any): Promise<void> => {
  await updateDocument('kpis', id, data);
};

export const deleteKPI = async (id: string): Promise<void> => {
  await deleteDocument('kpis', id);
};

export const getAllKPIs = async (hospitalId?: string): Promise<any[]> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
  const data = await getDocsAll('kpis', filters, { field: 'name', dir: 'asc' });
  return Promise.all(data.map(enrichKPI));
};

export const getPerformanceIndicators = async (kpiId?: string): Promise<any[]> => {
  const filters: FilterConstraint[] = [];
  if (kpiId) filters.push({ field: 'kpi_id', op: '==', value: kpiId });
  const data = await getDocsAll('performanceIndicators', filters, { field: 'reporting_period', dir: 'desc' });
  return Promise.all(data.map(async (p: any) => {
    let kpi_name = 'Unknown';
    if (p.kpi_id) {
      const kpi = await getDocById('kpis', p.kpi_id);
      kpi_name = kpi?.name || 'Unknown';
    }
    return { ...p, kpi_name };
  }));
};

export const createPerformanceIndicator = async (data: any): Promise<string> => {
  return addDocument('performanceIndicators', data);
};

export const getKpiSummary = async (): Promise<any> => {
  const kpis = await getDocsAll('kpis', [{ field: 'status', op: '==', value: 'active' }]);
  let total = 0, achieved = 0;
  for (const k of kpis) {
    total++;
    if (k.actual_value >= k.target) achieved++;
  }
  return { total, achieved, rate: total > 0 ? Math.round((achieved / total) * 100) : 0 };
};
