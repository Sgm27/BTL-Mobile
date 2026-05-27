/**
 * appointment.routes.ts
 * Thuộc module Đặt lịch khám (Appointments) của Ngô Đức Sơn.
 *
 * Khai báo các endpoint dưới prefix /api/v1/appointments, gắn middleware
 * authenticate (xác thực JWT) và authorize (phân quyền theo role) cho từng
 * route, rồi ánh xạ tới controller tương ứng.
 */
import { Router, RequestHandler } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import {
  cancelAppointmentController,
  completeAppointmentController,
  confirmAppointmentController,
  createAppointmentController,
  getAppointmentByIdController,
  getAvailableSlotsController,
  getMyAppointmentsController,
  payAppointmentController,
  rejectAppointmentController,
  rescheduleAppointmentController,
} from './appointment.controller';

// Bọc controller bất đồng bộ để mọi lỗi promise được chuyển tới error middleware
// qua next, tránh phải lặp try/catch ở từng route.
const asyncHandler = (handler: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

export const appointmentsRouter = Router();

// Khung giờ trống - public, không cần xác thực (bệnh nhân xem trước khi đặt)
appointmentsRouter.get('/available-slots', asyncHandler(getAvailableSlotsController));

appointmentsRouter.post(
  '/',
  authenticate,
  authorize(Role.PATIENT, Role.ADMIN),
  asyncHandler(createAppointmentController)
);

appointmentsRouter.get('/', authenticate, asyncHandler(getMyAppointmentsController));
appointmentsRouter.get('/me', authenticate, asyncHandler(getMyAppointmentsController));
appointmentsRouter.get('/:id', authenticate, asyncHandler(getAppointmentByIdController));
appointmentsRouter.put(
  '/:id/cancel',
  authenticate,
  authorize(Role.PATIENT, Role.ADMIN),
  asyncHandler(cancelAppointmentController)
);
appointmentsRouter.put(
  '/:id/reschedule',
  authenticate,
  authorize(Role.PATIENT, Role.ADMIN),
  asyncHandler(rescheduleAppointmentController)
);
appointmentsRouter.put(
  '/:id/confirm',
  authenticate,
  authorize(Role.DOCTOR),
  asyncHandler(confirmAppointmentController)
);
appointmentsRouter.put(
  '/:id/complete',
  authenticate,
  authorize(Role.DOCTOR),
  asyncHandler(completeAppointmentController)
);
appointmentsRouter.put(
  '/:id/reject',
  authenticate,
  authorize(Role.DOCTOR),
  asyncHandler(rejectAppointmentController)
);
appointmentsRouter.put(
  '/:id/pay',
  authenticate,
  authorize(Role.PATIENT, Role.ADMIN),
  asyncHandler(payAppointmentController)
);

