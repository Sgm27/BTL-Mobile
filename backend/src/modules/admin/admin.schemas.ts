import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const rejectDoctorSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
});

export const createClinicSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
  phone: z.string().optional(),
  openingHours: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export const updateClinicSchema = createClinicSchema.partial();

export const createSpecialtySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  iconUrl: z.string().url().optional(),
  symptoms: z.array(z.string()).optional(),
});

export const updateSpecialtySchema = createSpecialtySchema.partial();

export const createServiceSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  category: z.string().optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

export const generateSchedulesSchema = z.object({
  year: z.number().int().min(2024).max(2030),
  month: z.number().int().min(1).max(12),
});

export const listDoctorsQuerySchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'REJECTED']).optional(),
});
