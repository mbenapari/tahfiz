import dotenv from "dotenv";
dotenv.config();

import express from "express";
import ViteExpress from "vite-express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import schoolRoutes from "./routes/schoolRoutes";
import statsRoutes from "./routes/statsRoutes";
import surahRoutes from "./routes/surahRoutes";
import sessionRoutes from "./routes/sessionRoutes";
import reportRoutes from "./routes/reportRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import ownerRoutes from "./routes/ownerRoutes";
import { requestLogger, globalErrorHandler } from "./middleware/loggingMiddleware";
import { doubleCsrfProtection, csrfTokenMiddleware } from "./middleware/csrfMiddleware";
import logger from "./utils/logger";

const app = express();

// Global Request-scoped UUID and logging
app.use(requestLogger);

app.use(express.json());
app.use(cookieParser());

// CSRF Token endpoint - MUST be before doubleCsrfProtection
app.get("/api/csrf-token", csrfTokenMiddleware);

// Apply CSRF protection to all /api routes except the token endpoint
app.use("/api", (req, res, next) => {
  if (req.path === "/csrf-token") return next();
  doubleCsrfProtection(req, res, next);
});

// Security Headers for API
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/surahs", surahRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/metrics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/owner", ownerRoutes);

// Global Error Handler (must be last)
app.use(globalErrorHandler);

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', {
    message: err.message,
    stack: err.stack,
  });
  
  // Graceful shutdown: give the server a chance to finish pending requests
  // before exiting. Running in an undefined state is dangerous.
  logger.info('Initiating graceful shutdown due to uncaught exception...');
  setTimeout(() => {
    process.exit(1);
  }, 1000).unref();
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  
  // Unhandled rejections are often non-fatal but should be fixed.
  // We log them but don't necessarily crash the process immediately.
});

ViteExpress.listen(app, 3000, () =>
  logger.info("Server is listening on port 3000..."),
);
