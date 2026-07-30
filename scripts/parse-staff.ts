import 'dotenv/config';
import * as fs from 'fs';
import XLSX from 'xlsx';

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

export interface StaffRow {
  staffId: string | null;
  fullName: string;
  gender: string | null;
}

export interface DepartmentData {
  name: string;
  staff: StaffRow[];
}

export interface HospitalData {
  sheetName: string;
  hospitalName: string;
  hospitalCode: string;
  departments: DepartmentData[];
}

const SKIP_PREFIXES = ['Hospital Code:', 'Hospital Name:', 'Total Employees:', 'Total Departments:'];

export function parseExcel(filePath: string): HospitalData[] {
  const workbook = XLSX.readFile(filePath);
  const hospitals: HospitalData[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const hospitalName = rows[1]?.[1]?.toString()?.trim();
    if (!hospitalName) continue;
    const hospitalCode = HOSPITAL_CODES[hospitalName];
    if (!hospitalCode) { console.error(`  WARN: No code for "${hospitalName}"`); continue; }

    let currentDept = '';
    const departments = new Map<string, DepartmentData>();

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

    if (departments.size === 0) { console.error(`  WARN: No depts for "${hospitalName}"`); continue; }
    hospitals.push({ sheetName, hospitalName, hospitalCode, departments: Array.from(departments.values()) });
  }
  return hospitals;
}

// Run directly
const data = parseExcel(EXCEL_PATH);
console.log(JSON.stringify(data, null, 2));
