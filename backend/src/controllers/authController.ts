import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDoc, getDocs, addDoc, updateDoc, setDoc } from '../config/database';
import { auth, firestore, firebaseApiKey, FIREBASE_AUTH_BASE } from '../config/firebase';
import { logAudit } from '../utils/audit';
import { User } from '../types';

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const fbRes = await fetch(`${FIREBASE_AUTH_BASE}/accounts:signInWithPassword?key=${firebaseApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const fbData: any = await fbRes.json();

    if (!fbRes.ok) {
      const errMsg = fbData.error?.message;
      if (errMsg === 'EMAIL_NOT_FOUND' || errMsg === 'INVALID_PASSWORD' || errMsg === 'INVALID_LOGIN_CREDENTIALS') {
        res.status(401).json({ error: 'Invalid email or password.' });
      } else if (errMsg === 'USER_DISABLED') {
        res.status(403).json({ error: 'Your account has been deactivated. Contact administrator.' });
      } else {
        res.status(401).json({ error: 'Invalid email or password.' });
      }
      return;
    }

    const { localId, idToken } = fbData;

    const userDocs = await firestore.collection('users').where('firebase_uid', '==', localId).limit(1).get();

    if (userDocs.empty) {
      res.status(403).json({ error: 'Account not found. Contact administrator.' });
      return;
    }

    const userSnap = userDocs.docs[0];
    const user = { id: userSnap.id, ...userSnap.data() } as any;

    if (user.status === 'inactive') {
      res.status(403).json({ error: 'Your account has been deactivated. Please contact your administrator.' });
      return;
    }
    if (user.status === 'suspended') {
      res.status(403).json({ error: 'Your account has been suspended. Please contact your administrator.' });
      return;
    }

    try {
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      await addDoc('auditLogs', {
        user_id: userSnap.id,
        action: 'LOGIN',
        entity_type: 'user',
        entity_id: userSnap.id,
        details: `User ${user.full_name} logged in`,
        ip_address: ipAddress,
      });
    } catch {}

    res.json({
      token: idToken,
      user: {
        id: userSnap.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
        hospital_id: user.hospital_id,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error?.message || error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      await logAudit(req, 'LOGOUT', 'user', req.user.userId, 'User logged out');
    }
    res.json({ message: 'Logged out successfully.' });
  } catch (error: any) {
    console.error('Logout error:', error?.message || error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      res.status(400).json({ error: 'Current password and new password are required.' });
      return;
    }

    if (new_password.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }

    const userDoc = await firestore.collection('users').doc(req.user!.userId).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const userData = userDoc.data()!;

    const fbRes = await fetch(`${FIREBASE_AUTH_BASE}/accounts:signInWithPassword?key=${firebaseApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userData.email, password: current_password, returnSecureToken: true }),
    });

    if (!fbRes.ok) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    await auth.updateUser(userData.firebase_uid, { password: new_password });

    await logAudit(req, 'CHANGE_PASSWORD', 'user', req.user!.userId, 'User changed password');

    res.json({ message: 'Password changed successfully.' });
  } catch (error: any) {
    console.error('Change password error:', error?.message || error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await getDoc('users', req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const { firebase_uid, ...safe } = user;
    res.json(safe);
  } catch (error: any) {
    console.error('Profile error:', error?.message || error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { full_name, email, phone_number } = req.body;
    const userId = req.user!.userId;

    if (email) {
      const existing = await firestore.collection('users')
        .where('email', '==', email).limit(1).get();
      if (!existing.empty && existing.docs[0].id !== userId) {
        res.status(409).json({ error: 'Email already in use by another user.' });
        return;
      }
    }

    const updateData: Record<string, any> = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (phone_number !== undefined) updateData.phone_number = phone_number;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: 'No fields to update.' });
      return;
    }

    await updateDoc('users', userId, updateData);

    const result = await getDoc('users', userId);
    await logAudit(req, 'UPDATE_PROFILE', 'user', userId, 'User updated profile');

    res.json(result);
  } catch (error: any) {
    console.error('Update profile error:', error?.message || error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const file = (req as any).file;

    if (!file) {
      res.status(400).json({ error: 'No image file provided.' });
      return;
    }

    const bucket = (await import('../config/firebase')).storage.bucket();
    const ext = file.originalname?.split('.').pop() || 'jpg';
    const blob = bucket.file(`avatars/${userId}-${Date.now()}.${ext}`);
    const blobStream = blob.createWriteStream({ resumable: false, contentType: file.mimetype });

    blobStream.on('error', (err: Error) => {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Upload failed.' });
    });

    blobStream.on('finish', async () => {
      await blob.makePublic();
      const avatarUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      await updateDoc('users', userId, { avatar_url: avatarUrl });
      await logAudit(req, 'UPDATE_AVATAR', 'user', userId, 'User updated profile picture');
      res.json({ avatar_url: avatarUrl });
    });

    blobStream.end(file.buffer);
  } catch (error: any) {
    console.error('Upload avatar error:', error?.message || error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
