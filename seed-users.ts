import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';

let appConfig: any = {};
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      appConfig.credential = cert(serviceAccount);
    } catch (error) {
      console.error('Invalid GOOGLE_APPLICATION_CREDENTIALS:', error);
      process.exit(1);
    }
  } else if (fs.existsSync('firebase-service-account.json')) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync('firebase-service-account.json', 'utf8'));
      appConfig.credential = cert(serviceAccount);
    } catch (error) {
      console.error('Invalid firebase-service-account.json:', error);
      process.exit(1);
    }
  } else {
    console.log('No Google credentials found. Using default.');
  }

initializeApp(appConfig);

const db = getFirestore();
const auth = getAuth();

const users = [
  {
    email: 'superadmin@gshsmb.gov.ph',
    password: 'SuperAdmin123!',
    displayName: 'Super Administrator',
    role: 'super_admin',
    hospital_id: null,
  },
  {
    email: 'hospadmin@gshsmb.gov.ph',
    password: 'HospAdmin123!',
    displayName: 'Hospital Administrator',
    role: 'hospital_admin',
    hospital_id: 'hospital-001',
  },
  {
    email: 'hr@gshsmb.gov.ph',
    password: 'HROfficer123!',
    displayName: 'HR Officer',
    role: 'hr_officer',
    hospital_id: 'hospital-001',
  },
  {
    email: 'execsec@gshsmb.gov.ph',
    password: 'ExecSec123!',
    displayName: 'Executive Secretary',
    role: 'executive_secretary',
    hospital_id: null,
  },
];

async function seed() {
  for (const user of users) {
    try {
      const userRecord = await auth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.displayName,
        emailVerified: true,
      });

      await db.collection('users').doc(userRecord.uid).set({
        firebase_uid: userRecord.uid,
        email: user.email,
        display_name: user.displayName,
        role: user.role,
        hospital_id: user.hospital_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      console.log(`✓ Created ${user.role}: ${user.email}`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`- Skipped (exists): ${user.email}`);
      } else {
        console.error(`✗ Failed ${user.email}:`, error.message);
      }
    }
  }

  console.log('\nDone!');
  process.exit(0);
}

seed();
