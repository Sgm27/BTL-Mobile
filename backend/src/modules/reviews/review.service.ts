/**
 * review.service.ts
 * Module "Đánh giá bác sĩ" (Reviews) — tác giả Ngô Đức Sơn.
 * Chứa business logic tạo và truy vấn đánh giá (review) của bệnh nhân dành cho
 * bác sĩ sau khi khám: kiểm tra quyền sở hữu cuộc hẹn, trạng thái cuộc hẹn và
 * ràng buộc mỗi cuộc hẹn chỉ được đánh giá một lần.
 */
import { AppointmentStatus, Prisma, Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { CreateReviewInput, ReviewDto, ReviewUserContext } from './review.types';

const reviewInclude = {
  patient: {
    select: {
      id: true,
      email: true,
      name: true,
    },
  },
  doctor: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.ReviewInclude;

type ReviewRecord = Prisma.ReviewGetPayload<{
  include: typeof reviewInclude;
}>;

/** Ánh xạ bản ghi Review (kèm thông tin bệnh nhân và bác sĩ) sang DTO trả về client. */
function mapReview(record: ReviewRecord): ReviewDto {
  return {
    id: record.id,
    appointmentId: record.appointmentId,
    patientId: record.patientId,
    doctorId: record.doctorId,
    rating: record.rating,
    comment: record.comment,
    createdAt: record.createdAt.toISOString(),
    patient: {
      id: record.patient.id,
      email: record.patient.email,
      name: record.patient.name,
    },
    doctor: {
      id: record.doctor.id,
      userId: record.doctor.userId,
      name: record.doctor.user.name,
    },
  };
}

/**
 * Tạo một đánh giá bác sĩ cho cuộc hẹn (yêu cầu role PATIENT).
 * Quy tắc nghiệp vụ kiểm tra theo thứ tự:
 *  1. Chỉ bệnh nhân (PATIENT) mới được tạo đánh giá.
 *  2. Cuộc hẹn phải tồn tại.
 *  3. Bệnh nhân phải là chủ sở hữu cuộc hẹn đó.
 *  4. Cuộc hẹn phải ở trạng thái COMPLETED (đã khám xong).
 *  5. Mỗi cuộc hẹn chỉ được đánh giá một lần (ràng buộc 1 review/cuộc hẹn).
 * @param context - thông tin user đang đăng nhập
 * @param input - dữ liệu đánh giá (appointmentId, rating, comment)
 * @returns đánh giá vừa tạo
 */
export async function createReview(
  context: ReviewUserContext,
  input: CreateReviewInput
): Promise<ReviewDto> {
  if (context.role !== Role.PATIENT) {
    throw AppError.forbidden('Only patients can create reviews');
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: input.appointmentId },
    include: {
      review: true,
    },
  });

  if (!appointment) {
    throw AppError.notFound('Appointment not found');
  }

  // Kiểm tra quyền sở hữu: chỉ được đánh giá cuộc hẹn của chính mình
  if (appointment.patientId !== context.userId) {
    throw AppError.forbidden('You can only review your own appointment');
  }

  // Chỉ cho phép đánh giá khi cuộc hẹn đã hoàn tất (COMPLETED)
  if (appointment.status !== AppointmentStatus.COMPLETED) {
    throw AppError.conflict('Only completed appointments can be reviewed');
  }

  // Ràng buộc 1 review/cuộc hẹn: nếu đã có đánh giá thì không tạo thêm
  if (appointment.review) {
    throw AppError.conflict('This appointment already has a review');
  }

  const review = await prisma.review.create({
    data: {
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      rating: input.rating,
      comment: input.comment,
    },
    include: reviewInclude,
  });

  return mapReview(review);
}

/**
 * Lấy chi tiết một đánh giá theo id.
 * @param reviewId - id của đánh giá cần lấy
 * @returns đánh giá tương ứng; ném lỗi notFound nếu không tồn tại
 */
export async function getReviewById(reviewId: string): Promise<ReviewDto> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: reviewInclude,
  });

  if (!review) {
    throw AppError.notFound('Review not found');
  }

  return mapReview(review);
}
