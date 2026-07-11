import { addDoc, setDoc, getDocsAll } from '../config/database';
import { auth, firestore } from '../config/firebase';

const seed = async () => {
  try {
    console.log('Seeding Firebase data...');

    const existingHospitals = await getDocsAll('hospitals');
    if (existingHospitals.length > 0) {
      console.log('Data already exists. Skipping seed.');
      process.exit(0);
      return;
    }

    const hospitals = [
      { hospital_name: 'Gombe State Specialist Hospital', hospital_code: 'GSSH', address: 'Jeka Dafaru, Gombe', lga: 'Gombe', contact_email: 'gssh@gshsmb.gov.ng', contact_phone: '08010000001', status: 'active' },
      { hospital_name: 'General Hospital Kaltungo', hospital_code: 'GHK', address: 'Kaltungo LGA', lga: 'Kaltungo', contact_email: 'ghk@gshsmb.gov.ng', contact_phone: '08010000002', status: 'active' },
    ];

    const hospitalIds: string[] = [];
    for (const h of hospitals) {
      const id = await addDoc('hospitals', h);
      hospitalIds.push(id);
      console.log(`  Created hospital: ${h.hospital_name} (${id})`);
    }

    const departments = [
      { department_name: 'Outpatient Department', department_code: 'OPD', description: 'General outpatient services', status: 'active' },
      { department_name: 'Maternity', department_code: 'MAT', description: 'Maternity and child health', status: 'active' },
      { department_name: 'Pharmacy', department_code: 'PHA', description: 'Pharmaceutical services', status: 'active' },
    ];

    for (const hid of hospitalIds) {
      const hosp = await firestore.collection('hospitals').doc(hid).get();
      const hospCode = hosp.data()?.hospital_code;
      for (const d of departments) {
        const fullCode = `${d.department_code}-${hospCode}`;
        await addDoc('departments', { ...d, department_code: fullCode, hospital_id: hid });
        console.log(`  Created department: ${d.department_name} (${fullCode})`);
      }
    }

    const adminUid = (await auth.getUserByEmail('admin@gshsmb.gov.ng').catch(async () => {
      return auth.createUser({ email: 'admin@gshsmb.gov.ng', password: 'Admin@123', displayName: 'Super Admin' });
    })).uid;

    const existingAdmin = await firestore.collection('users').where('email', '==', 'admin@gshsmb.gov.ng').limit(1).get();
    if (existingAdmin.empty) {
      await addDoc('users', {
        firebase_uid: adminUid,
        full_name: 'Super Admin',
        email: 'admin@gshsmb.gov.ng',
        phone_number: '08000000000',
        role: 'super_admin',
        hospital_id: null,
        avatar_url: null,
        status: 'active',
      });
      console.log('  Created default admin user');
    }

    console.log('\nSeeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
