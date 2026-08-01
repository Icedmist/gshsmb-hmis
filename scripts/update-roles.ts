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

  const deprecatedRoles = ['lab_admin', 'pharmacy_admin', 'nursing_admin', 'medical_admin', 'prs_admin'];
  const newRole = 'hospital_admin';

  // Fetch all users
  const uSnap = await db.collection('users').get();
  let updatedCount = 0;

  for (const doc of uSnap.docs) {
    const data = doc.data();
    if (deprecatedRoles.includes(data.role)) {
      console.log(`Updating user: ${data.email} (ID: ${doc.id}) from ${data.role} to ${newRole}`);
      
      // Update Firestore
      await doc.ref.update({ role: newRole });
      
      // Update Auth Custom Claims
      try {
        await auth.setCustomUserClaims(doc.id, { role: newRole });
        console.log(`  Successfully updated Auth custom claims for ${data.email}`);
      } catch (err: any) {
        console.error(`  Failed to update Auth custom claims for ${data.email}: ${err.message}`);
      }
      
      updatedCount++;
    }
  }

  console.log(`\nSuccessfully updated ${updatedCount} users.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal role update error:', err);
  process.exit(1);
});
