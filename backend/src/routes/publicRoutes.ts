import { Router, Request, Response } from 'express';
import { countDocs } from '../config/database';

const router = Router();

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [totalHospitals, totalDepartments, totalEmployees, activeEmployees] = await Promise.all([
      countDocs('hospitals', [{ field: 'status', op: '==', value: 'active' }]),
      countDocs('departments', [{ field: 'status', op: '==', value: 'active' }]),
      countDocs('employees', []),
      countDocs('employees', [{ field: 'status', op: '==', value: 'active' }]),
    ]);

    res.json({
      total_hospitals: totalHospitals,
      total_departments: totalDepartments,
      total_employees: totalEmployees,
      active_employees: activeEmployees,
    });
  } catch {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
