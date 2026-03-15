import type { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): Response {
  return res.status(statusCode).json({ success: true, data });
}

export function sendList<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  statusCode = 200
): Response {
  return res.status(statusCode).json({ success: true, data, meta });
}

export function sendError(res: Response, statusCode: number, error: ApiError): Response {
  return res.status(statusCode).json({ success: false, error });
}
