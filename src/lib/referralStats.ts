import { getDocById, getDocsPaginated, addDocument, updateDocument, deleteDocument, type FilterConstraint, type PaginationResult } from './firestore';
import type { ReferralStatistic } from '../types';

const enrichReferral = async (r: any): Promise<any> => {
  let hospital_name = 'Unknown';
  if (r.hospital_id) {
    const hosp = await getDocById('hospitals', r.hospital_id);
    hospital_name = hosp?.hospital_name || 'Unknown';
  }
  return { ...r, hospital_name };
};

export const getReferralStats = async (
  page: number = 1,
  limit: number = 50,
  search?: string,
  hospitalId?: string,
): Promise<PaginationResult<ReferralStatistic>> => {
  const filters: FilterConstraint[] = [];
  if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });

  if (search) {
    const { data } = await getDocsPaginated('referralStatistics', filters, { field: 'reporting_period', dir: 'desc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((r: any) =>
      r.incident_type?.toLowerCase().includes(searchLower) ||
      r.hospital_name?.toLowerCase().includes(searchLower)
    );
    const enriched = await Promise.all(filtered.map(enrichReferral));
    return { data: enriched, total: enriched.length };
  }

  const result = await getDocsPaginated('referralStatistics', filters, { field: 'reporting_period', dir: 'desc' }, limit, page);
  const enriched = await Promise.all(result.data.map(enrichReferral));
  return { data: enriched, total: result.total };
};

export const createReferralStat = async (data: any): Promise<string> => {
  return addDocument('referralStatistics', data);
};

export const updateReferralStat = async (id: string, data: any): Promise<void> => {
  await updateDocument('referralStatistics', id, data);
};

export const deleteReferralStat = async (id: string): Promise<void> => {
  await deleteDocument('referralStatistics', id);
};
