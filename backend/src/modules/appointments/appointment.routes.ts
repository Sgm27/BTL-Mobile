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

const asyncHandler = (handler: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

export const appointmentsRouter = Router();

// Available slots - public, no auth needed (patient browses before booking)
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

