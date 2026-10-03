import { z } from 'zod';

export const AnalyticsFiltersSchema = z
  .object({
    dateFrom: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid dateFrom value',
      })
      .optional(),
    dateTo: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid dateTo value',
      })
      .optional(),
    clientId: z.string().uuid('Invalid client ID').optional(),
    campaignId: z.string().uuid('Invalid campaign ID').optional(),
  })
  .refine(
    (data) => {
      if (!data.dateFrom || !data.dateTo) return true;
      return new Date(data.dateTo) >= new Date(data.dateFrom);
    },
    {
      message: 'dateTo must be on or after dateFrom',
      path: ['dateTo'],
    }
  );

export type AnalyticsFiltersInput = z.infer<typeof AnalyticsFiltersSchema>;

export interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  clientId?: string;
  campaignId?: string;
}
