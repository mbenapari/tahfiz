import express from "express";
import ViteExpress from "vite-express";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes";
import schoolRoutes from "./routes/schoolRoutes";
import statsRoutes from "./routes/statsRoutes";
import { requestLogger, globalErrorHandler } from "./middleware/loggingMiddleware";
import logger from "./utils/logger";

const app = express();

// Global Request-scoped UUID and logging
app.use(requestLogger);

app.use(express.json());
app.use(cookieParser());

// ... existing routes ...

app.use("/api/users", userRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/stats", statsRoutes);

// Global Error Handler (must be last)
app.use(globalErrorHandler);

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', {
    message: err.message,
    stack: err.stack,
  });
  // Optional: Graceful shutdown
  // process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

ViteExpress.listen(app, 3000, () =>
  logger.info("Server is listening on port 3000..."),
);
