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

async function main() {
  try {
    const hospitalsSnap = await db.collection('hospitals').get();
    const hospitals = hospitalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    console.log(`Found ${hospitals.length} hospitals.`);
    
    for (const hospital of hospitals) {
      const adminsSnap = await db.collection('users')
        .where('hospital_id', '==', hospital.id)
        .where('role', '==', 'hospital_admin')
        .get();
        
      if (adminsSnap.empty) {
        console.log(`MISSING ADMIN: ${hospital.hospital_name} (${hospital.id})`);
      } else {
        console.log(`OK: ${hospital.hospital_name} has ${adminsSnap.size} admins.`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
