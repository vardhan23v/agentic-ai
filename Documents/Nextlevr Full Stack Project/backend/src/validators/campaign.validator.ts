import { z } from 'zod';
import { CampaignType, CampaignStatus } from '@prisma/client';

export const CreateCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
  clientId: z.string().uuid('Invalid client ID'),
  description: z.string().max(2000, 'Description is too long').optional().nullable(),
  type: z.nativeEnum(CampaignType),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid start date',
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid end date',
  }),
  budget: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: 'Budget must be a valid non-negative number',
    }),
  status: z.nativeEnum(CampaignStatus).optional(),
  targetAudience: z.string().max(1000, 'Target audience is too long').optional().nullable(),
  goals: z.string().max(2000, 'Goals are too long').optional().nullable(),
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  }
);

export const UpdateCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long').optional(),
  clientId: z.string().uuid('Invalid client ID').optional(),
  description: z.string().max(2000, 'Description is too long').optional().nullable(),
  type: z.nativeEnum(CampaignType).optional(),
  startDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date' })
    .optional(),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date' })
    .optional(),
  budget: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: 'Budget must be a valid non-negative number',
    })
    .optional(),
  status: z.nativeEnum(CampaignStatus).optional(),
  targetAudience: z.string().max(1000, 'Target audience is too long').optional().nullable(),
  goals: z.string().max(2000, 'Goals are too long').optional().nullable(),
});

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof UpdateCampaignSchema>;

export const CampaignFiltersSchema = z.object({
  search: z.string().max(200).optional(),
  clientId: z.string().uuid('Invalid client ID').optional(),
  type: z.nativeEnum(CampaignType).optional(),
  status: z.nativeEnum(CampaignStatus).optional(),
  startDateFrom: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid startDateFrom' })
    .optional(),
  startDateTo: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid startDateTo' })
    .optional(),
  endDateFrom: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid endDateFrom' })
    .optional(),
  endDateTo: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid endDateTo' })
    .optional(),
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
  sortBy: z.enum(['name', 'startDate', 'endDate', 'status', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export interface CampaignFilters {
  search?: string;
  clientId?: string;
  type?: CampaignType;
  status?: CampaignStatus;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}