import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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
  return { db: getFirestore() };
}

async function main() {
  const { db } = await initFirebase();
  const data = JSON.parse(fs.readFileSync('data/parsed-staff.json', 'utf8'));

  let importedCodes = new Set<string>();
  let firestoreAvailable = true;
  let errorMessage = '';

  try {
    const hSnap = await db.collection('hospitals').get();
    importedCodes = new Set(hSnap.docs.map(doc => doc.data().hospital_code));
  } catch (err: any) {
    firestoreAvailable = false;
    errorMessage = err.message || String(err);
  }

  console.log('Index | Hospital Code       | Staff | Status   | Hospital Name');
  console.log('-'.repeat(90));

  data.forEach((h: any, idx: number) => {
    const staffCount = h.departments.reduce((sum: number, d: any) => sum + d.staff.length, 0);
    let status = 'PENDING';
    if (!firestoreAvailable) {
      status = 'UNKNOWN*';
    } else if (importedCodes.has(h.hospitalCode)) {
      status = 'IMPORTED';
    }
    console.log(
      `${idx.toString().padEnd(5)} | ${h.hospitalCode.padEnd(19)} | ${staffCount.toString().padEnd(5)} | ${status.padEnd(8)} | ${h.hospitalName}`
    );
  });

  if (!firestoreAvailable) {
    console.log('\n* Note: Status is UNKNOWN because Firestore query failed (e.g., quota exceeded or offline):');
    console.log(`  ${errorMessage}`);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
