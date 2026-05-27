import { z } from 'zod';

export const recordMetricSchema = z.object({
  body: z.object({
    type: z.enum([
      'BLOOD_PRESSURE_SYSTOLIC',
      'BLOOD_PRESSURE_DIASTOLIC',
      'WEIGHT',
      'HEIGHT',
      'BLOOD_SUGAR',
      'HEART_RATE',
    ]),
    value: z.number().positive(),
  }),
});

export const getMetricsQuerySchema = z.object({
  query: z.object({
    type: z
      .enum([
        'BLOOD_PRESSURE_SYSTOLIC',
        'BLOOD_PRESSURE_DIASTOLIC',
        'WEIGHT',
        'HEIGHT',
        'BLOOD_SUGAR',
        'HEART_RATE',
      ])
      .optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }),
});

export type RecordMetricInput = z.infer<typeof recordMetricSchema>['body'];
export type GetMetricsQuery = z.infer<typeof getMetricsQuerySchema>['query'];
