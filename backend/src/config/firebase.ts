import admin from 'firebase-admin';

const firebaseConfig = {
  apiKey: 'AIzaSyBAPDC4DI9JtrNli_r6YHyZNy-lX72FwYo',
  authDomain: 'gshms-76f30.firebaseapp.com',
  projectId: 'gshms-76f30',
  storageBucket: 'gshms-76f30.firebasestorage.app',
  messagingSenderId: '487972944230',
  appId: '1:487972944230:web:d9f48fc6c21ac8a7fef0a7',
  measurementId: 'G-EWLW4V82JJ',
};

const isEmulator = !!(
  process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST
);

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const googleCredsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!admin.apps.length) {
  if (isEmulator) {
    admin.initializeApp({ projectId: firebaseConfig.projectId });
    console.log('Firebase Admin initialized in EMULATOR mode');
  } else if (serviceAccountKey) {
    const serviceAccount = JSON.parse(serviceAccountKey);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log('Firebase Admin initialized with service account key');
  } else if (googleCredsPath) {
    admin.initializeApp({ projectId: firebaseConfig.projectId });
    console.log('Firebase Admin initialized with GOOGLE_APPLICATION_CREDENTIALS');
  } else {
    console.warn(
      '\n===============================================\n' +
      '  FIREBASE CREDENTIALS NOT CONFIGURED\n' +
      '===============================================\n' +
      '  Set one of these environment variables:\n' +
      '  1. FIREBASE_SERVICE_ACCOUNT_KEY (JSON string)\n' +
      '  2. GOOGLE_APPLICATION_CREDENTIALS (file path)\n' +
      '  3. FIRESTORE_EMULATOR_HOST (for local emulator)\n' +
      '===============================================\n' +
      '  To create a service account:\n' +
      '  1. Go to https://console.firebase.google.com\n' +
      '  2. Project Settings > Service Accounts\n' +
      '  3. Generate new private key\n' +
      '  4. Copy the JSON content into FIREBASE_SERVICE_ACCOUNT_KEY\n' +
      '===============================================\n'
    );
    admin.initializeApp({ projectId: firebaseConfig.projectId });
  }
}

export const auth = admin.auth();
export const firestore = admin.firestore();
export const storage = admin.storage();
export const firebaseApiKey = firebaseConfig.apiKey;
export const FIREBASE_AUTH_BASE = `https://identitytoolkit.googleapis.com/v1`;

export default admin;
