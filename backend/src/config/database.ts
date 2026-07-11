import { firestore } from './firebase';
import { Timestamp } from 'firebase-admin/firestore';

type DocData = Record<string, any>;

const now = (): FirebaseFirestore.Timestamp => Timestamp.now();
const docToData = (doc: FirebaseFirestore.DocumentSnapshot): any => {
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

const collection = (name: string) => firestore.collection(name);

export const getDoc = async (col: string, id: string): Promise<any | null> => {
  const snap = await collection(col).doc(id).get();
  return docToData(snap);
};

export const getDocs = async (
  col: string,
  filters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [],
  orderBy?: { field: string; dir?: 'asc' | 'desc' },
  limit?: number,
  offset?: number,
): Promise<{ data: any[]; total: number }> => {
  let ref: FirebaseFirestore.Query = collection(col);

  for (const f of filters) {
    ref = ref.where(f.field, f.op, f.value);
  }

  const countSnap = await ref.count().get();
  const total = countSnap.data().count;

  if (orderBy) ref = ref.orderBy(orderBy.field, orderBy.dir || 'asc');
  if (limit) ref = ref.limit(limit);
  if (offset) ref = ref.offset(offset);

  const snap = await ref.get();
  const data = snap.docs.map(docToData);
  return { data, total };
};

export const addDoc = async (col: string, data: DocData): Promise<string> => {
  data.created_at = now();
  data.updated_at = now();
  const ref = await collection(col).add(data);
  return ref.id;
};

export const updateDoc = async (col: string, id: string, data: DocData): Promise<void> => {
  data.updated_at = now();
  await collection(col).doc(id).update(data);
};

export const setDoc = async (col: string, id: string, data: DocData): Promise<void> => {
  data.updated_at = now();
  if (!data.created_at) data.created_at = now();
  await collection(col).doc(id).set(data, { merge: true });
};

export const deleteDoc = async (col: string, id: string): Promise<void> => {
  await collection(col).doc(id).delete();
};

export const countDocs = async (
  col: string,
  filters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [],
): Promise<number> => {
  let ref: FirebaseFirestore.Query = collection(col);
  for (const f of filters) ref = ref.where(f.field, f.op, f.value);
  const snap = await ref.count().get();
  return snap.data().count;
};

export const getDocsAll = async (
  col: string,
  filters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [],
  orderBy?: { field: string; dir?: 'asc' | 'desc' },
): Promise<any[]> => {
  let ref: FirebaseFirestore.Query = collection(col);
  for (const f of filters) ref = ref.where(f.field, f.op, f.value);
  if (orderBy) ref = ref.orderBy(orderBy.field, orderBy.dir || 'asc');
  const snap = await ref.get();
  return snap.docs.map(docToData);
};

export const searchDocs = async (
  col: string,
  searchField: string,
  searchTerm: string,
  filters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [],
  limit?: number,
): Promise<any[]> => {
  let ref: FirebaseFirestore.Query = collection(col);
  for (const f of filters) ref = ref.where(f.field, f.op, f.value);
  ref = ref.where(searchField, '>=', searchTerm);
  ref = ref.where(searchField, '<=', searchTerm + '\uf8ff');
  if (limit) ref = ref.limit(limit);
  const snap = await ref.get();
  return snap.docs.map(docToData);
};

export { now, docToData, Timestamp };
