/**
 * schedule.types.ts
 * Module "Quản lý lịch làm việc" (Schedules) — tác giả Ngô Đức Sơn.
 * Khai báo các kiểu dữ liệu (DTO, input, context) dùng chung trong module lịch.
 */
import { Role, Shift } from '@prisma/client';

/** Dữ liệu đầu vào khi bác sĩ đăng ký ca làm (theo workScheduleIds hoặc date+shift). */
export interface RegisterDoctorScheduleInput {
  workScheduleIds?: string[];
  date?: string;
  shift?: Shift;
  startTime?: string;
  endTime?: string;
  room?: string;
}

/** Ngữ cảnh người dùng đang đăng nhập (lấy từ JWT) truyền vào service lịch. */
export interface ScheduleUserContext {
  userId: string;
  role: Role;
}

/** DTO mô tả một ca làm việc của bác sĩ kèm thông tin WorkSchedule, trả về cho client. */
export interface DoctorScheduleDto {
  id: string;
  room: string | null;
  workSchedule: {
    id: string;
    date: string;
    shift: Shift;
    startTime: string;
    endTime: string;
    createdAt: string;
  };
}
