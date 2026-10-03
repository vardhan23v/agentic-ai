import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import * as authService from '../services/auth.service';
import { RegisterSchema, LoginSchema } from '../validators/auth.validator';
import { ZodError } from 'zod';

function handleZodError(error: ZodError): { field: string; message: string }[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

export async function register(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const validatedData = RegisterSchema.parse(req.body);
    const user = await authService.register(validatedData);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: handleZodError(error),
      });
      return;
    }

    const message = error instanceof Error ? error.message : 'Registration failed';
    const statusCode = message.includes('already exists') ? 409 : 500;

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}

export async function login(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const validatedData = LoginSchema.parse(req.body);
    const result = await authService.login(validatedData);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: handleZodError(error),
      });
      return;
    }

    const message = error instanceof Error ? error.message : 'Login failed';
    const statusCode = message.includes('Invalid') ? 401 : 500;

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}

export async function logout(
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  res.status(200).json({
    success: true,
    message: 'Logout successful. Please clear the token on the client.',
  });
}

export async function getCurrentUser(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    const user = await authService.getCurrentUser(req.userId);

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch user';
    const statusCode = message.includes('not found') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}
