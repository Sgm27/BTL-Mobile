/**
 * schedule.routes.ts
 * Module "Quản lý lịch làm việc" (Schedules) — tác giả Ngô Đức Sơn.
 * Khai báo các route dưới tiền tố /api/v1/schedules. Mọi route đều qua
 * middleware authenticate (xác thực JWT) và authorize(Role.DOCTOR).
 */
import { Router, RequestHandler } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import {
  getMyDoctorSchedulesController,
  registerDoctorSchedulesController,
  getDoctorTimeSlotsController,
  bulkUpsertDoctorTimeSlotsController,
} from './schedule.controller';

/** Bọc controller async để tự động chuyển lỗi Promise sang middleware xử lý lỗi. */
const asyncHandler = (handler: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

export const schedulesRouter = Router();

// POST /doctor/register — bác sĩ đăng ký ca làm việc
schedulesRouter.post(
  '/doctor/register',
  authenticate,
  authorize(Role.DOCTOR),
  asyncHandler(registerDoctorSchedulesController)
);

// GET /doctor/me — xem ca làm việc đã đăng ký của bác sĩ
schedulesRouter.get(
  '/doctor/me',
  authenticate,
  authorize(Role.DOCTOR),
  asyncHandler(getMyDoctorSchedulesController)
);

// GET /doctor/time-slots — xem khung giờ khám trong ngày
schedulesRouter.get(
  '/doctor/time-slots',
  authenticate,
  authorize(Role.DOCTOR),
  asyncHandler(getDoctorTimeSlotsController)
);

// PUT /doctor/time-slots — cập nhật hàng loạt khung giờ khám trong ngày
schedulesRouter.put(
  '/doctor/time-slots',
  authenticate,
  authorize(Role.DOCTOR),
  asyncHandler(bulkUpsertDoctorTimeSlotsController)
);

