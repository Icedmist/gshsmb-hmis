import { addDocument, getDocsPaginated, updateDocument, deleteDocument, getDocById, getDocsAll } from './firestore';
import type { Document, DocumentCategory, DocumentVersion, DocumentType } from '../types';

export const getDocuments = async (
  page = 1, limit = 50, search?: string,
  categoryId?: string, documentType?: string, status?: string,
  hospitalScope?: string,
): Promise<{ data: Document[]; total: number }> => {
  const filters: any[] = [];
  if (categoryId) filters.push({ field: 'category_id', op: '==', value: categoryId });
  if (documentType) filters.push({ field: 'document_type', op: '==', value: documentType });
  if (status) filters.push({ field: 'status', op: '==', value: status });
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });

  if (search) {
    const { data } = await getDocsPaginated('documents', filters, { field: 'created_at', dir: 'desc' }, limit, page);
    const searchLower = search.toLowerCase();
    const filtered = data.filter((d: any) =>
      d.title?.toLowerCase().includes(searchLower) ||
      d.description?.toLowerCase().includes(searchLower) ||
      d.tags?.some((t: string) => t.toLowerCase().includes(searchLower))
    );
    return { data: filtered, total: filtered.length };
  }

  return getDocsPaginated('documents', filters, { field: 'created_at', dir: 'desc' }, limit, page);
};

export const getDocument = async (id: string): Promise<Document | null> => {
  return getDocById('documents', id);
};

export const createDocument = async (data: Omit<Document, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  return addDocument('documents', { ...data, version: 1, status: 'published' });
};

export const updateDocument = async (id: string, data: Partial<Document>): Promise<void> => {
  await updateDocument('documents', id, data);
};

export const deleteDocument = async (id: string): Promise<void> => {
  await deleteDocument('documents', id);
};

export const getDocumentCategories = async (): Promise<DocumentCategory[]> => {
  const { data } = await getDocsPaginated('document_categories', [], { field: 'name', dir: 'asc' }, 100, 1);
  return data;
};

export const createDocumentCategory = async (data: Omit<DocumentCategory, 'id' | 'created_at'>): Promise<string> => {
  return addDocument('document_categories', data);
};

export const deleteDocumentCategory = async (id: string): Promise<void> => {
  await deleteDocument('document_categories', id);
};

export const getDocumentVersions = async (documentId: string): Promise<DocumentVersion[]> => {
  const { data } = await getDocsPaginated('document_versions', [{ field: 'document_id', op: '==', value: documentId }], { field: 'version', dir: 'desc' }, 100, 1);
  return data;
};

export const createDocumentVersion = async (data: Omit<DocumentVersion, 'id' | 'created_at'>): Promise<string> => {
  return addDocument('document_versions', data);
};

export const archiveDocument = async (id: string): Promise<void> => {
  await updateDocument('documents', id, { status: 'archived' });
};

export const publishDocument = async (id: string): Promise<void> => {
  await updateDocument('documents', id, { status: 'published' });
};
