import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess } from '@utils/api-response';
import { paginationSchema } from '@utils/pagination';
import { listSpecialties } from './specialty.service';

const querySchema = paginationSchema.extend({
  q: z.string().trim().optional(),
});

export async function getSpecialties(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = querySchema.parse(req.query);
    const result = await listSpecialties(query);
    sendSuccess(res, result.items, 200, result.meta);
  } catch (error) {
    next(error);
  }
}
