import { AppointmentStatus } from '@prisma/client';
import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const createAppointmentSchema = z.object({
  specialtyId: z.string().uuid(),
  clinicId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  serviceIds: z.array(z.string().uuid()).default([]),
  notes: z.string().trim().max(1000).optional(),
});

export const availableSlotsQuerySchema = z.object({
  specialtyId: z.string().uuid(),
  clinicId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const appointmentListQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(AppointmentStatus).optional(),
});

export const appointmentActionSchema = z.object({
  diagnosis: z.string().trim().max(2000).optional(),
});

export const rescheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
});

