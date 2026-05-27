import { z } from 'zod';

export const getNotificationsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
  }),
});

export const markAsReadParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>['query'];
