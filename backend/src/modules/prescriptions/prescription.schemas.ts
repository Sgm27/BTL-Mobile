import { z } from 'zod';

export const savePrescriptionSchema = z.object({
  body: z.object({
    imageUrl: z.string().url(),
    ocrData: z.object({
      medicines: z.array(
        z.object({
          name: z.string(),
          dosage: z.string(),
          quantity: z.string(),
          frequency: z.string(),
        })
      ),
      rawText: z.string().optional(),
    }),
  }),
});

export const getPrescriptionsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
  }),
});

export type SavePrescriptionInput = z.infer<typeof savePrescriptionSchema>['body'];
export type GetPrescriptionsQuery = z.infer<typeof getPrescriptionsQuerySchema>['query'];
