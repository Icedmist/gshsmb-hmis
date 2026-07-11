import { Router, Response, NextFunction } from 'express';
import { getEmployees, getEmployee, createEmployee, updateEmployee, transferEmployee, getEmployeeTransfers, approveTransfer, rejectTransfer } from '../controllers/employeeController';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate);

router.get('/', (req: AuthRequest, res: Response, next: NextFunction) => {
  if ([UserRole.SUPER_ADMIN, UserRole.EXECUTIVE_SECRETARY, UserRole.HOSPITAL_ADMIN, UserRole.HR_OFFICER].includes(req.user!.role)) {
    next();
  } else {
    res.status(403).json({ error: 'Insufficient permissions.' });
  }
}, getEmployees);

router.get('/transfers', authorize(UserRole.SUPER_ADMIN, UserRole.EXECUTIVE_SECRETARY, UserRole.HR_OFFICER), getEmployeeTransfers);

router.get('/:id', (req: AuthRequest, res: Response, next: NextFunction) => {
  if ([UserRole.SUPER_ADMIN, UserRole.EXECUTIVE_SECRETARY, UserRole.HOSPITAL_ADMIN, UserRole.HR_OFFICER].includes(req.user!.role)) {
    next();
  } else {
    res.status(403).json({ error: 'Insufficient permissions.' });
  }
}, getEmployee);

router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.HR_OFFICER), createEmployee);
router.put('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.HR_OFFICER), updateEmployee);
router.post('/:id/transfer', authorize(UserRole.SUPER_ADMIN, UserRole.HR_OFFICER), transferEmployee);
router.put('/transfers/:id/approve', authorize(UserRole.SUPER_ADMIN, UserRole.HR_OFFICER), approveTransfer);
router.put('/transfers/:id/reject', authorize(UserRole.SUPER_ADMIN, UserRole.HR_OFFICER), rejectTransfer);

export default router;
