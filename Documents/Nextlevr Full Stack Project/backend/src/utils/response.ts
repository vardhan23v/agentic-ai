import { Response } from 'express';

export function success(
  res: Response,
  data: unknown,
  message?: string
): void {
  res.status(200).json({
    success: true,
    message,
    data,
  });
}

export function error(
  res: Response,
  message: string,
  statusCode: number = 500
): void {
  res.status(statusCode).json({
    success: false,
    message,
  });
}
