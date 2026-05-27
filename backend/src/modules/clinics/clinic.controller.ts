import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess } from '@utils/api-response';
import { paginationSchema } from '@utils/pagination';
import { getClinicById, listClinics } from './clinic.service';

const querySchema = paginationSchema.extend({
  q: z.string().trim().optional(),
});

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function getClinics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = querySchema.parse(req.query);
    const result = await listClinics(query);
    sendSuccess(res, result.items, 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function getClinicDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = paramsSchema.parse(req.params);
    const clinic = await getClinicById(id);
    sendSuccess(res, clinic);
  } catch (error) {
    next(error);
  }
}
