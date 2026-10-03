import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import * as userService from '../services/user.service';
import { CreateUserSchema, UpdateUserSchema } from '../validators/user.validator';
import { ZodError } from 'zod';

function handleZodError(error: ZodError): { field: string; message: string }[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

function isAdmin(req: Request, res: Response): boolean {
  if (!req.user || req.user.role !== UserRole.ADMIN) {
    res.status(403).json({
      success: false,
      error: 'Forbidden. Admin access is required.',
    });
    return false;
  }
  return true;
}

function canAccessUser(req: Request, res: Response, targetUserId: string): boolean {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized. Authentication required.',
    });
    return false;
  }

  if (req.user.role === UserRole.ADMIN || req.user.id === targetUserId) {
    return true;
  }

  res.status(403).json({
    success: false,
    error: 'Forbidden. You can only access your own profile.',
  });
  return false;
}

export async function getUsers(req: Request, res: Response): Promise<void> {
  if (!isAdmin(req, res)) {
    return;
  }

  try {
    const roleParam = req.query.role;
    const role =
      roleParam && Object.values(UserRole).includes(roleParam as UserRole)
        ? (roleParam as UserRole)
        : undefined;
    const users = await userService.getUsers(role);

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch users';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!canAccessUser(req, res, id)) {
      return;
    }

    const user = await userService.getUserById(id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch user';
    const statusCode = message === 'User not found' ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}

export async function createUser(req: Request, res: Response): Promise<void> {
  if (!isAdmin(req, res)) {
    return;
  }

  try {
    const validatedData = CreateUserSchema.parse(req.body);
    const user = await userService.createUser(validatedData);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
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

    const message =
      error instanceof Error ? error.message : 'Failed to create user';
    const statusCode = message.includes('already exists') ? 409 : 500;

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!canAccessUser(req, res, id)) {
      return;
    }

    const validatedData = UpdateUserSchema.parse(req.body);

    if (Object.keys(validatedData).length === 0) {
      res.status(400).json({
        success: false,
        error: 'No fields provided for update',
      });
      return;
    }

    // Non-admin users cannot change their own role or disabled status
    if (req.user?.role !== UserRole.ADMIN) {
      delete validatedData.role;
      delete validatedData.disabled;
    }

    const user = await userService.updateUser(id, validatedData);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
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

    const message =
      error instanceof Error ? error.message : 'Failed to update user';
    const statusCode = message === 'User not found'
      ? 404
      : message.includes('already exists')
      ? 409
      : 500;

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}

export async function disableUser(req: Request, res: Response): Promise<void> {
  if (!isAdmin(req, res)) {
    return;
  }

  try {
    const id = req.params.id as string;
    const user = await userService.disableUser(id);

    res.status(200).json({
      success: true,
      message: 'User disabled successfully',
      data: user,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to disable user';
    const statusCode = message === 'User not found' ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}
