import { Router } from 'express';
import { getDashboardStats, getEmployeesPerHospital, getEmployeesPerDepartment, getRecentActivities, getRecentEmployees, getRecentTransfers } from '../controllers/dashboardController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.SUPER_ADMIN, UserRole.EXECUTIVE_SECRETARY, UserRole.HOSPITAL_ADMIN, UserRole.HR_OFFICER));

router.get('/stats', getDashboardStats);
router.get('/employees-per-hospital', getEmployeesPerHospital);
router.get('/employees-per-department', getEmployeesPerDepartment);
router.get('/recent-activities', getRecentActivities);
router.get('/recent-employees', getRecentEmployees);
router.get('/recent-transfers', getRecentTransfers);

export default router;
