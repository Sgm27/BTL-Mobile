import { Router, RequestHandler } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import {
  getMyDoctorSchedulesController,
  registerDoctorSchedulesController,
  getDoctorTimeSlotsController,
  bulkUpsertDoctorTimeSlotsController,
} from './schedule.controller';

const asyncHandler = (handler: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

export const schedulesRouter = Router();

schedulesRouter.post(
  '/doctor/register',
  authenticate,
  authorize(Role.DOCTOR),
  asyncHandler(registerDoctorSchedulesController)
);

schedulesRouter.get(
  '/doctor/me',
  authenticate,
  authorize(Role.DOCTOR),
  asyncHandler(getMyDoctorSchedulesController)
);

schedulesRouter.get(
  '/doctor/time-slots',
  authenticate,
  authorize(Role.DOCTOR),
  asyncHandler(getDoctorTimeSlotsController)
);

schedulesRouter.put(
  '/doctor/time-slots',
  authenticate,
  authorize(Role.DOCTOR),
  asyncHandler(bulkUpsertDoctorTimeSlotsController)
);

