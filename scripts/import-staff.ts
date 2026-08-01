import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import XLSX from 'xlsx';

const DEFAULT_PASSWORD = '12345678';
const DOMAIN = 'gshsmb.gov.ph';
const EXCEL_PATH = 'data/GSHSMB_Staff_Register_Official.xlsx';

const HOSPITAL_CODES: Record<string, string> = {
  'Cottage Hospital Bambam': 'cottagebambam',
  'Cottage Hospital Biri': 'cottagebiri',
  'Cottage Hospital Bojude': 'cottagebojude',
  'Cottage Hospital Filiya': 'cottagefiliya',
  'Cottage Hospital Hinna': 'cottagehinna',
  'Cottage Hospital Kuri': 'cottagekuri',
  'Cottage Hospital Malamsidi': 'cottagemalamsidi',
  'Cottage Hospital Pindiga': 'cottagepindiga',
  'Cottage Hospital Potuki': 'cottagepotuki',
  'Cottage Hospital Tula': 'cottagetula',
  'Cottage Hospital Tumu': 'cottagetumu',
  'General Hospital Bajoga': 'generalbajoga',
  'General Hospital Billiri': 'generalbilliri',
  'General Hospital Deba': 'generaldeba',
  'General Hospital Dukku': 'generaldukku',
  'General Hospital Kaltungo': 'generalkaltungo',
  'General Hospital Kashere': 'generalkashere',
  'General Hospital Kumo': 'generalkumo',
  'General Hospital Nafada': 'generalnafada',
  'General Hospital Talasse': 'generaltalasse',
  'Government House Clinic': 'govthouseclinic',
  'Infectious Disease Hospital Zambuk': 'idhzambuk',
  'Nigerian Police Barracks Clinic': 'policeclinic',
  'Snake Bite Hospital Kaltungo': 'snakebitekaltungo',
  'State Specialist Hospital Gombe': 'specialistgombe',
  'Zainab Bulkachuwa Women & Children Hospital': 'zainabwomen',
};

const SKIP_PREFIXES = ['Hospital Code:', 'Hospital Name:', 'Total Employees:', 'Total Departments:'];

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

async function retry<T>(fn: () => Promise<T>, label: string, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      if (i === retries - 1) throw e;
      console.error(`  [${label}] failed (${e.message}), retrying (${i + 1}/${retries})...`);
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw new Error('Unreachable');
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

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
  const db = getFirestore();
  db.settings({
    timeout: 30000,
    ssl: true,
  });
  return { db, auth: getAuth() };
}

function parseExcel() {
  const workbook = XLSX.readFile(EXCEL_PATH);
  const hospitals: {
    sheetName: string; hospitalName: string; hospitalCode: string;
    departments: { name: string; staff: { staffId: string | null; fullName: string; gender: string | null }[] }[];
  }[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const hospitalName = rows[1]?.[1]?.toString()?.trim();
    if (!hospitalName) continue;
    const hospitalCode = HOSPITAL_CODES[hospitalName];
    if (!hospitalCode) { console.log(`  WARN: No code for "${hospitalName}"`); continue; }

    let currentDept = '';
    const departments = new Map<string, { name: string; staff: any[] }>();

    for (const row of rows) {
      if (!row || row.length === 0) continue;
      const colA = (row[0]?.toString() || '').trim();
      const colB = (row[1]?.toString() || '').trim();
      const colC = (row[2]?.toString() || '').trim();

      if (SKIP_PREFIXES.some(p => colA.startsWith(p))) continue;
      if (!colA && !colB) continue;

      if (colA && !colB && !colA.startsWith('Staff ID') && colA !== 'Full Name') {
        currentDept = colA;
        if (!departments.has(currentDept)) departments.set(currentDept, { name: currentDept, staff: [] });
        continue;
      }
      if (colA.startsWith('Staff ID') || colA === 'Full Name') continue;

      if (colB) {
        if (!currentDept) currentDept = 'General Services';
        if (!departments.has(currentDept)) departments.set(currentDept, { name: currentDept, staff: [] });
        departments.get(currentDept)!.staff.push({
          staffId: colA || null,
          fullName: colB,
          gender: colC || null,
        });
      }
    }

    if (departments.size === 0) { console.log(`  WARN: No depts for "${hospitalName}"`); continue; }
    hospitals.push({ sheetName, hospitalName, hospitalCode, departments: Array.from(departments.values()) });
  }
  return hospitals;
}

async function main() {
  console.log('Initializing Firebase...');
  const { db, auth } = await initFirebase();
  console.log('Ready.\n');

  console.log('Fetching existing users and employees from Firestore...');
  const usersSnap = await db.collection('users').get();
  const existingEmails = new Set(usersSnap.docs.map(doc => doc.data().email?.toLowerCase()));
  
  const employeesSnap = await db.collection('employees').get();
  const existingStaffIds = new Set(employeesSnap.docs.map(doc => doc.data().staff_id));
  console.log(`Loaded ${existingEmails.size} existing users and ${existingStaffIds.size} existing employees.\n`);

  const hospitals = parseExcel();
  console.log(`Found ${hospitals.length} hospitals\n`);

  let totalH = 0, totalD = 0, totalE = 0, totalU = 0, totalSkippedU = 0;
  const allErrors: string[] = [];

  for (const [hospIdx, hosp] of hospitals.entries()) {
    process.stdout.write(`${hosp.hospitalName}... `);
    let hospStaffCount = 0;

    try {
      // Hospital (sequential, simple - no concurrency issue here)
      const hospId = await retry(async () => {
        const existingH = await db.collection('hospitals').where('hospital_code', '==', hosp.hospitalCode).limit(1).get();
        if (!existingH.empty) return existingH.docs[0].id;
        const ref = db.collection('hospitals').doc();
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
        return ref.id;
      }, 'hospital');

      totalH++;

      // Departments (sequential)
      const deptNameToId: Record<string, string> = {};
      for (const dept of hosp.departments) {
        const dc = slugifyCode(dept.name);
        const deptId = await retry(async () => {
          const existingD = await db.collection('departments')
            .where('department_code', '==', `${hosp.hospitalCode}_${dc}`).limit(1).get();
          if (!existingD.empty) return existingD.docs[0].id;
          const ref = db.collection('departments').doc();
          await ref.set({
            department_name: dept.name, department_code: `${hosp.hospitalCode}_${dc}`,
            description: '', hospital_id: hospId, status: 'active',
            created_at: FieldValue.serverTimestamp(), updated_at: FieldValue.serverTimestamp(),
          });
          return ref.id;
        }, `dept:${dept.name.slice(0, 20)}`);
        deptNameToId[dept.name] = deptId;
        totalD++;
      }

      // Staff - process sequentially per staff member to avoid Firestore timeouts
      for (const dept of hosp.departments) {
        const deptId = deptNameToId[dept.name];
        if (!deptId) continue;
        const role = departmentToRole(dept.name);
        const position = departmentToPosition(dept.name);

        for (const staff of dept.staff) {
          const email = generateEmail(staff.fullName, hosp.hospitalCode);
          const staffId = staff.staffId || `TMP_${hosp.hospitalCode}_${slugify(staff.fullName)}`;

          const employeeExists = existingStaffIds.has(staffId);
          const userExists = existingEmails.has(email.toLowerCase());

          if (employeeExists && userExists) {
            totalSkippedU++;
            hospStaffCount++;
            continue;
          }

          // 1. Employee insertion
          if (!employeeExists) {
            try {
              await retry(async () => {
                await db.collection('employees').add({
                  staff_id: staffId,
                  full_name: staff.fullName, gender: staff.gender || '',
                  phone_number: '', email, position,
                  department_id: deptId, hospital_id: hospId,
                  employment_date: '', status: 'active',
                  created_at: FieldValue.serverTimestamp(), updated_at: FieldValue.serverTimestamp(),
                });
                return true;
              }, 'emp');
              existingStaffIds.add(staffId);
              totalE++;
            } catch (e: any) {
              allErrors.push(`Employee ${staff.fullName}: ${e.message}`);
              continue;
            }
          }

          // 2. User insertion (Firebase Auth & Firestore Profile)
          if (!userExists) {
            // Rate-limit auth user creation to avoid Firebase Auth quota
            await sleep(200);

            try {
              await retry(async () => {
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
                    totalSkippedU++;
                  } else { throw authErr; }
                }

                await db.collection('users').doc(uid).set({
                  firebase_uid: uid, full_name: staff.fullName, email,
                  phone_number: null, role, hospital_id: hospId,
                  avatar_url: null, status: 'active',
                  created_at: FieldValue.serverTimestamp(), updated_at: FieldValue.serverTimestamp(),
                }, { merge: true });
                return true;
              }, 'user');
              existingEmails.add(email.toLowerCase());
              totalU++;
            } catch (e: any) {
              allErrors.push(`User ${staff.fullName} (${email}): ${e.message}`);
              continue;
            }
          }

          hospStaffCount++;
        }
      }
    } catch (e: any) {
      console.error(`\n  FATAL: ${e.message}`);
      allErrors.push(`FATAL ${hosp.hospitalName}: ${e.message}`);
    }

    console.log(`${hosp.departments.length} depts, ${hospStaffCount} staff`);
  }

  console.log('\n========== SUMMARY ==========');
  console.log(`Hospitals: ${totalH}`);
  console.log(`Departments: ${totalD}`);
  console.log(`Employees created/updated: ${totalE}`);
  console.log(`Users created: ${totalU}`);
  console.log(`Users skipped (existing): ${totalSkippedU}`);
  if (allErrors.length) {
    console.log(`\nErrors (${allErrors.length}):`);
    allErrors.slice(0, 30).forEach(e => console.log(`  - ${e}`));
    if (allErrors.length > 30) console.log(`  ... and ${allErrors.length - 30} more`);
  }
  console.log('\nDone!');
  process.exit(0);
}

main();
