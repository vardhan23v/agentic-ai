import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { verifyToken } from '../utils/jwt';

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized. Access token is missing or invalid.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);

    if (
      !decoded ||
      typeof decoded !== 'object' ||
      (!decoded.id && !decoded.sub) ||
      !decoded.email ||
      !decoded.role
    ) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Invalid token payload.',
      });
      return;
    }

    req.user = {
      id: (decoded.id ?? decoded.sub) as string,
      email: decoded.email as string,
      role: decoded.role as UserRole,
    };

    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized. Token is invalid or expired.',
    });
  }
}
