import { prisma } from '@config/database';
import { AppError } from '@utils/app-error';
import { getPaginationMeta, getSkipTake, paginationSchema, type PaginationQuery } from '@utils/pagination';
import { mapDoctorToDetailDto, mapDoctorToListItemDto, mapTimeSlotToDto, type DoctorDetailDto, type DoctorListItemDto, type DoctorSlotDto } from './doctor.dto';

export interface ListDoctorsInput extends PaginationQuery {
  q?: string;
  specialtyId?: string;
  clinicId?: string;
  status?: 'PENDING' | 'ACTIVE' | 'REJECTED';
}

export interface ListDoctorsResult {
  items: DoctorListItemDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function listDoctors(input: ListDoctorsInput): Promise<ListDoctorsResult> {
  const parsed = paginationSchema.parse(input);
  const q = input.q?.trim();

  const where = {
    deletedAt: null,
    ...(input.specialtyId ? { specialtyId: input.specialtyId } : {}),
    ...(input.clinicId ? { clinicId: input.clinicId } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(q
      ? {
          OR: [
            { user: { name: { contains: q, mode: 'insensitive' as const } } },
            { specialty: { name: { contains: q, mode: 'insensitive' as const } } },
            { clinic: { name: { contains: q, mode: 'insensitive' as const } } },
            { bio: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [total, doctors] = await Promise.all([
    prisma.doctor.count({ where }),
    prisma.doctor.findMany({
      where,
      include: {
        user: { select: { name: true } },
        specialty: { select: { id: true, name: true } },
        clinic: { select: { id: true, name: true } },
      },
      orderBy: [
        { status: 'asc' },
        { experienceYears: 'desc' },
        { updatedAt: 'desc' },
      ],
      ...getSkipTake(parsed.page, parsed.limit),
    }),
  ]);

  const reviewStats = doctors.length
    ? await prisma.review.groupBy({
        by: ['doctorId'],
        where: {
          doctorId: {
            in: doctors.map((doctor) => doctor.id),
          },
        },
        _avg: {
          rating: true,
        },
        _count: {
          rating: true,
        },
      })
    : [];

  const reviewStatsByDoctorId = new Map(
    reviewStats.map((stat) => [
      stat.doctorId,
      {
        averageRating: Number(stat._avg.rating ?? 0),
        totalReviews: stat._count.rating,
      },
    ])
  );

  return {
    items: doctors.map((doctor) => {
      const stats = reviewStatsByDoctorId.get(doctor.id) ?? {
        averageRating: 0,
        totalReviews: 0,
      };

      return {
        ...mapDoctorToListItemDto(doctor),
        averageRating: stats.averageRating,
        totalReviews: stats.totalReviews,
      };
    }),
    meta: {
      page: parsed.page,
      limit: parsed.limit,
      total,
      totalPages: Math.ceil(total / parsed.limit),
    },
  };
}

export async function getDoctorById(id: string): Promise<DoctorDetailDto> {
  const [doctor, reviewStats] = await Promise.all([
    prisma.doctor.findFirst({
      where: { id, deletedAt: null, status: 'ACTIVE' },
      include: {
        user: { select: { name: true } },
        specialty: { select: { id: true, name: true } },
        clinic: { select: { id: true, name: true } },
        doctorServices: {
          include: {
            service: { select: { name: true, category: true } },
          },
          orderBy: { price: 'asc' },
        },
      },
    }),
    prisma.review.aggregate({
      where: { doctorId: id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  if (!doctor) {
    throw AppError.notFound('Doctor not found');
  }

  return mapDoctorToDetailDto(
    doctor as unknown as Parameters<typeof mapDoctorToDetailDto>[0],
    {
      averageRating: Number(reviewStats._avg.rating ?? 0),
      totalReviews: reviewStats._count.rating,
    }
  );
}

export interface ListDoctorSlotsInput {
  id: string;
  date?: string;
}

export async function listDoctorSlots(input: ListDoctorSlotsInput): Promise<DoctorSlotDto[]> {
  const doctor = await prisma.doctor.findFirst({
    where: { id: input.id, deletedAt: null, status: 'ACTIVE' },
    select: { id: true },
  });

  if (!doctor) {
    throw AppError.notFound('Doctor not found');
  }

  // For @db.Date columns, use UTC midnight directly — never use local setHours()
  let dateFilter: Date | undefined;
  if (input.date) {
    const parsed = new Date(input.date + 'T00:00:00.000Z');
    if (Number.isNaN(parsed.getTime())) {
      throw AppError.badRequest('Invalid date');
    }
    dateFilter = parsed;
  }

  const slots = await prisma.timeSlot.findMany({
    where: {
      doctorId: input.id,
      isBooked: false,
      ...(dateFilter ? { date: dateFilter } : {}),
    },
    orderBy: [
      { date: 'asc' },
      { startTime: 'asc' },
    ],
  });

  return slots.map(mapTimeSlotToDto);
}

export interface DoctorReviewDto {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  patient: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface DoctorRatingStats {
  averageRating: number;
  totalReviews: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ListDoctorReviewsResult {
  items: DoctorReviewDto[];
  stats: DoctorRatingStats;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getDoctorRatingStats(doctorId: string): Promise<DoctorRatingStats> {
  const [groups, aggregate] = await Promise.all([
    prisma.review.groupBy({
      by: ['rating'],
      where: { doctorId },
      _count: { rating: true },
    }),
    prisma.review.aggregate({
      where: { doctorId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  for (const group of groups) {
    const rating = group.rating as 1 | 2 | 3 | 4 | 5;
    if (rating >= 1 && rating <= 5) {
      distribution[rating] = group._count.rating;
    }
  }

  return {
    averageRating: Number(aggregate._avg.rating ?? 0),
    totalReviews: aggregate._count.rating,
    distribution,
  };
}

export async function getDoctorReviews(
  doctorId: string,
  query: { page: number; limit: number }
): Promise<ListDoctorReviewsResult> {
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, deletedAt: null },
    select: { id: true },
  });

  if (!doctor) {
    throw AppError.notFound('Doctor not found');
  }

  const where = { doctorId };

  const [items, total, stats] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      ...getSkipTake(query.page, query.limit),
    }),
    prisma.review.count({ where }),
    getDoctorRatingStats(doctorId),
  ]);

  return {
    items: items.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
      patient: {
        id: review.patient.id,
        name: review.patient.name,
        avatarUrl: review.patient.avatarUrl,
      },
    })),
    stats,
    meta: getPaginationMeta(query.page, query.limit, total),
  };
}
