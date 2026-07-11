import { Router, Request, Response, NextFunction } from 'express';
import { getHospitals, getHospital, createHospital, updateHospital, deleteHospital } from '../controllers/hospitalController';
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
}, getHospitals);

router.get('/:id', (req: AuthRequest, res: Response, next: NextFunction) => {
  if ([UserRole.SUPER_ADMIN, UserRole.EXECUTIVE_SECRETARY, UserRole.HOSPITAL_ADMIN].includes(req.user!.role)) {
    next();
  } else {
    res.status(403).json({ error: 'Insufficient permissions.' });
  }
}, getHospital);

router.post('/', authorize(UserRole.SUPER_ADMIN), createHospital);
router.put('/:id', authorize(UserRole.SUPER_ADMIN), updateHospital);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN), deleteHospital);

export default router;
