import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const REFRESH_SECRET = process.env.REFRESH_SECRET || JWT_SECRET + '_refresh';
const COOKIE_NAME = 'auth_token';
const isProduction = process.env.NODE_ENV === 'production';

const buildUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  members: user.members || [],
});

const cookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? 'none' : 'lax',
  secure: isProduction,
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, cookieOptions);
};

const setRefreshCookie = (res, token) => {
  res.cookie('refresh_token', token, cookieOptions);
};

export const registerUser = async (req, res) => {
  const { name, email, password, members } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: 'Email already registered.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const memberList = Array.isArray(members)
    ? members
    : String(members || '')
      .split(',')
      .map((member) => member.trim())
      .filter(Boolean);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    members: memberList.length > 0 ? memberList : [name],
  });

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId: user._id }, REFRESH_SECRET, { expiresIn: '7d' });

  user.refreshTokens.push(refreshToken);
  await user.save();

  setAuthCookie(res, token);
  setRefreshCookie(res, refreshToken);
  return res.json({ token, refreshToken, user: buildUserResponse(user) });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId: user._id }, REFRESH_SECRET, { expiresIn: '7d' });

  user.refreshTokens.push(refreshToken);
  await user.save();

  setAuthCookie(res, token);
  setRefreshCookie(res, refreshToken);
  return res.json({ token, refreshToken, user: buildUserResponse(user) });
};

export const logoutUser = async (req, res) => {
  const { refreshToken: bodyToken } = req.body || {};
  const cookieToken = req.cookies?.['refresh_token'];
  const refreshToken = bodyToken || cookieToken;

  if (refreshToken) {
    try {
      const payload = jwt.verify(refreshToken, REFRESH_SECRET);
      const user = await User.findById(payload.userId);
      if (user) {
        user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
        await user.save();
      }
    } catch (error) {
      // Ignore invalid token on logout
    }
  }

  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
  });
  res.clearCookie('refresh_token', {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
  });
  res.json({ ok: true });
};

export const refreshTokens = async (req, res) => {
  const { refreshToken: bodyToken } = req.body || {};
  const cookieToken = req.cookies?.['refresh_token'];
  const refreshToken = bodyToken || cookieToken;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required.' });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await User.findById(payload.userId);

    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }

    // Issue new access token
    const accessToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '15m' });

    // Rotate refresh token
    const newRefreshToken = jwt.sign({ userId: user._id }, REFRESH_SECRET, { expiresIn: '7d' });

    // Remove old refresh token and add new one
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    setAuthCookie(res, accessToken);
    setRefreshCookie(res, newRefreshToken);
    return res.json({ token: accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }
};

export const getMe = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  return res.json({ user: buildUserResponse(req.user) });
};
