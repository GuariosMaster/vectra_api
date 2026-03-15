import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants.js';

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(HTTP_STATUS.UNPROCESSABLE).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  const status = (err as { status?: number }).status ?? HTTP_STATUS.INTERNAL;
  const code = (err as { code?: string }).code ?? ERROR_CODES.INTERNAL_ERROR;
  const message = err.message ?? 'Internal server error';

  if (status >= 500) {
    logger.error('Unhandled error', { err });
  }

  res.status(status).json({
    success: false,
    error: { code, message },
  });
};

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}
