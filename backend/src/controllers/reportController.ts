import { Response } from 'express';
import { getDocs, getDocsAll, getDoc } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getWorkforceDistribution = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospitals = await getDocsAll('hospitals', [], { field: 'hospital_name', dir: 'asc' });

    const result = await Promise.all(hospitals.map(async (h: any) => {
      const total = (await getDocs('employees', [{ field: 'hospital_id', op: '==', value: h.id }])).total;
      const active = (await getDocs('employees', [
        { field: 'hospital_id', op: '==', value: h.id },
        { field: 'status', op: '==', value: 'active' },
      ])).total;
      const inactive = (await getDocs('employees', [
        { field: 'hospital_id', op: '==', value: h.id },
        { field: 'status', op: '==', value: 'inactive' },
      ])).total;
      const suspended = (await getDocs('employees', [
        { field: 'hospital_id', op: '==', value: h.id },
        { field: 'status', op: '==', value: 'suspended' },
      ])).total;

      return {
        id: h.id,
        hospital_name: h.hospital_name,
        hospital_code: h.hospital_code,
        lga: h.lga,
        total_employees: total,
        active_employees: active,
        inactive_employees: inactive,
        suspended_employees: suspended,
      };
    }));

    res.json(result);
  } catch (error: any) {
    console.error('Workforce distribution error:', error?.message || error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getHospitalStaffing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.query.hospital_id as string;

    const hospFilters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [];
    if (hospitalId) hospFilters.push({ field: '__name__', op: '==', value: hospitalId });
    const hospitals = await getDocsAll('hospitals', hospFilters, { field: 'hospital_name', dir: 'asc' });

    const result: any[] = [];
    for (const h of hospitals) {
      const departments = await getDocsAll('departments', [
        { field: 'hospital_id', op: '==', value: h.id },
      ], { field: 'department_name', dir: 'asc' });

      for (const d of departments) {
        const total = (await getDocs('employees', [
          { field: 'department_id', op: '==', value: d.id },
          { field: 'hospital_id', op: '==', value: h.id },
        ])).total;
        const active = (await getDocs('employees', [
          { field: 'department_id', op: '==', value: d.id },
          { field: 'hospital_id', op: '==', value: h.id },
          { field: 'status', op: '==', value: 'active' },
        ])).total;

        result.push({
          hospital_id: h.id,
          hospital_name: h.hospital_name,
          department_id: d.id,
          department_name: d.department_name,
          total_staff: total,
          active_staff: active,
        });
      }
    }

    res.json(result);
  } catch (error: any) {
    console.error('Hospital staffing error:', error?.message || error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getDepartmentStaffing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const departmentId = req.query.department_id as string;

    const deptFilters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [];
    if (departmentId) deptFilters.push({ field: '__name__', op: '==', value: departmentId });

    const departments = await getDocsAll('departments', deptFilters, { field: 'department_name', dir: 'asc' });

    const result = await Promise.all(departments.map(async (d: any) => {
      const hospital = d.hospital_id ? await getDoc('hospitals', d.hospital_id) : null;
      const total = (await getDocs('employees', [{ field: 'department_id', op: '==', value: d.id }])).total;
      const active = (await getDocs('employees', [
        { field: 'department_id', op: '==', value: d.id },
        { field: 'status', op: '==', value: 'active' },
      ])).total;

      return {
        department_id: d.id,
        department_name: d.department_name,
        department_code: d.department_code,
        hospital_name: hospital?.hospital_name || 'Unknown',
        total_staff: total,
        active_staff: active,
      };
    }));

    res.json(result);
  } catch (error: any) {
    console.error('Department staffing error:', error?.message || error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getEmployeeTransfersReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;

    const filters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [];
    if (status) filters.push({ field: 'status', op: '==', value: status });

    const data = await getDocsAll('employeeTransfers', filters, { field: 'created_at', dir: 'desc' });

    const enriched = await Promise.all(data.map(async (t: any) => {
      const [emp, fromHosp, toHosp, fromDept, toDept, creator, approver] = await Promise.all([
        getDoc('employees', t.employee_id),
        getDoc('hospitals', t.from_hospital_id),
        getDoc('hospitals', t.to_hospital_id),
        getDoc('departments', t.from_department_id),
        getDoc('departments', t.to_department_id),
        getDoc('users', t.created_by),
        t.approved_by ? getDoc('users', t.approved_by) : null,
      ]);

      return {
        ...t,
        employee_name: emp?.full_name || 'Unknown',
        staff_id: emp?.staff_id || '',
        from_hospital: fromHosp?.hospital_name || 'Unknown',
        to_hospital: toHosp?.hospital_name || 'Unknown',
        from_department: fromDept?.department_name || 'Unknown',
        to_department: toDept?.department_name || 'Unknown',
        requested_by: creator?.full_name || 'Unknown',
        approved_by_name: approver?.full_name || null,
      };
    }));

    res.json(enriched);
  } catch (error: any) {
    console.error('Transfer report error:', error?.message || error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getActiveEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data } = await getDocs('employees', [{ field: 'status', op: '==', value: 'active' }], { field: 'full_name', dir: 'asc' });

    const enriched = await Promise.all(data.map(async (e: any) => {
      let department_name = 'Unknown';
      let hospital_name = 'Unknown';
      if (e.department_id) {
        const dept = await getDoc('departments', e.department_id);
        department_name = dept?.department_name || 'Unknown';
      }
      if (e.hospital_id) {
        const hosp = await getDoc('hospitals', e.hospital_id);
        hospital_name = hosp?.hospital_name || 'Unknown';
      }
      return { ...e, department_name, hospital_name };
    }));

    res.json(enriched);
  } catch (error: any) {
    console.error('Active employees error:', error?.message || error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const toCsv = (rows: any[]): string => {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const csvRows = [headers.join(',')];
  for (const row of rows) {
    const values = headers.map(h => {
      const val = row[h]?.toString() || '';
      return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
};

export const exportCsv = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const type = req.query.type as string;
    let rows: any[] = [];
    let filename = 'report';

    switch (type) {
      case 'workforce': {
        const hospitals = await getDocsAll('hospitals', [], { field: 'hospital_name', dir: 'asc' });
        rows = await Promise.all(hospitals.map(async (h: any) => {
          const total = (await getDocs('employees', [{ field: 'hospital_id', op: '==', value: h.id }])).total;
          const active = (await getDocs('employees', [
            { field: 'hospital_id', op: '==', value: h.id },
            { field: 'status', op: '==', value: 'active' },
          ])).total;
          return { hospital_name: h.hospital_name, hospital_code: h.hospital_code, lga: h.lga, total_employees: total, active_employees: active };
        }));
        filename = 'workforce-distribution';
        break;
      }
      case 'hospital-staffing': {
        const hospitals = await getDocsAll('hospitals', [], { field: 'hospital_name', dir: 'asc' });
        rows = [];
        for (const h of hospitals) {
          const depts = await getDocsAll('departments', [{ field: 'hospital_id', op: '==', value: h.id }], { field: 'department_name', dir: 'asc' });
          for (const d of depts) {
            const total = (await getDocs('employees', [
              { field: 'department_id', op: '==', value: d.id },
              { field: 'hospital_id', op: '==', value: h.id },
            ])).total;
            const active = (await getDocs('employees', [
              { field: 'department_id', op: '==', value: d.id },
              { field: 'hospital_id', op: '==', value: h.id },
              { field: 'status', op: '==', value: 'active' },
            ])).total;
            rows.push({ hospital_name: h.hospital_name, department_name: d.department_name, total_staff: total, active_staff: active });
          }
        }
        filename = 'hospital-staffing';
        break;
      }
      case 'department-staffing': {
        const depts = await getDocsAll('departments', [], { field: 'department_name', dir: 'asc' });
        rows = await Promise.all(depts.map(async (d: any) => {
          const hosp = d.hospital_id ? await getDoc('hospitals', d.hospital_id) : null;
          const total = (await getDocs('employees', [{ field: 'department_id', op: '==', value: d.id }])).total;
          const active = (await getDocs('employees', [
            { field: 'department_id', op: '==', value: d.id },
            { field: 'status', op: '==', value: 'active' },
          ])).total;
          return { department_name: d.department_name, department_code: d.department_code, hospital_name: hosp?.hospital_name || 'Unknown', total_staff: total, active_staff: active };
        }));
        filename = 'department-staffing';
        break;
      }
      case 'transfers': {
        const data = await getDocsAll('employeeTransfers', [], { field: 'created_at', dir: 'desc' });
        rows = await Promise.all(data.map(async (t: any) => {
          const emp = t.employee_id ? await getDoc('employees', t.employee_id) : null;
          const fromHosp = t.from_hospital_id ? await getDoc('hospitals', t.from_hospital_id) : null;
          const toHosp = t.to_hospital_id ? await getDoc('hospitals', t.to_hospital_id) : null;
          return {
            full_name: emp?.full_name || 'Unknown',
            staff_id: emp?.staff_id || '',
            from_hospital: fromHosp?.hospital_name || 'Unknown',
            to_hospital: toHosp?.hospital_name || 'Unknown',
            transfer_date: t.transfer_date,
            reason: t.reason || '',
            status: t.status,
          };
        }));
        filename = 'employee-transfers';
        break;
      }
      case 'active-employees': {
        const activeEmps = await getDocs('employees', [{ field: 'status', op: '==', value: 'active' }], { field: 'full_name', dir: 'asc' });
        rows = await Promise.all(activeEmps.data.map(async (e: any) => {
          const dept = e.department_id ? await getDoc('departments', e.department_id) : null;
          const hosp = e.hospital_id ? await getDoc('hospitals', e.hospital_id) : null;
          return {
            staff_id: e.staff_id,
            full_name: e.full_name,
            position: e.position,
            gender: e.gender || '',
            email: e.email || '',
            phone_number: e.phone_number || '',
            department_name: dept?.department_name || 'Unknown',
            hospital_name: hosp?.hospital_name || 'Unknown',
            employment_date: e.employment_date,
          };
        }));
        filename = 'active-employees';
        break;
      }
      default:
        res.status(400).json({ error: 'Invalid report type.' });
        return;
    }

    const csv = toCsv(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Export CSV error:', error?.message || error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
