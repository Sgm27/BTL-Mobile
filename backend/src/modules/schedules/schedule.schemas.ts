import { z } from 'zod';

export const registerDoctorScheduleSchema = z.object({
  workScheduleIds: z.array(z.string().uuid()).min(1).optional(),
  // Alternative: register by date+shift (auto-creates WorkSchedule)
  date: z.string().optional(),
  shift: z.enum(['MORNING', 'AFTERNOON']).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  room: z.string().trim().max(100).optional(),
});

const timeSlotSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
});

export const getTimeSlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
});

export const bulkUpsertTimeSlotsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  slots: z.array(timeSlotSchema),
});
