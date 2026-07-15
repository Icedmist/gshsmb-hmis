import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  role: string;
  hospitalId?: string | null;
  phoneNumber?: string;
}

export const createUser = functions.https.onCall(async (data: CreateUserRequest, context: functions.https.CallableContext) => {
  // Verify the caller is a super_admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated.');
  }

  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!callerDoc.exists || callerDoc.data()?.role !== 'super_admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only super admins can create users.');
  }

  if (!data.email || !data.password || !data.fullName || !data.role) {
    throw new functions.https.HttpsError('invalid-argument', 'Email, password, full name, and role are required.');
  }

  const validRoles = ['super_admin', 'executive_secretary', 'hospital_admin', 'hr_officer', 'director_medical_services', 'director_nursing_services', 'director_prs', 'director_pharmaceutical_services', 'director_laboratory_services'];
  if (!validRoles.includes(data.role)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid role.');
  }

  if (data.role === 'hospital_admin' && !data.hospitalId) {
    throw new functions.https.HttpsError('invalid-argument', 'Hospital ID is required for hospital admin role.');
  }

  try {
    // Create Firebase Auth user
    const firebaseUser = await auth.createUser({
      email: data.email,
      password: data.password,
      displayName: data.fullName,
    });

    // Create Firestore user profile with doc ID = UID
    await db.collection('users').doc(firebaseUser.uid).set({
      firebase_uid: firebaseUser.uid,
      full_name: data.fullName,
      email: data.email,
      phone_number: data.phoneNumber || null,
      role: data.role,
      hospital_id: data.hospitalId || null,
      avatar_url: null,
      status: 'active',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log audit
    await db.collection('auditLogs').add({
      user_id: firebaseUser.uid,
      action: 'CREATE_USER',
      entity_type: 'user',
      entity_id: firebaseUser.uid,
      details: `Created user ${data.fullName} with role ${data.role}`,
      ip_address: context.rawRequest?.ip || 'cloud-function',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, userId: firebaseUser.uid };
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError('already-exists', 'A user with this email already exists.');
    }
    throw new functions.https.HttpsError('internal', 'Failed to create user.');
  }
});

export const deleteUser = functions.https.onCall(async (data: { userId: string }, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated.');
  }

  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!callerDoc.exists || callerDoc.data()?.role !== 'super_admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only super admins can delete users.');
  }

  const { userId } = data;
  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'User ID is required.');
  }

  if (userId === context.auth.uid) {
    throw new functions.https.HttpsError('failed-precondition', 'You cannot delete your own account.');
  }

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found.');
    }

    const userData = userDoc.data()!;
    if (userData.firebase_uid) {
      await auth.deleteUser(userData.firebase_uid).catch(() => {});
    }

    await db.collection('users').doc(userId).delete();

    await db.collection('auditLogs').add({
      user_id: context.auth.uid,
      action: 'DELETE_USER',
      entity_type: 'user',
      entity_id: userId,
      details: `Deleted user ${userData.full_name}`,
      ip_address: context.rawRequest?.ip || 'cloud-function',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', 'Failed to delete user.');
  }
});
