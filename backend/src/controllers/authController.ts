import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { generateToken } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';

const setAuthCookie = (res: Response, token: string): void => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) {
    sendError(res, 'Email already registered', 409);
    return;
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id.toString(), user.email);
  setAuthCookie(res, token);

  sendSuccess(
    res,
    { token, user: { id: user._id, name: user.name, email: user.email } },
    'Registered successfully',
    201
  );
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user) {
    sendError(res, 'Invalid credentials', 401);
    return;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    sendError(res, 'Invalid credentials', 401);
    return;
  }

  const token = generateToken(user._id.toString(), user.email);
  setAuthCookie(res, token);

  sendSuccess(res, {
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendError(res, 'Unauthorized', 401);
    return;
  }

  sendSuccess(res, {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
  });
});

export const logout = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.clearCookie('token');
  sendSuccess(res, {}, 'Logged out');
});