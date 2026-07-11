import { Response } from 'express';
import { getDocs, getDocsAll, countDocs } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.user?.role === 'hospital_admin' ? req.user.hospitalId : null;

    const totalHospitals = await countDocs('hospitals', [{ field: 'status', op: '==', value: 'active' }]);

    const deptFilters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [
      { field: 'status', op: '==', value: 'active' },
    ];
    if (hospitalId) deptFilters.push({ field: 'hospital_id', op: '==', value: hospitalId });
    const totalDepartments = await countDocs('departments', deptFilters);

    const empFilters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [];
    if (hospitalId) empFilters.push({ field: 'hospital_id', op: '==', value: hospitalId });
    const totalEmployees = await countDocs('employees', empFilters);

    const activeEmpFilters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [
      { field: 'status', op: '==', value: 'active' },
    ];
    if (hospitalId) activeEmpFilters.push({ field: 'hospital_id', op: '==', value: hospitalId });
    const activeEmployees = await countDocs('employees', activeEmpFilters);

    res.json({
      total_hospitals: totalHospitals,
      total_departments: totalDepartments,
      total_employees: totalEmployees,
      active_employees: activeEmployees,
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error?.message || error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getEmployeesPerHospital = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.user?.role === 'hospital_admin' ? req.user.hospitalId : null;

    const hospFilters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [];
    if (hospitalId) hospFilters.push({ field: '__name__', op: '==', value: hospitalId });

    const hospitals = await getDocsAll('hospitals', hospFilters, { field: 'hospital_name', dir: 'asc' });

    const result = await Promise.all(hospitals.map(async (h: any) => {
      const count = await countDocs('employees', [{ field: 'hospital_id', op: '==', value: h.id }]);
      return { id: h.id, hospital_name: h.hospital_name, employee_count: count };
    }));

    res.json(result);
  } catch (error: any) {
    console.error('Employees per hospital error:', error?.message || error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getEmployeesPerDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.user?.role === 'hospital_admin' ? req.user.hospitalId : null;

    const deptFilters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [];
    if (hospitalId) deptFilters.push({ field: 'hospital_id', op: '==', value: hospitalId });

    const departments = await getDocsAll('departments', deptFilters, { field: 'department_name', dir: 'asc' });

    const result = await Promise.all(departments.map(async (d: any) => {
      const count = await countDocs('employees', [{ field: 'department_id', op: '==', value: d.id }]);
      return { id: d.id, department_name: d.department_name, employee_count: count };
    }));

    res.json(result);
  } catch (error: any) {
    console.error('Employees per department error:', error?.message || error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getRecentActivities = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.user?.role === 'hospital_admin' ? req.user.hospitalId : null;

    const { data: logs } = await getDocs('auditLogs', [], { field: 'created_at', dir: 'desc' }, 20);

    let result = logs;
    if (hospitalId) {
      const userIds = [...new Set(logs.map((l: any) => l.user_id).filter(Boolean))];
      const userDocs = await Promise.all(userIds.map((uid: string) =>
        getDocs('users', [{ field: '__name__', op: '==', value: uid as string }])
      ));
      const userHospitalMap = new Map<string, string>();
      for (const uRes of userDocs) {
        if (uRes.data.length > 0) {
          userHospitalMap.set(uRes.data[0].id, uRes.data[0].hospital_id);
        }
      }
      result = logs.filter((l: any) => userHospitalMap.get(l.user_id) === hospitalId);
    }

    const enriched = await Promise.all(result.map(async (log: any) => {
      let user_name = 'Unknown';
      if (log.user_id) {
        const user = await getDocs('users', [{ field: '__name__', op: '==', value: log.user_id }]);
        if (user.data.length > 0) user_name = user.data[0].full_name;
      }
      return { ...log, user_name };
    }));

    res.json(enriched);
  } catch (error: any) {
    console.error('Recent activities error:', error?.message || error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getRecentEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.user?.role === 'hospital_admin' ? req.user.hospitalId : null;

    const filters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [];
    if (hospitalId) filters.push({ field: 'hospital_id', op: '==', value: hospitalId });

    const { data } = await getDocs('employees', filters, { field: 'created_at', dir: 'desc' }, 10);

    const enriched = await Promise.all(data.map(async (e: any) => {
      let department_name = 'Unknown';
      let hospital_name = 'Unknown';
      if (e.department_id) {
        const dept = await getDocs('departments', [{ field: '__name__', op: '==', value: e.department_id }]);
        if (dept.data.length > 0) department_name = dept.data[0].department_name;
      }
      if (e.hospital_id) {
        const hosp = await getDocs('hospitals', [{ field: '__name__', op: '==', value: e.hospital_id }]);
        if (hosp.data.length > 0) hospital_name = hosp.data[0].hospital_name;
      }
      return { ...e, department_name, hospital_name };
    }));

    res.json(enriched);
  } catch (error: any) {
    console.error('Recent employees error:', error?.message || error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getRecentTransfers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.user?.role === 'hospital_admin' ? req.user.hospitalId : null;

    const { data } = await getDocs('employeeTransfers', [], { field: 'created_at', dir: 'desc' }, 10);

    let transfers = data;
    if (hospitalId) {
      transfers = data.filter((t: any) =>
        t.from_hospital_id === hospitalId || t.to_hospital_id === hospitalId
      );
    }

    const enriched = await Promise.all(transfers.map(async (t: any) => {
      const [emp, fromHosp, toHosp] = await Promise.all([
        t.employee_id ? getDocs('employees', [{ field: '__name__', op: '==', value: t.employee_id }]) : null,
        t.from_hospital_id ? getDocs('hospitals', [{ field: '__name__', op: '==', value: t.from_hospital_id }]) : null,
        t.to_hospital_id ? getDocs('hospitals', [{ field: '__name__', op: '==', value: t.to_hospital_id }]) : null,
      ]);

      return {
        ...t,
        employee_name: emp && emp.data.length > 0 ? emp.data[0].full_name : 'Unknown',
        staff_id: emp && emp.data.length > 0 ? emp.data[0].staff_id : '',
        from_hospital: fromHosp && fromHosp.data.length > 0 ? fromHosp.data[0].hospital_name : 'Unknown',
        to_hospital: toHosp && toHosp.data.length > 0 ? toHosp.data[0].hospital_name : 'Unknown',
      };
    }));

    res.json(enriched);
  } catch (error: any) {
    console.error('Recent transfers error:', error?.message || error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
