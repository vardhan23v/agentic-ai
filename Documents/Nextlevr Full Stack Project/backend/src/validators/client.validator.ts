import { z } from 'zod';
import { ClientStatus } from '@prisma/client';

export const CreateClientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
  company: z.string().min(1, 'Company is required').max(200, 'Company name is too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(30, 'Phone number is too long').optional().nullable(),
  industry: z.string().max(100, 'Industry is too long').optional().nullable(),
  website: z.string().url('Invalid website URL').max(500, 'Website URL is too long').optional().nullable(),
  status: z.nativeEnum(ClientStatus).optional(),
  notes: z.string().max(2000, 'Notes are too long').optional().nullable(),
});

export const UpdateClientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long').optional(),
  company: z.string().min(1, 'Company is required').max(200, 'Company name is too long').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().max(30, 'Phone number is too long').optional().nullable(),
  industry: z.string().max(100, 'Industry is too long').optional().nullable(),
  website: z.string().url('Invalid website URL').max(500, 'Website URL is too long').optional().nullable(),
  status: z.nativeEnum(ClientStatus).optional(),
  notes: z.string().max(2000, 'Notes are too long').optional().nullable(),
});

export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;

export const ClientFiltersSchema = z.object({
  search: z.string().max(200).optional(),
  status: z.nativeEnum(ClientStatus).optional(),
  industry: z.string().max(100).optional(),
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
  sortBy: z.enum(['name', 'company', 'status', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export interface ClientFilters {
  search?: string;
  status?: ClientStatus;
  industry?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}