import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
  file?: Express.Multer.File;
  files?:
    | Express.Multer.File[]
    | { [fieldname: string]: Express.Multer.File[] };
}

interface JwtPayload {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

const resolveToken = (req: AuthRequest, allowQueryToken: boolean): string | undefined => {
  // Check Authorization header
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }

  // Check cookie as fallback
  if (req.cookies?.token) {
    return req.cookies.token;
  }

  // Allow query token only for explicitly scoped routes (e.g. SSE/download)
  if (allowQueryToken && typeof req.query.token === 'string') {
    return req.query.token;
  }

  return undefined;
};

const authenticateRequest = (allowQueryToken = false) => async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = resolveToken(req, allowQueryToken);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    // Get fresh user from DB
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired.',
      });
      return;
    }
    next(error);
  }
};

export const authenticate = authenticateRequest(false);
export const authenticateWithQueryToken = authenticateRequest(true);

// Generate JWT
export const generateToken = (userId: string, email: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET is not configured');

  return jwt.sign(
    { id: userId, email },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
};