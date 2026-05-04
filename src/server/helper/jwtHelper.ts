import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { JWT_EXPIRES_IN, COOKIE_MAX_AGE } from '../constants';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production'
  ? (() => { throw new Error('JWT_SECRET environment variable is required in production'); })()
  : 'dev-secret-only-not-for-production-use');

export interface JwtPayload {
  userId: number;
  roleId: number;
  tenantId: number;
}

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN, algorithm: 'HS256' });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
};

export const setAuthCookie = (res: Response, token: string) => {
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
};

export const clearAuthCookie = (res: Response) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
};
