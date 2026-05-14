import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const COOKIE_NAME = 'auth_token';

export const requireAuth = async (req, res, next) => {
  try {
    // Try Bearer token first (works on mobile), then fall back to cookie
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else {
      token = req.cookies?.[COOKIE_NAME];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid session.' });
    }
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid session.' });
  }
};
