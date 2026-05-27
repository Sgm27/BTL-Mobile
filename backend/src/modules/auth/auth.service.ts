import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { createAuthTokens, verifyRefreshToken } from '../../utils/jwt';
import type { LoginInput, RefreshTokenInput, RegisterInput } from './auth.dto';

const publicUserSelect = {
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

function toAuthPayload(userId: string, role: Role) {
  return { userId, role };
}

export class AuthService {
  static async register(input: RegisterInput) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: input.email,
        deletedAt: null,
      },
    });

    if (existingUser) {
      throw AppError.conflict('Email is already in use', 'EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const isDoctor = input.role === 'DOCTOR';

    // For doctors, find a default specialty ("Đa khoa" or first available)
    let defaultSpecialtyId: string | undefined;
    if (isDoctor) {
      const specialty = await prisma.specialty.findFirst({
        where: { deletedAt: null, name: 'Đa khoa' },
        select: { id: true },
      }) ?? await prisma.specialty.findFirst({
        where: { deletedAt: null },
        select: { id: true },
      });
      if (!specialty) {
        throw AppError.badRequest('Chưa có chuyên khoa nào trong hệ thống', 'NO_SPECIALTY');
      }
      defaultSpecialtyId = specialty.id;
    }

    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: passwordHash,
        name: input.name,
        role: isDoctor ? Role.DOCTOR : Role.PATIENT,
        phone: input.phone,
      },
      select: publicUserSelect,
    });

    // Create Doctor record so the doctor portal works
    if (isDoctor && defaultSpecialtyId) {
      await prisma.doctor.create({
        data: {
          userId: user.id,
          specialtyId: defaultSpecialtyId,
          status: 'PENDING',
        },
      });
    }

    const tokens = createAuthTokens(toAuthPayload(user.id, user.role));

    return {
      user: {
        ...user,
        ...(isDoctor ? { doctorStatus: 'PENDING' as const } : {}),
      },
      ...tokens,
    };
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findFirst({
      where: {
        email: input.email,
        deletedAt: null,
        isActive: true,
      },
    });

    if (!user) {
      throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const tokens = createAuthTokens(toAuthPayload(user.id, user.role));

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        avatarUrl: user.avatarUrl,
        insuranceId: user.insuranceId,
      },
      ...tokens,
    };
  }

  static async refresh(input: RefreshTokenInput) {
    const payload = verifyRefreshToken(input.refreshToken);
    const user = await prisma.user.findFirst({
      where: {
        id: payload.userId,
        deletedAt: null,
        isActive: true,
      },
      select: publicUserSelect,
    });

    if (!user) {
      throw AppError.unauthorized('User no longer exists', 'INVALID_REFRESH_TOKEN');
    }

    const tokens = createAuthTokens(toAuthPayload(user.id, user.role));

    return {
      user,
      ...tokens,
    };
  }
}
