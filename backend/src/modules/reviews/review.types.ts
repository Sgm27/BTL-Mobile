/**
 * review.types.ts
 * Module "Đánh giá bác sĩ" (Reviews) — tác giả Ngô Đức Sơn.
 * Khai báo các kiểu dữ liệu (input, context, DTO) dùng chung trong module đánh giá.
 */
import { Role } from '@prisma/client';

/** Dữ liệu đầu vào khi bệnh nhân tạo đánh giá cho một cuộc hẹn. */
export interface CreateReviewInput {
  appointmentId: string;
  rating: number;
  comment?: string;
}

/** Ngữ cảnh người dùng đang đăng nhập (lấy từ JWT) truyền vào service đánh giá. */
export interface ReviewUserContext {
  userId: string;
  role: Role;
}

/** DTO mô tả một đánh giá kèm thông tin bệnh nhân và bác sĩ, trả về cho client. */
export interface ReviewDto {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  patient: {
    id: string;
    email: string;
    name: string;
  };
  doctor: {
    id: string;
    userId: string;
    name: string;
  };
}
