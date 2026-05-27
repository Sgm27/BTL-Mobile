import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/app-error';
import { sendSuccess } from '../../utils/api-response';
import { createReviewSchema, reviewIdParamSchema } from './review.schemas';
import { createReview, getReviewById } from './review.service';

export async function createReviewController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      throw AppError.unauthorized();
    }

    const payload = createReviewSchema.parse(req.body);
    const review = await createReview(user, payload);
    sendSuccess(res, review, 201);
  } catch (error) {
    next(error);
  }
}

export async function getReviewByIdController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const params = reviewIdParamSchema.parse(req.params);
    const review = await getReviewById(params.id);
    sendSuccess(res, review);
  } catch (error) {
    next(error);
  }
}
