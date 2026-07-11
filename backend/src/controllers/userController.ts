import { Response } from 'express';
import { getDoc, getDocs, addDoc, updateDoc, deleteDoc, countDocs } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';
import { auth, firestore } from '../config/firebase';

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const hospitalId = req.user?.role === 'hospital_admin' ? req.user.hospitalId : null;

    const filters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [];

    if (hospitalId) {
      filters.push({ field: 'hospital_id', op: '==', value: hospitalId });
    }

    if (search) {
      const searchUpper = search.toLowerCase();
      const { data } = await getDocs('users', filters, { field: 'created_at', dir: 'desc' }, limit, offset);
      const filtered = data.filter((u: any) =>
        u.full_name?.toLowerCase().includes(searchUpper) ||
        u.email?.toLowerCase().includes(searchUpper)
      );
      const total = filtered.length;
      const safe = filtered.map(({ firebase_uid, ...rest }: any) => rest);
      res.json({
        users: safe,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
      return;
    }

    const { data, total } = await getDocs('users', filters, { field: 'created_at', dir: 'desc' }, limit, offset);
    const safe = data.map(({ firebase_uid, ...rest }: any) => rest);

    res.json({
      users: safe,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await getDoc('users', req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const { firebase_uid, ...safe } = user;
    res.json(safe);
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { full_name, email, phone_number, role, hospital_id, password } = req.body;

    if (!full_name || !email || !role || !password) {
      res.status(400).json({ error: 'Full name, email, role, and password are required.' });
      return;
    }

    const existing = await firestore.collection('users').where('email', '==', email).limit(1).get();
    if (!existing.empty) {
      res.status(409).json({ error: 'A user with this email already exists.' });
      return;
    }

    const validRoles = ['super_admin', 'executive_secretary', 'hospital_admin', 'hr_officer'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: 'Invalid role.' });
      return;
    }

    if (role === 'hospital_admin' && !hospital_id) {
      res.status(400).json({ error: 'Hospital ID is required for hospital admin role.' });
      return;
    }

    const firebaseUser = await auth.createUser({ email, password, displayName: full_name });

    const docId = await addDoc('users', {
      firebase_uid: firebaseUser.uid,
      full_name,
      email,
      phone_number: phone_number || null,
      role,
      hospital_id: hospital_id || null,
      avatar_url: null,
      status: 'active',
    });

    const created = await getDoc('users', docId);
    const { firebase_uid, ...safe } = created;

    await logAudit(req, 'CREATE_USER', 'user', docId, `Created user ${full_name} with role ${role}`);

    res.status(201).json(safe);
  } catch (error: any) {
    console.error('Create user error:', error);
    if (error?.code === 'auth/email-already-exists') {
      res.status(409).json({ error: 'A user with this email already exists.' });
      return;
    }
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { full_name, email, phone_number, role, hospital_id, status } = req.body;
    const userId = req.params.id;

    const existing = await getDoc('users', userId);
    if (!existing) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const updateData: Record<string, any> = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (phone_number !== undefined) updateData.phone_number = phone_number;
    if (role !== undefined) updateData.role = role;
    if (hospital_id !== undefined) updateData.hospital_id = hospital_id;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: 'No fields to update.' });
      return;
    }

    await updateDoc('users', userId, updateData);

    if (full_name && existing.firebase_uid) {
      await auth.updateUser(existing.firebase_uid, { displayName: full_name });
    }

    const result = await getDoc('users', userId);
    await logAudit(req, 'UPDATE_USER', 'user', userId, `Updated user ${result.full_name}`);

    const { firebase_uid, ...safe } = result;
    res.json(safe);
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;

    if (userId === req.user!.userId) {
      res.status(400).json({ error: 'You cannot delete your own account.' });
      return;
    }

    const existing = await getDoc('users', userId);
    if (!existing) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (existing.firebase_uid) {
      await auth.deleteUser(existing.firebase_uid).catch(() => {});
    }

    await deleteDoc('users', userId);
    await logAudit(req, 'DELETE_USER', 'user', userId, `Deleted user ${existing.full_name}`);

    res.json({ message: 'User deleted successfully.' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
