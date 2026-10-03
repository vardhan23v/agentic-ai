import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized. Access token is missing or invalid.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);

    if (!decoded.sub) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized. Invalid token payload.',
      });
      return;
    }

    req.userId = decoded.sub;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized. Token is invalid or expired.',
    });
  }
}
