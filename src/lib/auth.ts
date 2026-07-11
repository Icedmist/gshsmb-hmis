import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser,
} from 'firebase/auth';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db } from './firebase';
import { addDocument } from './firestore';

export interface UserProfile {
  id: string;
  firebase_uid: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
  hospital_id: string | null;
  avatar_url: string | null;
  status: string;
  created_at: any;
  updated_at: any;
}

export const loginUser = async (email: string, password: string): Promise<{ user: FirebaseUser; profile: UserProfile }> => {
  const cred = await signInWithEmailAndPassword(auth, email, password);

  const q = query(
    collection(db, 'users'),
    where('firebase_uid', '==', cred.user.uid),
    limit(1)
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error('Account not found. Contact administrator.');
  }

  const profileDoc = snap.docs[0];
  const profile = { id: profileDoc.id, ...profileDoc.data() } as UserProfile;

  if (profile.status === 'inactive') {
    throw new Error('Your account has been deactivated. Please contact your administrator.');
  }
  if (profile.status === 'suspended') {
    throw new Error('Your account has been suspended. Please contact your administrator.');
  }

  try {
    await addDocument('auditLogs', {
      user_id: profile.id,
      action: 'LOGIN',
      entity_type: 'user',
      entity_id: profile.id,
      details: `User ${profile.full_name} logged in`,
      ip_address: 'client',
    });
  } catch {}

  return { user: cred.user, profile };
};

export const logoutUser = async (): Promise<void> => {
  const user = auth.currentUser;
  if (user) {
    try {
      const q = query(
        collection(db, 'users'),
        where('firebase_uid', '==', user.uid),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const profileId = snap.docs[0].id;
        await addDocument('auditLogs', {
          user_id: profileId,
          action: 'LOGOUT',
          entity_type: 'user',
          entity_id: profileId,
          details: 'User logged out',
          ip_address: 'client',
        });
      }
    } catch {}
  }
  await signOut(auth);
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const q = query(
    collection(db, 'users'),
    where('firebase_uid', '==', uid),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as UserProfile;
};

export const changeUserPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('Not authenticated.');

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);

  const q = query(
    collection(db, 'users'),
    where('firebase_uid', '==', user.uid),
    limit(1)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    await addDocument('auditLogs', {
      user_id: snap.docs[0].id,
      action: 'CHANGE_PASSWORD',
      entity_type: 'user',
      entity_id: snap.docs[0].id,
      details: 'User changed password',
      ip_address: 'client',
    });
  }
};

export const resetUserPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
