import { Router, RequestHandler } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { createReviewController, getReviewByIdController } from './review.controller';

const asyncHandler = (handler: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

export const reviewsRouter = Router();

reviewsRouter.post(
  '/',
  authenticate,
  authorize(Role.PATIENT),
  asyncHandler(createReviewController)
);

reviewsRouter.get('/:id', authenticate, asyncHandler(getReviewByIdController));

