/**
 * schedule.schemas.ts
 * Module "Quản lý lịch làm việc" (Schedules) — tác giả Ngô Đức Sơn.
 * Các Zod schema dùng để validate dữ liệu request (body, query) cho module lịch.
 */
import { z } from 'zod';

/** Validate body đăng ký ca làm: hoặc theo workScheduleIds, hoặc theo date+shift. */
export const registerDoctorScheduleSchema = z.object({
  workScheduleIds: z.array(z.string().uuid()).min(1).optional(),
  // Cách khác: đăng ký theo date+shift (tự động tạo WorkSchedule)
  date: z.string().optional(),
  shift: z.enum(['MORNING', 'AFTERNOON']).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  room: z.string().trim().max(100).optional(),
});

/** Một khung giờ khám: giờ bắt đầu và kết thúc theo định dạng HH:MM. */
const timeSlotSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
});

/** Validate query xem khung giờ khám: tham số date dạng YYYY-MM-DD. */
export const getTimeSlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
});

/** Validate body cập nhật hàng loạt khung giờ khám: ngày + mảng các slot. */
export const bulkUpsertTimeSlotsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  slots: z.array(timeSlotSchema),
});
