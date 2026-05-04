import { doubleCsrf } from "csrf-csrf";
import { Request, Response, NextFunction } from "express";

const {
  doubleCsrfProtection,
  generateToken,
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || "very-secret-string",
  cookieName: "x-csrf-token",
  cookieOptions: {
    httpOnly: false,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getCsrfTokenFromRequest: (req: Request) => req.headers["x-csrf-token"] as string,
  getSessionIdentifier: (req: Request) => req.cookies.jwt || "anonymous",
});

export { generateToken, doubleCsrfProtection };

/**
 * Middleware to provide CSRF token to the client.
 * This should be called on a route that the client hits before making any state-changing requests.
 */
export const csrfTokenMiddleware = (req: Request, res: Response) => {
  const token = generateToken(req, res);
  res.json({ csrfToken: token });
};
