import { getDocsAll, getDocsPaginated, getDocById, type FilterConstraint } from './firestore';
import { countDocs } from './firestore';

export const getWorkforceDistribution = async (): Promise<any[]> => {
  const hospitals = await getDocsAll('hospitals', [], { field: 'hospital_name', dir: 'asc' });

  return Promise.all(
    hospitals.map(async (h: any) => {
      const total = await countDocs('employees', [{ field: 'hospital_id', op: '==', value: h.id }]);
      const active = await countDocs('employees', [
        { field: 'hospital_id', op: '==', value: h.id },
        { field: 'status', op: '==', value: 'active' },
      ]);
      const inactive = await countDocs('employees', [
        { field: 'hospital_id', op: '==', value: h.id },
        { field: 'status', op: '==', value: 'inactive' },
      ]);
      const suspended = await countDocs('employees', [
        { field: 'hospital_id', op: '==', value: h.id },
        { field: 'status', op: '==', value: 'suspended' },
      ]);
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
    })
  );
};

export const getHospitalStaffing = async (hospitalId?: string): Promise<any[]> => {
  const hospFilters: FilterConstraint[] = [];
  if (hospitalId) hospFilters.push({ field: '__name__', op: '==', value: hospitalId });
  const hospitals = await getDocsAll('hospitals', hospFilters, { field: 'hospital_name', dir: 'asc' });

  const result: any[] = [];
  for (const h of hospitals) {
    const departments = await getDocsAll('departments', [
      { field: 'hospital_id', op: '==', value: h.id },
    ], { field: 'department_name', dir: 'asc' });

    for (const d of departments) {
      const total = await countDocs('employees', [
        { field: 'department_id', op: '==', value: d.id },
        { field: 'hospital_id', op: '==', value: h.id },
      ]);
      const active = await countDocs('employees', [
        { field: 'department_id', op: '==', value: d.id },
        { field: 'hospital_id', op: '==', value: h.id },
        { field: 'status', op: '==', value: 'active' },
      ]);
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
  return result;
};

export const getDepartmentStaffing = async (departmentId?: string): Promise<any[]> => {
  const deptFilters: FilterConstraint[] = [];
  if (departmentId) deptFilters.push({ field: '__name__', op: '==', value: departmentId });
  const departments = await getDocsAll('departments', deptFilters, { field: 'department_name', dir: 'asc' });

  return Promise.all(
    departments.map(async (d: any) => {
      const hospital = d.hospital_id ? await getDocById('hospitals', d.hospital_id) : null;
      const total = await countDocs('employees', [{ field: 'department_id', op: '==', value: d.id }]);
      const active = await countDocs('employees', [
        { field: 'department_id', op: '==', value: d.id },
        { field: 'status', op: '==', value: 'active' },
      ]);
      return {
        department_id: d.id,
        department_name: d.department_name,
        department_code: d.department_code,
        hospital_name: hospital?.hospital_name || 'Unknown',
        total_staff: total,
        active_staff: active,
      };
    })
  );
};

export const getTransfersReport = async (status?: string): Promise<any[]> => {
  const filters: FilterConstraint[] = [];
  if (status) filters.push({ field: 'status', op: '==', value: status });
  const data = await getDocsAll('employeeTransfers', filters, { field: 'created_at', dir: 'desc' });

  return Promise.all(
    data.map(async (t: any) => {
      const [emp, fromHosp, toHosp, fromDept, toDept, creator, approver] = await Promise.all([
        getDocById('employees', t.employee_id),
        getDocById('hospitals', t.from_hospital_id),
        getDocById('hospitals', t.to_hospital_id),
        getDocById('departments', t.from_department_id),
        getDocById('departments', t.to_department_id),
        getDocById('users', t.created_by),
        t.approved_by ? getDocById('users', t.approved_by) : null,
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
    })
  );
};

export const getActiveEmployeesReport = async (): Promise<any[]> => {
  const { data } = await getDocsPaginated('employees', [{ field: 'status', op: '==', value: 'active' }], { field: 'full_name', dir: 'asc' }, 1000, 1);

  return Promise.all(
    data.map(async (e: any) => {
      const dept = e.department_id ? await getDocById('departments', e.department_id) : null;
      const hosp = e.hospital_id ? await getDocById('hospitals', e.hospital_id) : null;
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
    })
  );
};
