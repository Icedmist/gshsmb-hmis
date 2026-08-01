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
  const { db } = await initFirebase();
  const hSnap = await db.collection('hospitals').get();
  console.log(`--- HOSPITALS (${hSnap.size}) ---`);
  const hospitals: any[] = [];
  hSnap.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id} | Code: ${data.hospital_code} | Name: ${data.hospital_name}`);
    hospitals.push({ id: doc.id, ...data });
  });

  const uSnap = await db.collection('users').get();
  console.log(`\n--- USERS (${uSnap.size}) ---`);
  uSnap.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id} | Email: ${data.email} | Role: ${data.role} | Hosp: ${data.hospital_id} | Name: ${data.full_name}`);
  });
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
