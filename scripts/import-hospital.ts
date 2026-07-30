import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';

const DEFAULT_PASSWORD = '12345678';
const DOMAIN = 'gshsmb.gov.ph';

function departmentToRole(deptName: string): string {
  const n = deptName.toLowerCase();
  if (n.includes('nursing') || n.includes('ward') || n.includes('maternity')) return 'nursing_admin';
  if (n.includes('laboratory') || n.includes('lab')) return 'lab_admin';
  if (n.includes('pharmacy') || n.includes('dispensary')) return 'pharmacy_admin';
  if (n.includes('records') || n.includes('prs') || n.includes('gohealth') || n.includes('nhia')) return 'prs_admin';
  if (n.includes('administration') || n.includes('accounts') || n.includes('revenue') || n.includes('store') || n.includes('maintenance') || n.includes('environmental') || n.includes('laundry') || n.includes('nutrition') || n.includes('dietetics') || n.includes('health') || n.includes('public')) return 'hospital_admin';
  if (n.includes('medical') || n.includes('clinical') || n.includes('outpatient') || n.includes('dental') || n.includes('ent') || n.includes('antenatal') || n.includes('obstetrics') || n.includes('gynaecology') || n.includes('paediatric') || n.includes('theatre') || n.includes('surgical') || n.includes('ophthalmology') || n.includes('physiotherapy') || n.includes('radiology') || n.includes('community') || n.includes('family') || n.includes('tb') || n.includes('art') || n.includes('staff clinic')) return 'medical_admin';
  return 'hospital_admin';
}

function departmentToPosition(deptName: string): string {
  const n = deptName.toLowerCase();
  if (n.includes('nursing') || n.includes('ward') || n.includes('maternity')) return 'Nurse';
  if (n.includes('laboratory')) return 'Laboratory Personnel';
  if (n.includes('pharmacy')) return 'Pharmacist';
  if (n.includes('medical') || n.includes('clinical') || n.includes('outpatient') || n.includes('dental') || n.includes('ent') || n.includes('antenatal') || n.includes('obstetrics') || n.includes('gynaecology') || n.includes('paediatric') || n.includes('theatre') || n.includes('surgical') || n.includes('ophthalmology') || n.includes('physiotherapy') || n.includes('radiology') || n.includes('community') || n.includes('family') || n.includes('tb') || n.includes('art') || n.includes('staff clinic')) return 'Doctor';
  if (n.includes('administration') || n.includes('records') || n.includes('accounts') || n.includes('revenue') || n.includes('prs') || n.includes('gohealth') || n.includes('nhia')) return 'Administrative Staff';
  return 'Support Staff';
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, '');
}

function slugifyCode(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

let _emailCounter: Record<string, number> = {};

function generateEmail(fullName: string, hospitalCode: string): string {
  const parts = fullName.trim().split(/\s+/);
  const firstName = slugify(parts[0]);
  const lastName = slugify(parts[parts.length - 1]);
  const base = `${firstName}.${lastName}`;
  const baseEmail = `${base}@${hospitalCode}.${DOMAIN}`;
  const key = baseEmail;
  if (!_emailCounter[key]) {
    _emailCounter[key] = 1;
    return key;
  }
  _emailCounter[key]++;
  return `${firstName}.${lastName}${_emailCounter[key] - 1}@${hospitalCode}.${DOMAIN}`;
}

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

type HospitalData = {
  sheetName: string;
  hospitalName: string;
  hospitalCode: string;
  departments: { name: string; staff: { staffId: string | null; fullName: string; gender: string | null }[] }[];
};

async function importHospital(hosp: HospitalData) {
  const { db, auth } = await initFirebase();
  let totalE = 0, totalU = 0, skippedU = 0;
  const errors: string[] = [];

  console.log(`\n=== ${hosp.hospitalName} (${hosp.hospitalCode}) ===`);

  // Create or get hospital
  const existingH = await db.collection('hospitals')
    .where('hospital_code', '==', hosp.hospitalCode).limit(1).get();
  let hospId: string;
  if (!existingH.empty) {
    hospId = existingH.docs[0].id;
    console.log(`  Hospital exists: ${hospId}`);
  } else {
    const ref = db.collection('hospitals').doc();
    hospId = ref.id;
    await ref.set({
      hospital_name: hosp.hospitalName, hospital_code: hosp.hospitalCode,
      hospital_type: hosp.sheetName.includes('Cottage') ? 'Cottage Hospital'
        : hosp.sheetName.includes('General') ? 'General Hospital'
        : hosp.sheetName.includes('Specialist') ? 'Specialist Hospital'
        : hosp.sheetName.includes('Women') ? 'Specialist Hospital'
        : hosp.sheetName.includes('Clinic') ? 'Clinic' : 'Hospital',
      address: '', town_city: '', lga: '',
      contact_email: `${hosp.hospitalCode}@${DOMAIN}`, contact_phone: '',
      status: 'active',
      created_at: FieldValue.serverTimestamp(), updated_at: FieldValue.serverTimestamp(),
    });
    console.log(`  Created hospital: ${hospId}`);
  }

  // Create departments
  const deptNameToId: Record<string, string> = {};
  for (const dept of hosp.departments) {
    const dc = slugifyCode(dept.name);
    const existingD = await db.collection('departments')
      .where('department_code', '==', `${hosp.hospitalCode}_${dc}`).limit(1).get();
    if (!existingD.empty) {
      deptNameToId[dept.name] = existingD.docs[0].id;
    } else {
      const ref = db.collection('departments').doc();
      deptNameToId[dept.name] = ref.id;
      await ref.set({
        department_name: dept.name, department_code: `${hosp.hospitalCode}_${dc}`,
        description: '', hospital_id: hospId, status: 'active',
        created_at: FieldValue.serverTimestamp(), updated_at: FieldValue.serverTimestamp(),
      });
    }
  }
  console.log(`  Departments: ${hosp.departments.length}`);

  // Process staff one by one (reliable, no concurrency issues)
  for (const dept of hosp.departments) {
    const deptId = deptNameToId[dept.name];
    if (!deptId) continue;
    const role = departmentToRole(dept.name);
    const position = departmentToPosition(dept.name);

    for (const staff of dept.staff) {
      const email = generateEmail(staff.fullName, hosp.hospitalCode);

      // Employee
      try {
        const empQuery = staff.staffId
          ? await db.collection('employees').where('staff_id', '==', staff.staffId).limit(1).get()
          : null;
        if (empQuery && !empQuery.empty) {
          const ed = empQuery.docs[0];
          if (!ed.data().email) {
            await ed.ref.update({ email, updated_at: FieldValue.serverTimestamp() });
          }
        } else {
          await db.collection('employees').add({
            staff_id: staff.staffId || `TMP_${hosp.hospitalCode}_${slugify(staff.fullName)}`,
            full_name: staff.fullName, gender: staff.gender || '',
            phone_number: '', email, position,
            department_id: deptId, hospital_id: hospId,
            employment_date: '', status: 'active',
            created_at: FieldValue.serverTimestamp(), updated_at: FieldValue.serverTimestamp(),
          });
        }
        totalE++;
      } catch (e: any) {
        errors.push(`Employee ${staff.fullName}: ${e.message}`);
        continue;
      }

      // User
      try {
        let uid: string;
        try {
          const userRecord = await auth.createUser({
            email, password: DEFAULT_PASSWORD,
            displayName: staff.fullName, emailVerified: true,
          });
          uid = userRecord.uid;
        } catch (authErr: any) {
          if (authErr.code === 'auth/email-already-exists') {
            const userRecord = await auth.getUserByEmail(email);
            uid = userRecord.uid;
            skippedU++;
          } else { throw authErr; }
        }

        await db.collection('users').doc(uid).set({
          firebase_uid: uid, full_name: staff.fullName, email,
          phone_number: null, role, hospital_id: hospId,
          avatar_url: null, status: 'active',
          created_at: FieldValue.serverTimestamp(), updated_at: FieldValue.serverTimestamp(),
        }, { merge: true });
        totalU++;
      } catch (e: any) {
        errors.push(`User ${staff.fullName} (${email}): ${e.message}`);
      }
    }
  }

  console.log(`  Results: ${totalE} employees, ${totalU} users (${skippedU} skipped)`);
  if (errors.length) {
    console.log(`  Errors (${errors.length}):`);
    errors.slice(0, 5).forEach(e => console.log(`    - ${e}`));
  }
}

// Main: read JSON, import one hospital
const data: HospitalData[] = JSON.parse(fs.readFileSync('data/parsed-staff.json', 'utf8'));
const index = parseInt(process.argv[2] || '0', 10);

if (index < 0 || index >= data.length) {
  console.error(`Invalid index: ${index}. Must be 0-${data.length - 1}`);
  process.exit(1);
}

importHospital(data[index]).then(() => {
  console.log('Done.');
  process.exit(0);
}).catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
