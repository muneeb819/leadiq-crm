import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, statusCode = 200, meta?: any) => {
  res.status(statusCode).json({ success: true, data, ...(meta && { meta }) });
};

export const sendError = (res: Response, message: string, statusCode = 500, errors?: any) => {
  res.status(statusCode).json({ success: false, message, ...(errors && { errors }) });
};

export const paginate = (page: number, limit: number, total: number) => ({
  page, limit, total, totalPages: Math.ceil(total / limit),
  hasNext: page * limit < total, hasPrev: page > 1,
});
