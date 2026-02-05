import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const correlationId = uuidv4();
  req.correlationId = correlationId;

  const start = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('user-agent') || 'unknown';

  // Log incoming request
  logger.info(`Incoming Request: ${method} ${url}`, {
    correlationId,
    method,
    url,
    ip,
    userAgent,
  });

  // Intercept response to log outgoing response
  const originalSend = res.send;
  res.send = function (body: any) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    logger.info(`Outgoing Response: ${method} ${url} ${statusCode} (${duration}ms)`, {
      correlationId,
      method,
      url,
      statusCode,
      duration,
      ip,
    });

    return originalSend.call(this, body);
  };

  next();
};

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const correlationId = req.correlationId || 'unknown';
  
  logger.error(`Unhandled Error: ${err.message}`, {
    correlationId,
    stack: err.stack,
    method: req.method,
    url: req.url,
  });

  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    correlationId,
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};
