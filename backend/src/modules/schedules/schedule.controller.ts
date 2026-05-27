/**
 * schedule.controller.ts
 * Module "Quản lý lịch làm việc" (Schedules) — tác giả Ngô Đức Sơn.
 * Lớp controller: parse/validate request bằng Zod schema, gọi service xử lý
 * và trả response chuẩn. Mọi endpoint trong module đều yêu cầu role DOCTOR.
 */
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/app-error';
import { sendSuccess } from '../../utils/api-response';
import {
  registerDoctorScheduleSchema,
  getTimeSlotsQuerySchema,
  bulkUpsertTimeSlotsSchema,
} from './schedule.schemas';
import {
  getMyDoctorSchedules,
  registerDoctorSchedules,
  getDoctorTimeSlots,
  bulkUpsertDoctorTimeSlots,
} from './schedule.service';

/**
 * POST /api/v1/schedules/doctor/register — role DOCTOR.
 * Đăng ký ca làm việc cho bác sĩ đang đăng nhập; trả về danh sách ca vừa tạo (201).
 */
export async function registerDoctorSchedulesController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      throw AppError.unauthorized();
    }

    const payload = registerDoctorScheduleSchema.parse(req.body);
    const schedules = await registerDoctorSchedules(user, payload);
    sendSuccess(res, schedules, 201);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/schedules/doctor/me — role DOCTOR.
 * Lấy danh sách ca làm việc đã đăng ký của bác sĩ đang đăng nhập.
 */
export async function getMyDoctorSchedulesController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      throw AppError.unauthorized();
    }

    const schedules = await getMyDoctorSchedules(user);
    sendSuccess(res, schedules);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/schedules/doctor/time-slots?date=YYYY-MM-DD — role DOCTOR.
 * Lấy danh sách khung giờ khám của bác sĩ trong ngày được chỉ định.
 */
export async function getDoctorTimeSlotsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      throw AppError.unauthorized();
    }

    const { date } = getTimeSlotsQuerySchema.parse(req.query);
    const slots = await getDoctorTimeSlots(user, date);
    sendSuccess(res, slots);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/schedules/doctor/time-slots — role DOCTOR.
 * Cập nhật hàng loạt khung giờ khám trong ngày (giữ slot đã đặt);
 * trả về số slot đã tạo và đã xoá.
 */
export async function bulkUpsertDoctorTimeSlotsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      throw AppError.unauthorized();
    }

    const { date, slots } = bulkUpsertTimeSlotsSchema.parse(req.body);
    const result = await bulkUpsertDoctorTimeSlots(user, date, slots);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
