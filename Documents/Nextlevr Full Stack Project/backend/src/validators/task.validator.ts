import { z } from 'zod';
import { TaskPriority, TaskStatus } from '@prisma/client';

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(5000, 'Description is too long').optional().nullable(),
  assignedUserId: z.string().uuid('Invalid user ID'),
  clientId: z.string().uuid('Invalid client ID').optional().nullable(),
  campaignId: z.string().uuid('Invalid campaign ID').optional().nullable(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().datetime('Invalid due date').or(z.string().min(1, 'Due date is required')),
  status: z.nativeEnum(TaskStatus).optional(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long').optional(),
  description: z.string().max(5000, 'Description is too long').optional().nullable(),
  assignedUserId: z.string().uuid('Invalid user ID').optional(),
  clientId: z.string().uuid('Invalid client ID').optional().nullable(),
  campaignId: z.string().uuid('Invalid campaign ID').optional().nullable(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().datetime('Invalid due date').or(z.string().min(1, 'Due date is required')).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
});

export const UpdateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus, { errorMap: () => ({ message: 'Invalid task status' }) }),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof UpdateTaskStatusSchema>;

export const TaskFiltersSchema = z.object({
  search: z.string().max(200).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assignedUserId: z.string().uuid('Invalid user ID').optional(),
  clientId: z.string().uuid('Invalid client ID').optional(),
  campaignId: z.string().uuid('Invalid campaign ID').optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (val > 0 && Number.isFinite(val)), {
      message: 'Page must be a positive number',
    }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (val > 0 && val <= 100 && Number.isFinite(val)), {
      message: 'Limit must be between 1 and 100',
    }),
  sortBy: z.enum(['title', 'status', 'priority', 'dueDate', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export interface TaskFilters {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedUserId?: string;
  clientId?: string;
  campaignId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}