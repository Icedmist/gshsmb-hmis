import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  count,
  Timestamp,
  DocumentData,
  QueryConstraint,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

export type FilterConstraint = {
  field: string;
  op: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'array-contains' | 'array-contains-any';
  value: any;
};

export type OrderConstraint = {
  field: string;
  dir?: 'asc' | 'desc';
};

export interface PaginationResult<T> {
  data: T[];
  total: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

const docToData = (snap: DocumentSnapshot<DocumentData>): any => {
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

export const getDocById = async (col: string, id: string): Promise<any | null> => {
  const snap = await getDoc(doc(db, col, id));
  return docToData(snap);
};

const buildQueryConstraints = (
  filters: FilterConstraint[] = [],
  orderByField?: OrderConstraint,
): QueryConstraint[] => {
  const constraints: QueryConstraint[] = [];
  for (const f of filters) {
    constraints.push(where(f.field, f.op, f.value));
  }
  if (orderByField) {
    constraints.push(orderBy(orderByField.field, orderByField.dir || 'asc'));
  }
  return constraints;
};

export const getDocsPaginated = async (
  col: string,
  filters: FilterConstraint[] = [],
  orderByField?: OrderConstraint,
  pageSize: number = 50,
  pageNum: number = 1,
): Promise<PaginationResult<any>> => {
  let constraints: QueryConstraint[];

  try {
    constraints = buildQueryConstraints(filters, orderByField);

    // Get total count
    const countQuery = query(collection(db, col), ...constraints);
    const countSnap = await getDocs(countQuery);
    const total = countSnap.size;

    // Get paginated data
    const dataConstraints = [...constraints, firestoreLimit(pageSize)];
    if (pageNum > 1) {
      const allDataQuery = query(collection(db, col), ...constraints, firestoreLimit(pageSize * pageNum));
      const allSnap = await getDocs(allDataQuery);
      const allDocs = allSnap.docs;
      const startIdx = (pageNum - 1) * pageSize;
      const pageDocs = allDocs.slice(startIdx, startIdx + pageSize);
      const data = pageDocs.map(docToData);
      return { data, total };
    }

    const dataQuery = query(collection(db, col), ...dataConstraints);
    const dataSnap = await getDocs(dataQuery);
    const data = dataSnap.docs.map(docToData);
    return { data, total };
  } catch (err) {
    // Fallback: if query failed (e.g. missing composite index), fetch without orderBy and sort in JS
    if (filters.length > 0 && orderByField) {
      const fallbackConstraints = buildQueryConstraints(filters);
      const allSnap = await getDocs(query(collection(db, col), ...fallbackConstraints));
      let allData = allSnap.docs.map(docToData);

      // Sort in JS
      const dir = orderByField.dir || 'asc';
      allData.sort((a: any, b: any) => {
        const aVal = a[orderByField.field] ?? '';
        const bVal = b[orderByField.field] ?? '';
        return dir === 'desc'
          ? String(bVal).localeCompare(String(aVal))
          : String(aVal).localeCompare(String(bVal));
      });

      const total = allData.length;
      const start = (pageNum - 1) * pageSize;
      const data = allData.slice(start, start + pageSize);
      return { data, total };
    }
    throw err;
  }
};

export const getDocsAll = async (
  col: string,
  filters: FilterConstraint[] = [],
  orderByField?: OrderConstraint,
): Promise<any[]> => {
  try {
    const constraints = buildQueryConstraints(filters, orderByField);
    const q = query(collection(db, col), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(docToData);
  } catch (err) {
    // Fallback: missing composite index — fetch without orderBy and sort in JS
    if (filters.length > 0 && orderByField) {
      const fallbackConstraints = buildQueryConstraints(filters);
      const allSnap = await getDocs(query(collection(db, col), ...fallbackConstraints));
      const allData = allSnap.docs.map(docToData);

      const dir = orderByField.dir || 'asc';
      allData.sort((a: any, b: any) => {
        const aVal = a[orderByField.field] ?? '';
        const bVal = b[orderByField.field] ?? '';
        return dir === 'desc'
          ? String(bVal).localeCompare(String(aVal))
          : String(aVal).localeCompare(String(bVal));
      });
      return allData;
    }
    throw err;
  }
};

export const addDocument = async (col: string, data: DocumentData): Promise<string> => {
  const docData = {
    ...data,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  };
  const ref = await addDoc(collection(db, col), docData);
  return ref.id;
};

export const updateDocument = async (col: string, id: string, data: DocumentData): Promise<void> => {
  const docData = {
    ...data,
    updated_at: Timestamp.now(),
  };
  await updateDoc(doc(db, col, id), docData);
};

export const setDocument = async (col: string, id: string, data: DocumentData): Promise<void> => {
  const docData = {
    ...data,
    updated_at: Timestamp.now(),
    created_at: data.created_at || Timestamp.now(),
  };
  await setDoc(doc(db, col, id), docData, { merge: true });
};

export const deleteDocument = async (col: string, id: string): Promise<void> => {
  await deleteDoc(doc(db, col, id));
};

export const countDocs = async (
  col: string,
  filters: FilterConstraint[] = [],
): Promise<number> => {
  const constraints: QueryConstraint[] = [];
  for (const f of filters) {
    constraints.push(where(f.field, f.op, f.value));
  }
  const q = query(collection(db, col), ...constraints);
  const snap = await getDocs(q);
  return snap.size;
};

export const searchDocs = async (
  col: string,
  searchField: string,
  searchTerm: string,
  filters: FilterConstraint[] = [],
  maxResults: number = 50,
): Promise<any[]> => {
  const constraints: QueryConstraint[] = [];
  for (const f of filters) {
    constraints.push(where(f.field, f.op, f.value));
  }
  constraints.push(where(searchField, '>=', searchTerm));
  constraints.push(where(searchField, '<=', searchTerm + '\uf8ff'));
  constraints.push(firestoreLimit(maxResults));
  const q = query(collection(db, col), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(docToData);
};
