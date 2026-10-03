import { z } from 'zod';

export const ActivityFiltersSchema = z.object({
  entityType: z.string().max(50).optional(),
  entityId: z.string().uuid('Invalid entity ID').optional(),
  action: z.string().max(50).optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (val > 0 && val <= 100 && Number.isFinite(val)), {
      message: 'Limit must be between 1 and 100',
    }),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (val >= 0 && Number.isFinite(val)), {
      message: 'Offset must be a non-negative number',
    }),
});

export type ActivityFiltersInput = z.infer<typeof ActivityFiltersSchema>;
