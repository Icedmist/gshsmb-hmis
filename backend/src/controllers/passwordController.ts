import { Request, Response } from 'express';
import { getDocs, addDoc, updateDoc, getDocsAll } from '../config/database';
import { firestore } from '../config/firebase';
import { Timestamp } from 'firebase-admin/firestore';

const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendResetEmail = async (to: string, code: string, fullName: string): Promise<void> => {
  let nodemailer: any;
  try {
    nodemailer = require('nodemailer');
  } catch {
    console.log(`[EMAIL] nodemailer not available. Reset code for ${to}: ${code}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"GSHSMB HMIS" <${process.env.SMTP_USER || 'noreply@gshsmb.gov.ng'}>`,
      to,
      subject: 'GSHSMB HMIS - Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e2da; border-radius: 8px;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 3px solid #008751;">
            <h2 style="color: #008751; margin: 0;">GSHSMB HMIS</h2>
            <p style="color: #666; font-size: 12px;">Gombe State Hospital Services Management Board</p>
          </div>
          <div style="padding: 20px 0;">
            <p>Dear <strong>${fullName}</strong>,</p>
            <p>You requested a password reset for your GSHSMB HMIS account.</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background: #008751; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 15px 30px; border-radius: 8px; font-family: monospace;">
                ${code}
              </div>
            </div>
            <p style="color: #666; font-size: 14px;">This code expires in <strong>15 minutes</strong>.</p>
            <p style="color: #666; font-size: 14px;">If you did not request this, please ignore this email or contact support.</p>
          </div>
          <div style="text-align: center; padding-top: 20px; border-bottom: 1px solid #e8e2da; font-size: 12px; color: #999;">
            <p>Federal Republic of Nigeria &bull; Gombe State</p>
            <p>&copy; ${new Date().getFullYear()} GSHSMB. All rights reserved.</p>
          </div>
        </div>
      `,
    });
    console.log(`[EMAIL] Password reset code sent to ${to}`);
  } catch (err: any) {
    console.error(`[EMAIL] Failed to send to ${to}: ${err?.message}`);
    console.log(`[EMAIL FALLBACK] Reset code for ${to}: ${code}`);
  }
};

const sendSMS = async (phone: string, code: string): Promise<void> => {
  console.log(`[SMS] Password reset code ${code} would be sent to ${phone}`);
};

const notifyUser = async (email: string, phone: string | null, code: string, fullName: string): Promise<void> => {
  await sendResetEmail(email, code, fullName);
  if (phone) await sendSMS(phone, code);

  console.log(`\n========================================`);
  console.log(`PASSWORD RESET CODE for ${fullName}`);
  console.log(`========================================`);
  console.log(`Email: ${email}`);
  console.log(`Phone: ${phone || 'N/A'}`);
  console.log(`Code: ${code}`);
  console.log(`========================================\n`);
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    const users = await firestore.collection('users')
      .where('email', '==', email)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (users.empty) {
      res.status(404).json({ error: 'No account found with this email address. Please enter a registered email.' });
      return;
    }

    const userDoc = users.docs[0];
    const user = userDoc.data();
    const code = generateCode();
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 15 * 60 * 1000));

    const existingTokens = await firestore.collection('passwordResetTokens')
      .where('user_id', '==', userDoc.id)
      .where('used', '==', false)
      .where('expires_at', '>', Timestamp.now())
      .get();

    const batch = firestore.batch();
    existingTokens.forEach(doc => batch.update(doc.ref, { used: true }));
    await batch.commit();

    await addDoc('passwordResetTokens', {
      user_id: userDoc.id,
      code,
      email: user.email,
      phone_number: user.phone_number || null,
      expires_at: expiresAt,
      used: false,
    });

    await notifyUser(email, user.phone_number, code, user.full_name);

    res.json({ message: 'A reset code has been sent to your registered email address.' });
  } catch (error: any) {
    console.error('Forgot password error:', error?.message || error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, new_password } = req.body;

    if (!email || !code || !new_password) {
      res.status(400).json({ error: 'Email, code, and new password are required.' });
      return;
    }

    if (new_password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const users = await firestore.collection('users')
      .where('email', '==', email)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (users.empty) {
      res.status(400).json({ error: 'Invalid or expired reset code.' });
      return;
    }

    const userDoc = users.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data()!;

    const tokens = await firestore.collection('passwordResetTokens')
      .where('user_id', '==', userId)
      .where('code', '==', code)
      .where('email', '==', email)
      .where('used', '==', false)
      .where('expires_at', '>', Timestamp.now())
      .limit(1)
      .get();

    if (tokens.empty) {
      res.status(400).json({ error: 'Invalid or expired reset code.' });
      return;
    }

    const { auth } = await import('../config/firebase');
    await auth.updateUser(userData.firebase_uid, { password: new_password });

    await updateDoc('passwordResetTokens', tokens.docs[0].id, { used: true });

    console.log(`\n========================================`);
    console.log(`PASSWORD RESET SUCCESSFUL`);
    console.log(`User ID: ${userId}, Email: ${email}`);
    console.log(`========================================\n`);

    res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (error: any) {
    console.error('Reset password error:', error?.message || error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
