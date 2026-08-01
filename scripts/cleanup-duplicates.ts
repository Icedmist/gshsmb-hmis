import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';

async function initFirebase() {
  let appConfig: any = {};
  const paths = [
    { env: 'GOOGLE_APPLICATION_CREDENTIALS', isEnv: true },
    { path: 'backend/firebase-service-account.json', isEnv: false },
    { path: 'firebase-service-account.json', isEnv: false },
  ];
  for (const src of paths) {
    try {
      if (src.isEnv) {
        const envVal = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (!envVal) continue;
        appConfig.credential = cert(JSON.parse(envVal));
      } else {
        if (!fs.existsSync(src.path)) continue;
        appConfig.credential = cert(JSON.parse(fs.readFileSync(src.path, 'utf8')));
      }
      break;
    } catch { continue; }
  }
  initializeApp(appConfig);
  return { db: getFirestore(), auth: getAuth() };
}

async function main() {
  console.log('Initializing Firebase...');
  const { db, auth } = await initFirebase();
  console.log('Ready.\n');

  // Fetch all hospitals
  const hSnap = await db.collection('hospitals').get();
  const duplicates = hSnap.docs.filter(doc => {
    const code = doc.data().hospital_code || '';
    // Duplicate hospital codes are lowercase/slugs and do NOT start with GSHSMB-
    return !code.startsWith('GSHSMB-');
  });

  console.log(`Found ${duplicates.length} duplicate hospitals to clean up.`);

  for (const hDoc of duplicates) {
    const hData = hDoc.data();
    const hId = hDoc.id;
    console.log(`\nCleaning up: ${hData.hospital_name} (${hData.hospital_code}) - ID: ${hId}`);

    // 1. Delete associated users (Auth & Firestore)
    const uSnap = await db.collection('users').where('hospital_id', '==', hId).get();
    console.log(`  Found ${uSnap.size} users to delete...`);
    for (const uDoc of uSnap.docs) {
      const uData = uDoc.data();
      const uid = uDoc.id;
      // Delete from Auth
      try {
        await auth.deleteUser(uid);
        console.log(`    Deleted Auth user: ${uData.email}`);
      } catch (authErr: any) {
        if (authErr.code !== 'auth/user-not-found') {
          console.error(`    Error deleting Auth user ${uData.email}:`, authErr.message);
        }
      }
      // Delete from Firestore
      await uDoc.ref.delete();
      console.log(`    Deleted Firestore user: ${uid}`);
    }

    // 2. Delete associated employees
    const eSnap = await db.collection('employees').where('hospital_id', '==', hId).get();
    console.log(`  Deleting ${eSnap.size} employees...`);
    for (const eDoc of eSnap.docs) {
      await eDoc.ref.delete();
    }

    // 3. Delete associated departments
    const dSnap = await db.collection('departments').where('hospital_id', '==', hId).get();
    console.log(`  Deleting ${dSnap.size} departments...`);
    for (const dDoc of dSnap.docs) {
      await dDoc.ref.delete();
    }

    // 4. Delete the hospital itself
    await hDoc.ref.delete();
    console.log(`  Deleted hospital: ${hId}`);
  }

  console.log('\nCleanup completed successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal cleanup error:', err);
  process.exit(1);
});
