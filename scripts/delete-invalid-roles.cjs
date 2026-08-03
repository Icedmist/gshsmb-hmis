const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.resolve(__dirname, '../backend/firebase-service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

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
        
        // delete from Auth
        if (data.email) {
            try {
                const userRecord = await admin.auth().getUserByEmail(data.email);
                await admin.auth().deleteUser(userRecord.uid);
            } catch (e) {
                // ignore if not found
            }
        }
        
        // delete from Firestore
        await doc.ref.delete();
        deletedCount++;
      }
    }
    console.log(`Successfully deleted ${deletedCount} users with invalid roles.`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
