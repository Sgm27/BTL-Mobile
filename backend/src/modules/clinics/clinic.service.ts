import { prisma } from '@config/database';
import { AppError } from '@utils/app-error';
import { getSkipTake, paginationSchema, type PaginationQuery } from '@utils/pagination';
import { mapClinicDoctorToDto, mapClinicToListItemDto, type ClinicDetailDto, type ClinicListItemDto } from './clinic.dto';

export interface ListClinicsInput extends PaginationQuery {
  q?: string;
}

export interface ListClinicsResult {
  items: ClinicListItemDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function listClinics(input: ListClinicsInput): Promise<ListClinicsResult> {
  const parsed = paginationSchema.parse(input);
  const q = input.q?.trim();

  const where = {
    deletedAt: null,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { address: { contains: q, mode: 'insensitive' as const } },
            { phone: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [total, clinics] = await Promise.all([
    prisma.clinic.count({ where }),
    prisma.clinic.findMany({
      where,
      orderBy: { name: 'asc' },
      ...getSkipTake(parsed.page, parsed.limit),
    }),
  ]);

  return {
    items: clinics.map(mapClinicToListItemDto),
    meta: {
      page: parsed.page,
      limit: parsed.limit,
      total,
      totalPages: Math.ceil(total / parsed.limit),
    },
  };
}

export async function getClinicById(id: string): Promise<ClinicDetailDto> {
  const clinic = await prisma.clinic.findFirst({
    where: { id, deletedAt: null },
    include: {
      doctors: {
        where: {
          deletedAt: null,
          status: 'ACTIVE',
          user: { isActive: true, deletedAt: null },
        },
        include: {
          user: { select: { name: true } },
          specialty: { select: { id: true, name: true } },
        },
        orderBy: [
          { experienceYears: 'desc' },
          { user: { name: 'asc' } },
        ],
      },
    },
  });

  if (!clinic) {
    throw AppError.notFound('Clinic not found');
  }

  return {
    ...mapClinicToListItemDto(clinic),
    doctors: clinic.doctors.map(mapClinicDoctorToDto),
  };
}
