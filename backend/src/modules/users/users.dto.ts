import { z } from 'zod';

export const updateCurrentUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    phone: z.string().trim().min(8).max(20).nullable().optional(),
    address: z.string().trim().max(255).nullable().optional(),
    insuranceId: z.string().trim().max(50).nullable().optional(),
    dateOfBirth: z.coerce.date().nullable().optional(),
  }),
});

export type UpdateCurrentUserInput = z.infer<typeof updateCurrentUserSchema>['body'];
