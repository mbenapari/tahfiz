import jwt from 'jsonwebtoken';
import { Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';
const JWT_EXPIRES_IN = '1d';
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 1 day

export interface JwtPayload {
  userId: number;
  roleId: number;
  tenantId: number;
}

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
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
