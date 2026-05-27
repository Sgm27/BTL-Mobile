import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import type { UpdateCurrentUserInput } from './users.dto';

const currentUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  phone: true,
  dateOfBirth: true,
  address: true,
  avatarUrl: true,
  insuranceId: true,
} as const;

export class UsersService {
  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
        isActive: true,
      },
      select: {
        ...currentUserSelect,
        doctor: {
          select: { status: true },
        },
      },
    });

    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }

    const { doctor, ...rest } = user;
    return {
      ...rest,
      ...(doctor ? { doctorStatus: doctor.status } : {}),
    };
  }

  static async updateCurrentUser(userId: string, input: UpdateCurrentUserInput) {
    await this.getCurrentUser(userId);

    return prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        phone: input.phone === undefined ? undefined : input.phone,
        address: input.address === undefined ? undefined : input.address,
        insuranceId: input.insuranceId === undefined ? undefined : input.insuranceId,
        dateOfBirth: input.dateOfBirth === undefined ? undefined : input.dateOfBirth,
      },
      select: currentUserSelect,
    });
  }
}
