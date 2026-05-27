/**
 * appointment.controller.ts
 * Thuộc module Đặt lịch khám (Appointments) của Ngô Đức Sơn.
 *
 * Tầng controller: nhận HTTP request, validate dữ liệu vào bằng Zod schema,
 * kiểm tra xác thực (JWT qua req.user), gọi service xử lý nghiệp vụ rồi trả
 * response theo định dạng chuẩn. Mọi lỗi được chuyển tới error middleware
 * thông qua next(error).
 */
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

/**
 * GET /api/v1/appointments/available-slots — Public (không cần đăng nhập).
 * Trả về danh sách khung giờ trống theo chuyên khoa/phòng khám/ngày để bệnh
 * nhân xem trước khi đặt.
 */
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

/**
 * POST /api/v1/appointments — Yêu cầu role PATIENT hoặc ADMIN.
 * Tạo lịch hẹn mới; hệ thống tự phân bổ bác sĩ. Trả HTTP 201 khi thành công.
 */
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

/**
 * GET /api/v1/appointments (và /me) — Yêu cầu đăng nhập.
 * Lấy danh sách lịch hẹn của người dùng hiện tại (lọc theo role + status),
 * có phân trang; trả kèm meta phân trang.
 */
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

/**
 * GET /api/v1/appointments/:id — Yêu cầu đăng nhập.
 * Lấy chi tiết một lịch hẹn; service kiểm tra quyền truy cập theo role.
 */
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

/**
 * PUT /api/v1/appointments/:id/cancel — Yêu cầu role PATIENT hoặc ADMIN.
 * Huỷ lịch hẹn và giải phóng khung giờ.
 */
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

/**
 * PUT /api/v1/appointments/:id/confirm — Yêu cầu role DOCTOR.
 * Bác sĩ xác nhận nhận lịch (PENDING → CONFIRMED).
 */
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

/**
 * PUT /api/v1/appointments/:id/reschedule — Yêu cầu role PATIENT hoặc ADMIN.
 * Đổi lịch sang ngày/giờ mới (chỉ khi lịch còn PENDING).
 */
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

/**
 * PUT /api/v1/appointments/:id/complete — Yêu cầu role DOCTOR.
 * Bác sĩ hoàn tất khám (CONFIRMED → AWAITING_PAYMENT), kèm chẩn đoán + dịch vụ.
 */
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

/**
 * PUT /api/v1/appointments/:id/reject — Yêu cầu role DOCTOR.
 * Bác sĩ từ chối lịch PENDING kèm lý do (reason bắt buộc, không được rỗng).
 */
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

/**
 * PUT /api/v1/appointments/:id/pay — Yêu cầu role PATIENT hoặc ADMIN.
 * Xác nhận thanh toán (AWAITING_PAYMENT → COMPLETED); mặc định method VNPAY.
 */
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
