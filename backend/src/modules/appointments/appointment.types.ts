/**
 * appointment.types.ts
 * Thuộc module Đặt lịch khám (Appointments) của Ngô Đức Sơn.
 *
 * Khai báo các kiểu dữ liệu (interface) dùng trong module: input cho service,
 * DTO trả về cho client (lịch hẹn, khung giờ, bác sĩ, bệnh nhân, dịch vụ, đánh
 * giá) và ngữ cảnh người dùng (userId + role) phục vụ kiểm tra quyền.
 */
import { AppointmentStatus, Role } from '@prisma/client';

/** Dữ liệu đầu vào khi đổi lịch hẹn: ngày + giờ mới mong muốn. */
export interface RescheduleAppointmentInput {
  date: string;
  startTime: string;
}

/** Dữ liệu đầu vào khi bệnh nhân tạo lịch hẹn mới (chuyên khoa, ngày/giờ, dịch vụ). */
export interface CreateAppointmentInput {
  specialtyId: string;
  clinicId?: string;
  date: string;
  startTime: string;
  serviceIds: string[];
  notes?: string;
}

/** DTO mô tả một khung giờ còn trống (đã gom nhóm): số bác sĩ rảnh, phí trung bình, danh sách phòng khám. */
export interface AvailableSlotDto {
  date: string;
  startTime: string;
  endTime: string;
  availableCount: number;
  avgFee: number;
  clinics: {
    id: string;
    name: string;
    address: string;
  }[];
}

/** Tham số truy vấn danh sách lịch hẹn: phân trang + lọc theo trạng thái (tuỳ chọn). */
export interface AppointmentListQuery {
  page: number;
  limit: number;
  status?: AppointmentStatus;
}

/** Ngữ cảnh người dùng lấy từ JWT (userId + role), dùng để phân quyền truy cập lịch hẹn. */
export interface AppointmentUserContext {
  userId: string;
  role: Role;
}

/** DTO mô tả một dịch vụ gắn với lịch hẹn kèm giá tại thời điểm thêm. */
export interface AppointmentServiceDto {
  id: string;
  serviceId: string;
  service: {
    id: string;
    name: string;
    price: number;
    category: string | null;
  };
  price: number;
}

/** DTO mô tả bác sĩ được gán cho lịch hẹn (chuyên khoa, phòng khám, phí khám). */
export interface AppointmentDoctorDto {
  id: string;
  userId: string;
  name: string;
  specialty: {
    id: string;
    name: string;
  };
  clinic: {
    id: string;
    name: string;
    address: string;
  } | null;
  experienceYears: number;
  consultationFee: number;
  status: string;
}

/** DTO mô tả bệnh nhân của lịch hẹn (thông tin liên hệ cơ bản). */
export interface AppointmentPatientDto {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
}

/** DTO mô tả khung giờ khám gắn với lịch hẹn (ngày/giờ và cờ đã đặt). */
export interface AppointmentTimeSlotDto {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

/** DTO mô tả đánh giá gắn với lịch hẹn (điểm sao + bình luận), nếu có. */
export interface AppointmentReviewDto {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

/** DTO tổng hợp một lịch hẹn trả về cho client (kèm bệnh nhân, bác sĩ, khung giờ, dịch vụ, đánh giá). */
export interface AppointmentDto {
  id: string;
  patientId: string;
  doctorId: string;
  timeSlotId: string;
  status: AppointmentStatus;
  notes: string | null;
  diagnosis: string | null;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  canceledAt: string | null;
  patient: AppointmentPatientDto | null;
  doctor: AppointmentDoctorDto;
  timeSlot: AppointmentTimeSlotDto;
  services: AppointmentServiceDto[];
  review: AppointmentReviewDto | null;
}
