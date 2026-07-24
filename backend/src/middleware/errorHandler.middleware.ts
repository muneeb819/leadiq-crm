import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.message, { stack: err.stack, path: req.path });
  const status = err.status || err.statusCode || 500;
  const response: Record<string, unknown> = {
    success: false,
    message: status === 500 ? 'Internal server error' : (err.message || 'Internal server error'),
  };
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }
  res.status(status).json(response);
};

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found` });
};
