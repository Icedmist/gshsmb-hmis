import { getDocsAll } from './firestore';
import type { SearchResult } from '../types';

export const globalSearch = async (query: string, _hospitalScope?: string): Promise<SearchResult[]> => {
  if (!query || query.trim().length < 2) return [];

  const results: SearchResult[] = [];
  const searchLower = query.toLowerCase();

  const searchInCollection = async (col: string, entityType: string, titleField: string, subtitleField?: string, statusField?: string): Promise<SearchResult[]> => {
    try {
      const all = await getDocsAll(col);
      const filtered = all.filter((item: any) => {
        const title = (item[titleField] || '').toLowerCase();
        if (title.includes(searchLower)) return true;
        if (subtitleField && (item[subtitleField] || '').toLowerCase().includes(searchLower)) return true;
        if (item.tags?.some((t: string) => t.toLowerCase().includes(searchLower))) return true;
        return false;
      });
      return filtered.slice(0, 10).map((item: any) => ({
        id: item.id,
        entity_type: entityType,
        title: item[titleField] || '',
        subtitle: subtitleField ? item[subtitleField] : undefined,
        url: `/${col}`,
        hospital_name: item.hospital_name,
        status: statusField ? item[statusField] : undefined,
        created_at: item.created_at,
      }));
    } catch {
      return [];
    }
  };

  const collections = [
    { col: 'employees', type: 'employee', title: 'full_name', sub: 'staff_id', status: 'status' },
    { col: 'hospitals', type: 'hospital', title: 'hospital_name', sub: 'hospital_code', status: 'status' },
    { col: 'departments', type: 'department', title: 'department_name', sub: 'department_code', status: 'status' },
    { col: 'documents', type: 'document', title: 'title', sub: 'description', status: 'status' },
    { col: 'clinical_guidelines', type: 'guideline', title: 'title', sub: 'department_name', status: 'status' },
    { col: 'clinical_audits', type: 'audit', title: 'audit_name', sub: 'hospital_name', status: 'status' },
    { col: 'medicines', type: 'medicine', title: 'medicine_name', sub: 'generic_name', status: 'status' },
    { col: 'laboratory_equipment', type: 'equipment', title: 'equipment_name', sub: 'model', status: 'status' },
    { col: 'kpis', type: 'kpi', title: 'name', sub: 'description' },
    { col: 'research_projects', type: 'research', title: 'project_title', sub: 'description', status: 'status' },
  ];

  for (const c of collections) {
    const items = await searchInCollection(c.col, c.type, c.title, c.sub, c.status);
    results.push(...items);
  }

  return results.slice(0, 50);
};
