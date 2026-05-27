/**
 * review.schemas.ts
 * Module "Đánh giá bác sĩ" (Reviews) — tác giả Ngô Đức Sơn.
 * Các Zod schema validate dữ liệu request (body, params) cho module đánh giá.
 */
import { z } from 'zod';

/** Validate body tạo đánh giá: appointmentId, rating (1-5 sao), comment tuỳ chọn. */
export const createReviewSchema = z.object({
  appointmentId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
});

/** Validate path param id của review (phải là UUID). */
export const reviewIdParamSchema = z.object({
  id: z.string().uuid(),
});

