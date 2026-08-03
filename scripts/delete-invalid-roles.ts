import * as admin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccountPath = path.resolve(__dirname, '../firebase-service-account.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const VALID_ROLES = [
  'super_admin',
  'executive_secretary',
  'hospital_admin',
  'hr_officer',
  'director_hr',
  'director_medical_services',
  'director_nursing_services',
  'director_prs',
  'director_pharmaceutical_services',
  'director_laboratory_services',
  'director_finance'
];

async function main() {
  try {
    const snapshot = await db.collection('users').get();
    let deletedCount = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!VALID_ROLES.includes(data.role)) {
        console.log(`Deleting user ${doc.id} with invalid role: ${data.role} (${data.email})`);
        await doc.ref.delete();
        deletedCount++;
        // Delete from Auth as well if possible, but Firestore is what shows in the UI
      }
    }
    console.log(`Successfully deleted ${deletedCount} users with invalid roles.`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
