/**
 * review.routes.ts
 * Module "Đánh giá bác sĩ" (Reviews) — tác giả Ngô Đức Sơn.
 * Khai báo các route dưới tiền tố /api/v1/reviews. Tạo review yêu cầu role
 * PATIENT; xem chi tiết review chỉ cần đã đăng nhập (authenticate).
 */
import { Router, RequestHandler } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { createReviewController, getReviewByIdController } from './review.controller';

/** Bọc controller async để tự động chuyển lỗi Promise sang middleware xử lý lỗi. */
const asyncHandler = (handler: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

export const reviewsRouter = Router();

// POST / — bệnh nhân tạo đánh giá cho cuộc hẹn đã hoàn tất
reviewsRouter.post(
  '/',
  authenticate,
  authorize(Role.PATIENT),
  asyncHandler(createReviewController)
);

// GET /:id — xem chi tiết một đánh giá
reviewsRouter.get('/:id', authenticate, asyncHandler(getReviewByIdController));

