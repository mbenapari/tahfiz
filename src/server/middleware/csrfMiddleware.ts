import { doubleCsrf } from "csrf-csrf";
import { Request, Response, NextFunction } from "express";

const doubleCsrfUtilities = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || "very-secret-string",
  cookieName: "_csrf_secret",
  cookieOptions: {
    httpOnly: true, // Better security
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getCsrfTokenFromRequest: (req: Request) => req.headers["x-csrf-token"] as string,
  getSessionIdentifier: (req: Request) => {
    // Use a more stable identifier if possible, like a session ID or a part of the JWT
    // For now, if JWT exists, we use it, otherwise anonymous
    return req.cookies.jwt ? "authenticated" : "anonymous";
  },
});

export const doubleCsrfProtection = doubleCsrfUtilities.doubleCsrfProtection;
export const generateToken = doubleCsrfUtilities.generateCsrfToken;

/**
 * Middleware to provide CSRF token to the client.
 * This should be called on a route that the client hits before making any state-changing requests.
 */
export const csrfTokenMiddleware = (req: Request, res: Response) => {
  const token = doubleCsrfUtilities.generateCsrfToken(req, res);
  res.json({ csrfToken: token });
};
