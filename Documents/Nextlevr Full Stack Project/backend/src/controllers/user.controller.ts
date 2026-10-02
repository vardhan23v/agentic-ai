import { Request, Response } from 'express';
import * as userService from '../services/user.service';

export async function getUsers(_req: Request, res: Response): Promise<void> {
  try {
    const users = await userService.listUsers();

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
