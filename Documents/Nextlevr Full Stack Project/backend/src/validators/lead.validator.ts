import { z } from 'zod';
import { LeadStatus } from '@prisma/client';

export const CreateLeadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(30, 'Phone number is too long').optional().nullable(),
  company: z.string().max(200, 'Company name is too long').optional().nullable(),
  source: z.string().min(1, 'Source is required').max(100, 'Source is too long'),
  campaignId: z.string().uuid('Invalid campaign ID').optional().nullable(),
  status: z.nativeEnum(LeadStatus).optional(),
  value: z.number().min(0, 'Value must be non-negative').optional(),
  assignedUserId: z.string().uuid('Invalid user ID').optional().nullable(),
  notes: z.string().max(5000, 'Notes are too long').optional().nullable(),
});

export const UpdateLeadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().max(30, 'Phone number is too long').optional().nullable(),
  company: z.string().max(200, 'Company name is too long').optional().nullable(),
  source: z.string().min(1, 'Source is required').max(100, 'Source is too long').optional(),
  campaignId: z.string().uuid('Invalid campaign ID').optional().nullable(),
  status: z.nativeEnum(LeadStatus).optional(),
  value: z.number().min(0, 'Value must be non-negative').optional(),
  assignedUserId: z.string().uuid('Invalid user ID').optional().nullable(),
  notes: z.string().max(5000, 'Notes are too long').optional().nullable(),
});

export const UpdateLeadStatusSchema = z.object({
  status: z.nativeEnum(LeadStatus, { errorMap: () => ({ message: 'Invalid lead status' }) }),
});

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;
export type UpdateLeadStatusInput = z.infer<typeof UpdateLeadStatusSchema>;

export const LeadFiltersSchema = z.object({
  search: z.string().max(200).optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  source: z.string().max(100).optional(),
  campaignId: z.string().uuid('Invalid campaign ID').optional(),
  assignedUserId: z.string().uuid('Invalid user ID').optional(),
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
  sortBy: z.enum(['name', 'status', 'source', 'value', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export interface LeadFilters {
  search?: string;
  status?: LeadStatus;
  source?: string;
  campaignId?: string;
  assignedUserId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}