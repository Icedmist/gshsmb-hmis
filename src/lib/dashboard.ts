import { getDocsAll, countDocs, getDocById, type FilterConstraint } from './firestore';

export interface DashboardStats {
  total_hospitals: number;
  total_departments: number;
  total_employees: number;
  active_employees: number;
}

export const getDashboardStats = async (hospitalScope?: string): Promise<DashboardStats> => {
  const hospFilters: FilterConstraint[] = [{ field: 'status', op: '==', value: 'active' }];
  if (hospitalScope) hospFilters.push({ field: '__name__', op: '==', value: hospitalScope });

  const deptFilters: FilterConstraint[] = [{ field: 'status', op: '==', value: 'active' }];
  if (hospitalScope) deptFilters.push({ field: 'hospital_id', op: '==', value: hospitalScope });

  const empFilters: FilterConstraint[] = [];
  if (hospitalScope) empFilters.push({ field: 'hospital_id', op: '==', value: hospitalScope });

  const activeEmpFilters: FilterConstraint[] = [{ field: 'status', op: '==', value: 'active' }];
  if (hospitalScope) activeEmpFilters.push({ field: 'hospital_id', op: '==', value: hospitalScope });

  const [total_hospitals, total_departments, total_employees, active_employees] = await Promise.all([
    countDocs('hospitals', hospFilters),
    countDocs('departments', deptFilters),
    countDocs('employees', empFilters),
    countDocs('employees', activeEmpFilters),
  ]);

  return { total_hospitals, total_departments, total_employees, active_employees };
};

export const getEmployeesPerHospital = async (hospitalScope?: string): Promise<any[]> => {
  const hospFilters: FilterConstraint[] = [];
  if (hospitalScope) hospFilters.push({ field: '__name__', op: '==', value: hospitalScope });

  const hospitals = await getDocsAll('hospitals', hospFilters, { field: 'hospital_name', dir: 'asc' });

  return Promise.all(
    hospitals.map(async (h: any) => {
      const empCount = await countDocs('employees', [{ field: 'hospital_id', op: '==', value: h.id }]);
      return { id: h.id, hospital_name: h.hospital_name, employee_count: empCount };
    })
  );
};

export const getEmployeesPerDepartment = async (hospitalScope?: string): Promise<any[]> => {
  const deptFilters: FilterConstraint[] = [];
  if (hospitalScope) deptFilters.push({ field: 'hospital_id', op: '==', value: hospitalScope });

  const departments = await getDocsAll('departments', deptFilters, { field: 'department_name', dir: 'asc' });

  return Promise.all(
    departments.map(async (d: any) => {
      const empCount = await countDocs('employees', [{ field: 'department_id', op: '==', value: d.id }]);
      return { id: d.id, department_name: d.department_name, employee_count: empCount };
    })
  );
};

export const getRecentActivities = async (hospitalScope?: string): Promise<any[]> => {
  const { data: logs } = await import('./firestore').then(m =>
    m.getDocsPaginated('auditLogs', [], { field: 'created_at', dir: 'desc' }, 20, 1)
  );

  let result = logs;
  if (hospitalScope) {
    const userIds = [...new Set(logs.map((l: any) => l.user_id).filter(Boolean))];
    const userDocs = await Promise.all(
      userIds.map((uid: string) => getDocById('users', uid))
    );
    const userHospitalMap = new Map<string, string>();
    userDocs.forEach((u) => {
      if (u) userHospitalMap.set(u.id, u.hospital_id);
    });
    result = logs.filter((l: any) => userHospitalMap.get(l.user_id) === hospitalScope);
  }

  return Promise.all(
    result.map(async (log: any) => {
      let user_name = 'Unknown';
      if (log.user_id) {
        const user = await getDocById('users', log.user_id);
        if (user) user_name = user.full_name;
      }
      return { ...log, user_name };
    })
  );
};

export const getRecentEmployees = async (hospitalScope?: string): Promise<any[]> => {
  const filters: FilterConstraint[] = [];
  if (hospitalScope) filters.push({ field: 'hospital_id', op: '==', value: hospitalScope });

  const { data } = await import('./firestore').then(m =>
    m.getDocsPaginated('employees', filters, { field: 'created_at', dir: 'desc' }, 10, 1)
  );

  return Promise.all(
    data.map(async (e: any) => {
      let department_name = 'Unknown';
      let hospital_name = 'Unknown';
      if (e.department_id) {
        const dept = await getDocById('departments', e.department_id);
        department_name = dept?.department_name || 'Unknown';
      }
      if (e.hospital_id) {
        const hosp = await getDocById('hospitals', e.hospital_id);
        hospital_name = hosp?.hospital_name || 'Unknown';
      }
      return { ...e, department_name, hospital_name };
    })
  );
};

export const getRecentTransfers = async (hospitalScope?: string): Promise<any[]> => {
  const { data } = await import('./firestore').then(m =>
    m.getDocsPaginated('employeeTransfers', [], { field: 'created_at', dir: 'desc' }, 10, 1)
  );

  let transfers = data;
  if (hospitalScope) {
    transfers = data.filter((t: any) =>
      t.from_hospital_id === hospitalScope || t.to_hospital_id === hospitalScope
    );
  }

  return Promise.all(
    transfers.map(async (t: any) => {
      const [emp, fromHosp, toHosp] = await Promise.all([
        t.employee_id ? getDocById('employees', t.employee_id) : null,
        t.from_hospital_id ? getDocById('hospitals', t.from_hospital_id) : null,
        t.to_hospital_id ? getDocById('hospitals', t.to_hospital_id) : null,
      ]);

      return {
        ...t,
        employee_name: emp?.full_name || 'Unknown',
        staff_id: emp?.staff_id || '',
        from_hospital: fromHosp?.hospital_name || 'Unknown',
        to_hospital: toHosp?.hospital_name || 'Unknown',
      };
    })
  );
};
