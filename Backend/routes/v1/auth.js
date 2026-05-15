import express from 'express';
import { getMe, loginUser, logoutUser, registerUser, refreshTokens } from '../../controllers/authController.js';
import { requireAuth } from '../../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/refresh', refreshTokens);
router.get('/me', requireAuth, getMe);

export default router;
