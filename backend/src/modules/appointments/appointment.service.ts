import { AppointmentStatus, DoctorStatus, Prisma, Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { getPaginationMeta, getSkipTake } from '../../utils/pagination';
import {
  AppointmentDto,
  AppointmentListQuery,
  AvailableSlotDto,
  CreateAppointmentInput,
  AppointmentUserContext,
  RescheduleAppointmentInput,
} from './appointment.types';

const appointmentInclude = {
  patient: {
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      avatarUrl: true,
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
      specialty: {
        select: {
          id: true,
          name: true,
        },
      },
      clinic: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
    },
  },
  timeSlot: true,
  services: {
    include: {
      service: true,
    },
  },
  review: true,
} satisfies Prisma.AppointmentInclude;

type AppointmentRecord = Prisma.AppointmentGetPayload<{
  include: typeof appointmentInclude;
}>;

function decimalToNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

function toIso(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null;
}

function toDateOnly(date: Date | null | undefined): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

function mapAppointment(record: AppointmentRecord): AppointmentDto {
  return {
    id: record.id,
    patientId: record.patientId,
    doctorId: record.doctorId,
    timeSlotId: record.timeSlotId,
    status: record.status,
    notes: record.notes,
    diagnosis: record.diagnosis,
    totalAmount: decimalToNumber(record.totalAmount),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    canceledAt: toIso(record.canceledAt),
    patient: record.patient
      ? {
          id: record.patient.id,
          email: record.patient.email,
          name: record.patient.name,
          phone: record.patient.phone,
          avatarUrl: record.patient.avatarUrl,
        }
      : null,
    doctor: {
      id: record.doctor.id,
      userId: record.doctor.userId,
      name: record.doctor.user.name,
      specialty: {
        id: record.doctor.specialty.id,
        name: record.doctor.specialty.name,
      },
      clinic: record.doctor.clinic
        ? {
            id: record.doctor.clinic.id,
            name: record.doctor.clinic.name,
            address: record.doctor.clinic.address,
          }
        : null,
      experienceYears: record.doctor.experienceYears,
      consultationFee: decimalToNumber(record.doctor.consultationFee),
      status: record.doctor.status,
    },
    timeSlot: {
      id: record.timeSlot.id,
      doctorId: record.timeSlot.doctorId,
      date: toDateOnly(record.timeSlot.date) ?? '',
      startTime: record.timeSlot.startTime,
      endTime: record.timeSlot.endTime,
      isBooked: record.timeSlot.isBooked,
    },
    services: record.services.map((item) => ({
      id: item.id,
      serviceId: item.serviceId,
      service: {
        id: item.service.id,
        name: item.service.name,
        price: decimalToNumber(item.service.price),
        category: item.service.category,
      },
      price: decimalToNumber(item.price),
    })),
    review: record.review
      ? {
          id: record.review.id,
          rating: record.review.rating,
          comment: record.review.comment,
          createdAt: record.review.createdAt.toISOString(),
        }
      : null,
  };
}

async function getDoctorIdForUser(userId: string): Promise<string> {
  const doctor = await prisma.doctor.findUnique({
    where: { userId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!doctor) {
    throw AppError.notFound('Doctor profile not found');
  }

  if (doctor.status !== DoctorStatus.ACTIVE) {
    throw AppError.forbidden('Doctor profile is not active');
  }

  return doctor.id;
}

async function assertAppointmentAccess(
  appointment: AppointmentRecord,
  context: AppointmentUserContext
): Promise<void> {
  if (context.role === Role.ADMIN) {
    return;
  }

  if (context.role === Role.PATIENT && appointment.patientId === context.userId) {
    return;
  }

  if (context.role === Role.DOCTOR) {
    const doctorId = await getDoctorIdForUser(context.userId);
    if (appointment.doctorId === doctorId) {
      return;
    }
  }

  throw AppError.forbidden('You do not have access to this appointment');
}

/**
 * Get available time slots for a specialty (optionally filtered by clinic) on a date.
 * Groups by startTime/endTime and counts how many doctors are free.
 */
export async function getAvailableSlots(input: {
  specialtyId: string;
  clinicId?: string;
  date: string;
}): Promise<AvailableSlotDto[]> {
  const dateFilter = new Date(input.date + 'T00:00:00.000Z');
  if (Number.isNaN(dateFilter.getTime())) {
    throw AppError.badRequest('Invalid date');
  }

  const slots = await prisma.timeSlot.findMany({
    where: {
      isBooked: false,
      date: dateFilter,
      doctor: {
        status: DoctorStatus.ACTIVE,
        deletedAt: null,
        specialtyId: input.specialtyId,
        ...(input.clinicId ? { clinicId: input.clinicId } : {}),
      },
    },
    include: {
      doctor: {
        include: {
          clinic: { select: { id: true, name: true, address: true } },
        },
      },
    },
    orderBy: [{ startTime: 'asc' }],
  });

  // Group by startTime-endTime
  const grouped = new Map<string, {
    startTime: string;
    endTime: string;
    count: number;
    totalFee: number;
    clinics: Map<string, { id: string; name: string; address: string }>;
  }>();

  for (const slot of slots) {
    const key = `${slot.startTime}-${slot.endTime}`;
    const group = grouped.get(key) ?? {
      startTime: slot.startTime,
      endTime: slot.endTime,
      count: 0,
      totalFee: 0,
      clinics: new Map(),
    };
    group.count++;
    group.totalFee += Number(slot.doctor.consultationFee ?? 0);
    if (slot.doctor.clinic) {
      group.clinics.set(slot.doctor.clinic.id, slot.doctor.clinic);
    }
    grouped.set(key, group);
  }

  return Array.from(grouped.values()).map((g) => ({
    date: input.date,
    startTime: g.startTime,
    endTime: g.endTime,
    availableCount: g.count,
    avgFee: g.count > 0 ? Math.round(g.totalFee / g.count) : 0,
    clinics: Array.from(g.clinics.values()),
  }));
}

/**
 * Create appointment by specialty + date + time.
 * System auto-assigns an available doctor.
 */
export async function createAppointment(
  userId: string,
  input: CreateAppointmentInput
): Promise<AppointmentDto> {
  const dateFilter = new Date(input.date + 'T00:00:00.000Z');
  if (Number.isNaN(dateFilter.getTime())) {
    throw AppError.badRequest('Invalid date');
  }

  // Find an available slot matching specialty + clinic + date + time
  const candidateSlot = await prisma.timeSlot.findFirst({
    where: {
      isBooked: false,
      date: dateFilter,
      startTime: input.startTime,
      doctor: {
        status: DoctorStatus.ACTIVE,
        deletedAt: null,
        specialtyId: input.specialtyId,
        ...(input.clinicId ? { clinicId: input.clinicId } : {}),
      },
    },
    include: {
      doctor: { include: { specialty: true, clinic: true, user: true } },
    },
    orderBy: {
      // Prefer doctor with fewer bookings today (load balance)
      doctor: { appointments: { _count: 'asc' } },
    },
  });

  if (!candidateSlot) {
    throw AppError.conflict('No available doctor for the selected time');
  }

  const doctor = candidateSlot.doctor;

  const uniqueServiceIds = [...new Set(input.serviceIds)];
  const services =
    uniqueServiceIds.length > 0
      ? await prisma.service.findMany({
          where: { id: { in: uniqueServiceIds }, deletedAt: null },
        })
      : [];

  if (services.length !== uniqueServiceIds.length) {
    throw AppError.notFound('One or more services were not found');
  }

  const serviceTotal = services.reduce((sum, s) => sum + decimalToNumber(s.price), 0);
  const totalAmount = serviceTotal; // Fee comes from services added by doctor after exam

  const appointment = await prisma.$transaction(async (tx) => {
    const lockedSlot = await tx.timeSlot.updateMany({
      where: { id: candidateSlot.id, isBooked: false },
      data: { isBooked: true },
    });

    if (lockedSlot.count === 0) {
      throw AppError.conflict('Slot was just taken, please try again');
    }

    return tx.appointment.create({
      data: {
        patientId: userId,
        doctorId: doctor.id,
        timeSlotId: candidateSlot.id,
        notes: input.notes,
        totalAmount,
        services:
          services.length > 0
            ? {
                create: services.map((service) => ({
                  service: { connect: { id: service.id } },
                  price: service.price,
                })),
              }
            : undefined,
      },
      include: appointmentInclude,
    });
  });

  return mapAppointment(appointment);
}

export async function getAppointmentById(
  context: AppointmentUserContext,
  appointmentId: string
): Promise<AppointmentDto> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: appointmentInclude,
  });

  if (!appointment) {
    throw AppError.notFound('Appointment not found');
  }

  await assertAppointmentAccess(appointment, context);
  return mapAppointment(appointment);
}

export async function getMyAppointments(
  context: AppointmentUserContext,
  query: AppointmentListQuery
): Promise<{ data: AppointmentDto[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  let where: Prisma.AppointmentWhereInput = {};

  if (context.role === Role.PATIENT) {
    where.patientId = context.userId;
    if (query.status) {
      where.status = query.status;
    }
  } else if (context.role === Role.DOCTOR) {
    const myDoctorId = await getDoctorIdForUser(context.userId);
    const myDoctor = await prisma.doctor.findUnique({
      where: { id: myDoctorId },
      select: { specialtyId: true },
    });

    if (query.status) {
      where.status = query.status;
      where.doctorId = myDoctorId;
    } else {
      // Show: all PENDING in my specialty + my own non-PENDING
      where.OR = [
        {
          status: AppointmentStatus.PENDING,
          doctor: { specialtyId: myDoctor!.specialtyId },
        },
        {
          doctorId: myDoctorId,
          status: { not: AppointmentStatus.PENDING },
        },
      ];
    }
  } else {
    // ADMIN sees all
    if (query.status) {
      where.status = query.status;
    }
  }

  const [items, total] = await prisma.$transaction([
    prisma.appointment.findMany({
      where,
      include: appointmentInclude,
      orderBy: {
        createdAt: 'desc',
      },
      ...getSkipTake(query.page, query.limit),
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    data: items.map(mapAppointment),
    meta: getPaginationMeta(query.page, query.limit, total),
  };
}

export async function cancelAppointment(
  context: AppointmentUserContext,
  appointmentId: string
): Promise<AppointmentDto> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: appointmentInclude,
  });

  if (!appointment) {
    throw AppError.notFound('Appointment not found');
  }

  if (context.role !== Role.ADMIN && appointment.patientId !== context.userId) {
    throw AppError.forbidden('You can only cancel your own appointment');
  }

  if (appointment.status === AppointmentStatus.CANCELED) {
    throw AppError.conflict('Appointment is already canceled');
  }

  if (appointment.status === AppointmentStatus.COMPLETED) {
    throw AppError.conflict('Completed appointments cannot be canceled');
  }

  const canceled = await prisma.$transaction(async (tx) => {
    await tx.timeSlot.updateMany({
      where: {
        id: appointment.timeSlotId,
        isBooked: true,
      },
      data: {
        isBooked: false,
      },
    });

    return tx.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELED,
        canceledAt: new Date(),
      },
      include: appointmentInclude,
    });
  });

  return mapAppointment(canceled);
}

/**
 * Any doctor in the same specialty can confirm a PENDING appointment.
 * First to confirm wins (optimistic lock on status).
 * Reassigns the appointment to the confirming doctor.
 */
export async function confirmAppointment(
  context: AppointmentUserContext,
  appointmentId: string
): Promise<AppointmentDto> {
  if (context.role !== Role.DOCTOR) {
    throw AppError.forbidden('Only doctors can confirm appointments');
  }

  const doctorId = await getDoctorIdForUser(context.userId);

  // Get confirming doctor's specialty
  const confirmingDoctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { specialtyId: true },
  });
  if (!confirmingDoctor) throw AppError.notFound('Doctor not found');

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      ...appointmentInclude,
      doctor: { include: { specialty: true, clinic: true, user: true } },
    },
  });

  if (!appointment) throw AppError.notFound('Appointment not found');

  // Must be same specialty
  if (appointment.doctor.specialtyId !== confirmingDoctor.specialtyId) {
    throw AppError.forbidden('Appointment is not in your specialty');
  }

  if (appointment.status !== AppointmentStatus.PENDING) {
    throw AppError.conflict('Lịch hẹn này đã được bác sĩ khác nhận hoặc đã bị hủy.');
  }

  // Optimistic lock: only update if still PENDING
  const result = await prisma.appointment.updateMany({
    where: { id: appointmentId, status: AppointmentStatus.PENDING },
    data: {
      status: AppointmentStatus.CONFIRMED,
      doctorId, // reassign to confirming doctor
    },
  });

  if (result.count === 0) {
    throw AppError.conflict('Lịch hẹn này đã được bác sĩ khác nhận.');
  }

  // Fetch updated record
  const confirmed = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: appointmentInclude,
  });

  return mapAppointment(confirmed!);
}

/**
 * Reschedule an appointment to a new date/time.
 * Releases the old slot and locks a new one matching the original specialty/clinic.
 */
export async function rescheduleAppointment(
  userId: string,
  appointmentId: string,
  input: RescheduleAppointmentInput
): Promise<AppointmentDto> {
  const original = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      doctor: { select: { specialtyId: true, clinicId: true } },
      timeSlot: true,
    },
  });

  if (!original) {
    throw AppError.notFound('Appointment not found');
  }

  if (original.patientId !== userId) {
    throw AppError.forbidden('You can only reschedule your own appointment');
  }

  if (original.status !== AppointmentStatus.PENDING) {
    throw AppError.conflict('Chỉ có thể đổi lịch khi trạng thái là chờ xác nhận');
  }

  const dateFilter = new Date(input.date + 'T00:00:00.000Z');
  if (Number.isNaN(dateFilter.getTime())) {
    throw AppError.badRequest('Invalid date');
  }

  if (
    original.timeSlot.date.toISOString().slice(0, 10) === input.date &&
    original.timeSlot.startTime === input.startTime
  ) {
    throw AppError.badRequest('New time is identical to current time');
  }

  // Find an available slot matching the original specialty + clinic
  const candidateSlot = await prisma.timeSlot.findFirst({
    where: {
      isBooked: false,
      date: dateFilter,
      startTime: input.startTime,
      doctor: {
        status: DoctorStatus.ACTIVE,
        deletedAt: null,
        specialtyId: original.doctor.specialtyId,
        ...(original.doctor.clinicId ? { clinicId: original.doctor.clinicId } : {}),
      },
    },
    orderBy: {
      doctor: { appointments: { _count: 'asc' } },
    },
  });

  if (!candidateSlot) {
    throw AppError.conflict('No available doctor for the selected time');
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Free old slot
    await tx.timeSlot.updateMany({
      where: { id: original.timeSlotId, isBooked: true },
      data: { isBooked: false },
    });

    // Lock new slot
    const locked = await tx.timeSlot.updateMany({
      where: { id: candidateSlot.id, isBooked: false },
      data: { isBooked: true },
    });

    if (locked.count === 0) {
      throw AppError.conflict('Slot was just taken, please try again');
    }

    return tx.appointment.update({
      where: { id: appointmentId },
      data: {
        timeSlotId: candidateSlot.id,
        doctorId: candidateSlot.doctorId,
        // Reset to PENDING after reschedule
        status: AppointmentStatus.PENDING,
      },
      include: appointmentInclude,
    });
  });

  return mapAppointment(updated);
}

/**
 * Doctor rejects a pending appointment with a reason.
 */
export async function rejectAppointment(
  context: AppointmentUserContext,
  appointmentId: string,
  reason: string
): Promise<AppointmentDto> {
  if (context.role !== Role.DOCTOR) {
    throw AppError.forbidden('Only doctors can reject appointments');
  }

  const doctorId = await getDoctorIdForUser(context.userId);
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: appointmentInclude,
  });

  if (!appointment) throw AppError.notFound('Appointment not found');
  if (appointment.doctorId !== doctorId) throw AppError.forbidden('Not your appointment');
  if (appointment.status !== AppointmentStatus.PENDING) {
    throw AppError.conflict('Only pending appointments can be rejected');
  }

  const rejected = await prisma.$transaction(async (tx) => {
    await tx.timeSlot.updateMany({
      where: { id: appointment.timeSlotId, isBooked: true },
      data: { isBooked: false },
    });
    return tx.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELED,
        rejectionReason: reason,
        canceledAt: new Date(),
      },
      include: appointmentInclude,
    });
  });

  return mapAppointment(rejected);
}

/**
 * Doctor completes exam → AWAITING_PAYMENT.
 * Can add diagnosis and additional services.
 */
export async function completeAppointment(
  context: AppointmentUserContext,
  appointmentId: string,
  input: { diagnosis?: string; serviceIds?: string[] }
): Promise<AppointmentDto> {
  if (context.role !== Role.DOCTOR) {
    throw AppError.forbidden('Only doctors can complete appointments');
  }

  const doctorId = await getDoctorIdForUser(context.userId);
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: appointmentInclude,
  });

  if (!appointment) throw AppError.notFound('Appointment not found');
  if (appointment.doctorId !== doctorId) throw AppError.forbidden('Not your appointment');
  if (appointment.status !== AppointmentStatus.CONFIRMED) {
    throw AppError.conflict('Only confirmed appointments can be completed');
  }

  // Add extra services if provided
  const newServiceIds = (input.serviceIds ?? []).filter(
    (sid) => !appointment.services.some((s) => s.serviceId === sid)
  );
  let newServices: { id: string; price: Prisma.Decimal }[] = [];
  if (newServiceIds.length > 0) {
    newServices = await prisma.service.findMany({
      where: { id: { in: newServiceIds }, deletedAt: null },
      select: { id: true, price: true },
    });
  }

  const existingTotal = decimalToNumber(appointment.totalAmount);
  const addedTotal = newServices.reduce((sum, s) => sum + decimalToNumber(s.price), 0);

  const completed = await prisma.$transaction(async (tx) => {
    if (newServices.length > 0) {
      await tx.appointmentService.createMany({
        data: newServices.map((s) => ({
          appointmentId,
          serviceId: s.id,
          price: s.price,
        })),
      });
    }

    return tx.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.AWAITING_PAYMENT,
        diagnosis: input.diagnosis ?? appointment.diagnosis,
        totalAmount: existingTotal + addedTotal,
      },
      include: appointmentInclude,
    });
  });

  return mapAppointment(completed);
}

/**
 * Patient confirms payment → COMPLETED.
 */
export async function payAppointment(
  context: AppointmentUserContext,
  appointmentId: string,
  paymentMethod: string
): Promise<AppointmentDto> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: appointmentInclude,
  });

  if (!appointment) throw AppError.notFound('Appointment not found');

  if (context.role === Role.PATIENT && appointment.patientId !== context.userId) {
    throw AppError.forbidden('Not your appointment');
  }

  if (appointment.status !== AppointmentStatus.AWAITING_PAYMENT) {
    throw AppError.conflict('Appointment is not awaiting payment');
  }

  const paid = await prisma.$transaction(async (tx) => {
    // Create payment record
    await tx.payment.create({
      data: {
        appointmentId,
        userId: appointment.patientId,
        amount: appointment.totalAmount,
        method: paymentMethod === 'MOMO' ? 'MOMO' : paymentMethod === 'CASH' ? 'CASH' : 'VNPAY',
        transactionId: `TXN-${Date.now()}`,
        status: 'PAID',
      },
    });

    return tx.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.COMPLETED },
      include: appointmentInclude,
    });
  });

  return mapAppointment(paid);
}
