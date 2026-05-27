import { z } from 'zod';

export const createReviewSchema = z.object({
  appointmentId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
});

export const reviewIdParamSchema = z.object({
  id: z.string().uuid(),
});

