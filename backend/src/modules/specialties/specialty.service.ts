import { prisma } from '@config/database';
import { getSkipTake, paginationSchema, type PaginationQuery } from '@utils/pagination';
import { mapSpecialtyToDto, type SpecialtyListItemDto } from './specialty.dto';

export interface ListSpecialtiesInput extends PaginationQuery {
  q?: string;
}

export interface ListSpecialtiesResult {
  items: SpecialtyListItemDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function listSpecialties(input: ListSpecialtiesInput): Promise<ListSpecialtiesResult> {
  const parsed = paginationSchema.parse(input);
  const q = input.q?.trim();

  const where = {
    deletedAt: null,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { description: { contains: q, mode: 'insensitive' as const } },
            { symptoms: { hasSome: [q] } },
          ],
        }
      : {}),
  };

  const [total, specialties] = await Promise.all([
    prisma.specialty.count({ where }),
    prisma.specialty.findMany({
      where,
      orderBy: { name: 'asc' },
      ...getSkipTake(parsed.page, parsed.limit),
    }),
  ]);

  return {
    items: specialties.map(mapSpecialtyToDto),
    meta: {
      page: parsed.page,
      limit: parsed.limit,
      total,
      totalPages: Math.ceil(total / parsed.limit),
    },
  };
}
