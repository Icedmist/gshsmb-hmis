import { Router, Response, NextFunction } from 'express';
import {
  getWorkforceDistribution, getHospitalStaffing, getDepartmentStaffing,
  getEmployeeTransfersReport, getActiveEmployees, exportCsv
} from '../controllers/reportController';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate);

const reportAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  if ([UserRole.SUPER_ADMIN, UserRole.EXECUTIVE_SECRETARY, UserRole.HOSPITAL_ADMIN, UserRole.HR_OFFICER].includes(req.user!.role)) {
    next();
  } else {
    res.status(403).json({ error: 'Insufficient permissions.' });
  }
};

router.get('/workforce-distribution', reportAccess, getWorkforceDistribution);
router.get('/hospital-staffing', reportAccess, getHospitalStaffing);
router.get('/department-staffing', reportAccess, getDepartmentStaffing);
router.get('/transfers', reportAccess, getEmployeeTransfersReport);
router.get('/active-employees', reportAccess, getActiveEmployees);
router.get('/export/csv', reportAccess, exportCsv);

export default router;
