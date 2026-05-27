import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { sendError } from '../utils/api-response';
import { ZodError } from 'zod';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    sendError(res, err.code, err.message, err.statusCode, err.details);
    return;
  }

  if (err instanceof ZodError) {
    sendError(res, 'VALIDATION_ERROR', 'Invalid request data', 400, err.errors);
    return;
  }

  console.error('Unhandled error:', err);
  sendError(res, 'INTERNAL_ERROR', 'Internal server error', 500);
}
