import { Request, Response, NextFunction } from 'express';
import { auth, firestore } from '../config/firebase';
import { UserRole, TokenUser } from '../types';

export interface AuthRequest extends Request {
  user?: TokenUser;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = await auth.verifyIdToken(token);

    const userDoc = await firestore.collection('users').where('firebase_uid', '==', decoded.uid).limit(1).get();
    if (userDoc.empty) {
      res.status(403).json({ error: 'User account not found.' });
      return;
    }

    const userData = userDoc.docs[0].data();
    if (userData.status !== 'active') {
      res.status(403).json({ error: 'Account deactivated. Contact administrator.' });
      return;
    }

    req.user = {
      userId: userDoc.docs[0].id,
      role: userData.role as UserRole,
      hospitalId: userData.hospital_id || null,
    };
    next();
  } catch (error: any) {
    if (error?.codePrefix === 'auth') {
      res.status(401).json({ error: 'Invalid or expired token.' });
    } else {
      console.error('Auth error:', error?.message || error);
      res.status(401).json({ error: 'Invalid or expired token.' });
    }
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions.' });
      return;
    }
    next();
  };
};

export const hospitalScope = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (req.user.role === UserRole.HOSPITAL_ADMIN && req.user.hospitalId) {
    const requestedHospitalId = req.params.hospitalId || req.body.hospital_id || req.query.hospital_id as string;
    if (requestedHospitalId && requestedHospitalId !== req.user.hospitalId) {
      res.status(403).json({ error: 'Access denied. You can only access your assigned hospital.' });
      return;
    }
  }
  next();
};
