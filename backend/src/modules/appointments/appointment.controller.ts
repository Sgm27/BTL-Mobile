import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/app-error';
import { sendSuccess } from '../../utils/api-response';
import {
  appointmentListQuerySchema,
  availableSlotsQuerySchema,
  createAppointmentSchema,
  idParamSchema,
  rescheduleSchema,
} from './appointment.schemas';
import {
  cancelAppointment,
  completeAppointment,
  confirmAppointment,
  createAppointment,
  getAppointmentById,
  getAvailableSlots,
  getMyAppointments,
  payAppointment,
  rejectAppointment,
  rescheduleAppointment,
} from './appointment.service';

export async function getAvailableSlotsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = availableSlotsQuerySchema.parse(req.query);
    const slots = await getAvailableSlots(query);
    sendSuccess(res, slots);
  } catch (error) {
    next(error);
  }
}

export async function createAppointmentController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      throw AppError.unauthorized();
    }

    const payload = createAppointmentSchema.parse(req.body);
    const appointment = await createAppointment(user.userId, payload);
    sendSuccess(res, appointment, 201);
  } catch (error) {
    next(error);
  }
}

export async function getMyAppointmentsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      throw AppError.unauthorized();
    }

    const query = appointmentListQuerySchema.parse(req.query);
    const result = await getMyAppointments(user, query);
    sendSuccess(res, result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function getAppointmentByIdController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      throw AppError.unauthorized();
    }

    const params = idParamSchema.parse(req.params);
    const appointment = await getAppointmentById(user, params.id);
    sendSuccess(res, appointment);
  } catch (error) {
    next(error);
  }
}

export async function cancelAppointmentController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      throw AppError.unauthorized();
    }

    const params = idParamSchema.parse(req.params);
    const appointment = await cancelAppointment(user, params.id);
    sendSuccess(res, appointment);
  } catch (error) {
    next(error);
  }
}

export async function confirmAppointmentController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      throw AppError.unauthorized();
    }

    const params = idParamSchema.parse(req.params);
    const appointment = await confirmAppointment(user, params.id);
    sendSuccess(res, appointment);
  } catch (error) {
    next(error);
  }
}

export async function rescheduleAppointmentController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      throw AppError.unauthorized();
    }

    const params = idParamSchema.parse(req.params);
    const body = rescheduleSchema.parse(req.body);
    const appointment = await rescheduleAppointment(user.userId, params.id, body);
    sendSuccess(res, appointment);
  } catch (error) {
    next(error);
  }
}

export async function completeAppointmentController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) throw AppError.unauthorized();

    const params = idParamSchema.parse(req.params);
    const body = req.body as { diagnosis?: string; serviceIds?: string[] };
    const appointment = await completeAppointment(user, params.id, body);
    sendSuccess(res, appointment);
  } catch (error) {
    next(error);
  }
}

export async function rejectAppointmentController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) throw AppError.unauthorized();

    const params = idParamSchema.parse(req.params);
    const { reason } = req.body as { reason: string };
    if (!reason?.trim()) throw AppError.badRequest('Rejection reason is required');
    const appointment = await rejectAppointment(user, params.id, reason.trim());
    sendSuccess(res, appointment);
  } catch (error) {
    next(error);
  }
}

export async function payAppointmentController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) throw AppError.unauthorized();

    const params = idParamSchema.parse(req.params);
    const { method } = req.body as { method?: string };
    const appointment = await payAppointment(user, params.id, method ?? 'VNPAY');
    sendSuccess(res, appointment);
  } catch (error) {
    next(error);
  }
}
