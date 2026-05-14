import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const COOKIE_NAME = 'auth_token';

const buildUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  members: user.members || [],
});

const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
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

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
  setAuthCookie(res, token);
  return res.json({ user: buildUserResponse(user) });
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

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
  setAuthCookie(res, token);
  return res.json({ user: buildUserResponse(user) });
};

export const logoutUser = (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
};

export const getMe = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  return res.json({ user: buildUserResponse(req.user) });
};
