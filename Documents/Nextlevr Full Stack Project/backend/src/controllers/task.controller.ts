import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import * as taskService from '../services/task.service';
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  UpdateTaskStatusSchema,
  TaskFiltersSchema,
} from '../validators/task.validator';
import { ZodError } from 'zod';

function handleZodError(error: ZodError): { field: string; message: string }[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

export async function getTasks(req: Request, res: Response): Promise<void> {
  try {
    const validatedFilters = TaskFiltersSchema.parse(req.query);

    const cleanFilters = Object.fromEntries(
      Object.entries(validatedFilters).filter(([_, v]) => v !== undefined)
    );

    const result = await taskService.getTasks(cleanFilters);

    res.status(200).json({
      success: true,
      data: result.tasks,
      pagination: result.pagination,
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
      error instanceof Error ? error.message : 'Failed to fetch tasks';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

export async function getTaskById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const task = await taskService.getTaskById(id);

    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch task';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

export async function createTask(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = CreateTaskSchema.parse(req.body);
    const task = await taskService.createTask(validatedData, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
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
      error instanceof Error ? error.message : 'Failed to create task';
    const statusCode = message.includes('not found') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}

export async function updateTask(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const validatedData = UpdateTaskSchema.parse(req.body);

    if (Object.keys(validatedData).length === 0) {
      res.status(400).json({
        success: false,
        error: 'No fields provided for update',
      });
      return;
    }

    // Fetch existing task to detect changes for notifications
    const existingTask = await taskService.getTaskById(id);
    if (!existingTask) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
      });
      return;
    }

    const task = await taskService.updateTask(id, validatedData, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task,
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
      error instanceof Error ? error.message : 'Failed to update task';
    const statusCode =
      message === 'Task not found' || message.includes('not found')
        ? 404
        : 500;

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}

export async function updateTaskStatus(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = req.params.id as string;
    const { status } = UpdateTaskStatusSchema.parse(req.body);

    const existingTask = await taskService.getTaskById(id);
    if (!existingTask) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
      });
      return;
    }

    // Team members can only update status of tasks assigned to them
    if (
      req.user.role === UserRole.TEAM_MEMBER &&
      existingTask.assignedUserId !== req.user.id
    ) {
      res.status(403).json({
        success: false,
        error: 'You can only update status of tasks assigned to you',
      });
      return;
    }

    const task = await taskService.updateTask(id, { status }, req.user.id);

    const statusLabel = status
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

    res.status(200).json({
      success: true,
      message: `Task status updated to ${statusLabel}`,
      data: task,
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
      error instanceof Error ? error.message : 'Failed to update task status';
    const statusCode = message.includes('not found') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const task = await taskService.getTaskById(id);

    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
      });
      return;
    }

    await taskService.deleteTask(id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete task';
    const statusCode = message === 'Task not found' ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}

export async function getMyTasks(req: Request, res: Response): Promise<void> {
  try {
    const validatedFilters = TaskFiltersSchema.parse(req.query);

    const cleanFilters = Object.fromEntries(
      Object.entries({
        ...validatedFilters,
        assignedUserId: req.user.id,
      }).filter(([_, v]) => v !== undefined)
    );

    const result = await taskService.getTasks(cleanFilters);

    res.status(200).json({
      success: true,
      data: result.tasks,
      pagination: result.pagination,
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
      error instanceof Error ? error.message : 'Failed to fetch tasks';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

export async function getTaskStats(_req: Request, res: Response): Promise<void> {
  try {
    const [byStatus, byPriority] = await Promise.all([
      taskService.getTasksByStatus(),
      taskService.getTasksByPriority(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus,
        byPriority,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch task stats';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}