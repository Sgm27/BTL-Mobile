/**
 * review.controller.ts
 * Module "Đánh giá bác sĩ" (Reviews) — tác giả Ngô Đức Sơn.
 * Lớp controller: validate request bằng Zod schema, gọi service và trả response.
 */
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/app-error';
import { sendSuccess } from '../../utils/api-response';
import { createReviewSchema, reviewIdParamSchema } from './review.schemas';
import { createReview, getReviewById } from './review.service';

/**
 * POST /api/v1/reviews — role PATIENT.
 * Tạo đánh giá bác sĩ cho một cuộc hẹn đã hoàn tất; trả về review vừa tạo (201).
 */
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

/**
 * GET /api/v1/reviews/:id — yêu cầu đăng nhập (authenticate).
 * Lấy chi tiết một đánh giá theo id.
 */
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
