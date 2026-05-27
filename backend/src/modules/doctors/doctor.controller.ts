import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess } from '@utils/api-response';
import { paginationSchema } from '@utils/pagination';
import { getDoctorById, getDoctorReviews, listDoctorSlots, listDoctors } from './doctor.service';

const listQuerySchema = paginationSchema.extend({
  q: z.string().trim().optional(),
  specialtyId: z.string().uuid().optional(),
  clinicId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'REJECTED']).optional(),
});

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const slotsQuerySchema = z.object({
  date: z.string().trim().optional(),
});

const reviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export async function getDoctors(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = listQuerySchema.parse(req.query);
    const result = await listDoctors(query);
    sendSuccess(res, result.items, 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function getDoctorDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = paramsSchema.parse(req.params);
    const doctor = await getDoctorById(id);
    sendSuccess(res, doctor);
  } catch (error) {
    next(error);
  }
}

export async function getDoctorSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = paramsSchema.parse(req.params);
    const query = slotsQuerySchema.parse(req.query);
    const slots = await listDoctorSlots({ id, date: query.date });
    sendSuccess(res, slots);
  } catch (error) {
    next(error);
  }
}

export async function getDoctorReviewsList(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = paramsSchema.parse(req.params);
    const query = reviewsQuerySchema.parse(req.query);
    const result = await getDoctorReviews(id, query);
    sendSuccess(
      res,
      { items: result.items, stats: result.stats },
      200,
      result.meta
    );
  } catch (error) {
    next(error);
  }
}
