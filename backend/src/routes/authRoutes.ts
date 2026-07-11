import { Router } from 'express';
import multer from 'multer';
import { login, logout, changePassword, getProfile, updateProfile, uploadAvatar } from '../controllers/authController';
import { forgotPassword, resetPassword } from '../controllers/passwordController';
import { authenticate } from '../middleware/auth';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(file.originalname.toLowerCase().split('.').pop() || '');
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only image files (jpg, png, gif, webp) are allowed.'));
  },
});

router.post('/login', login);
router.post('/logout', authenticate, logout);
router.post('/change-password', authenticate, changePassword);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
