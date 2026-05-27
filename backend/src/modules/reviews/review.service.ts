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

  if (appointment.patientId !== context.userId) {
    throw AppError.forbidden('You can only review your own appointment');
  }

  if (appointment.status !== AppointmentStatus.COMPLETED) {
    throw AppError.conflict('Only completed appointments can be reviewed');
  }

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
