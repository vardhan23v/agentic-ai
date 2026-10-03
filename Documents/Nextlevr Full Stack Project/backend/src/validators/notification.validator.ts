import { z } from 'zod';

export const NotificationIdParamSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
});

export type NotificationIdParamInput = z.infer<typeof NotificationIdParamSchema>;
