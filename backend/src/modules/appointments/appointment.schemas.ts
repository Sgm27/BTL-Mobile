/**
 * appointment.schemas.ts
 * Thuộc module Đặt lịch khám (Appointments) của Ngô Đức Sơn.
 *
 * Định nghĩa các Zod schema để validate dữ liệu đầu vào của request (params,
 * query, body) trước khi controller gọi service: kiểm tra UUID, định dạng
 * ngày/giờ, giới hạn độ dài và các tham số phân trang/lọc.
 */
import { AppointmentStatus } from '@prisma/client';
import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

// Validate path param :id phải là UUID hợp lệ.
export const idParamSchema = z.object({
  id: z.string().uuid(),
});

// Body khi tạo lịch: date dạng YYYY-MM-DD, startTime dạng HH:MM (24h).
export const createAppointmentSchema = z.object({
  specialtyId: z.string().uuid(),
  clinicId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  serviceIds: z.array(z.string().uuid()).default([]),
  notes: z.string().trim().max(1000).optional(),
});

// Query khi tra cứu khung giờ trống: bắt buộc chuyên khoa + ngày.
export const availableSlotsQuerySchema = z.object({
  specialtyId: z.string().uuid(),
  clinicId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Query danh sách lịch: kế thừa phân trang + lọc theo status (enum, tuỳ chọn).
export const appointmentListQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(AppointmentStatus).optional(),
});

// Body khi đổi lịch: ngày + giờ mới mong muốn.
export const rescheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
});

