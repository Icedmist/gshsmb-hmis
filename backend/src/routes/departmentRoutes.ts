import { Router, Response, NextFunction } from 'express';
import { getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment, getDepartmentNames } from '../controllers/departmentController';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate);

router.get('/names', (req: AuthRequest, res: Response, next: NextFunction) => {
  if ([UserRole.SUPER_ADMIN, UserRole.EXECUTIVE_SECRETARY, UserRole.HOSPITAL_ADMIN, UserRole.HR_OFFICER].includes(req.user!.role)) {
    next();
  } else {
    res.status(403).json({ error: 'Insufficient permissions.' });
  }
}, getDepartmentNames);

router.get('/', (req: AuthRequest, res: Response, next: NextFunction) => {
  if ([UserRole.SUPER_ADMIN, UserRole.EXECUTIVE_SECRETARY, UserRole.HOSPITAL_ADMIN, UserRole.HR_OFFICER].includes(req.user!.role)) {
    next();
  } else {
    res.status(403).json({ error: 'Insufficient permissions.' });
  }
}, getDepartments);

router.get('/:id', (req: AuthRequest, res: Response, next: NextFunction) => {
  if ([UserRole.SUPER_ADMIN, UserRole.EXECUTIVE_SECRETARY, UserRole.HOSPITAL_ADMIN].includes(req.user!.role)) {
    next();
  } else {
    res.status(403).json({ error: 'Insufficient permissions.' });
  }
}, getDepartment);

router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN), createDepartment);
router.put('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN), updateDepartment);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN), deleteDepartment);

export default router;
