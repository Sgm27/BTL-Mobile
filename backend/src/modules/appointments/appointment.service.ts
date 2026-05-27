/**
 * appointment.service.ts
 * Thuộc module Đặt lịch khám (Appointments) của Ngô Đức Sơn.
 *
 * Chứa toàn bộ logic nghiệp vụ cho luồng đặt lịch: tra cứu khung giờ trống,
 * tạo lịch hẹn với cơ chế tự động phân bổ bác sĩ (load balancing), và quản lý
 * vòng đời lịch hẹn theo state machine PENDING → CONFIRMED → AWAITING_PAYMENT
 * → COMPLETED (hoặc CANCELED). Bảo đảm không đặt trùng khung giờ bằng
 * optimistic locking + transaction.
 */
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

// Cấu hình include dùng chung cho mọi truy vấn lịch hẹn: nạp kèm thông tin
// bệnh nhân, bác sĩ (user/chuyên khoa/phòng khám), khung giờ, dịch vụ và đánh giá.
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

// Chuyển kiểu Decimal của Prisma về number; trả 0 nếu giá trị rỗng.
function decimalToNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

// Định dạng Date thành chuỗi ISO 8601 (theo UTC), null nếu không có giá trị.
function toIso(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null;
}

// Lấy phần ngày YYYY-MM-DD theo UTC từ Date.
function toDateOnly(date: Date | null | undefined): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

// Ánh xạ bản ghi Prisma sang DTO phẳng trả về cho client (chuẩn hoá Decimal, Date).
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

// Lấy doctorId từ userId; báo lỗi nếu không có hồ sơ bác sĩ hoặc bác sĩ chưa ở
// trạng thái ACTIVE. Dùng để xác thực quyền truy cập theo role DOCTOR.
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

// Kiểm tra quyền truy cập một lịch hẹn theo role:
// ADMIN xem tất cả; PATIENT chỉ xem lịch của chính mình; DOCTOR chỉ xem lịch
// được gán cho mình. Vi phạm thì ném lỗi forbidden.
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
 * Tra cứu các khung giờ còn trống theo chuyên khoa (có thể lọc thêm theo phòng
 * khám) trong một ngày. Gom nhóm theo cặp startTime/endTime và đếm số bác sĩ
 * đang rảnh ở mỗi khung; trả thêm phí trung bình và danh sách phòng khám.
 * @param input.specialtyId Chuyên khoa cần tìm khung giờ.
 * @param input.clinicId (tuỳ chọn) Giới hạn theo một phòng khám cụ thể.
 * @param input.date Ngày dạng YYYY-MM-DD.
 * @returns Danh sách khung giờ trống đã gom nhóm.
 */
export async function getAvailableSlots(input: {
  specialtyId: string;
  clinicId?: string;
  date: string;
}): Promise<AvailableSlotDto[]> {
  // Chuẩn hoá ngày về mốc 00:00 UTC để khớp đúng cột date lưu theo UTC trong DB.
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

  // Gom nhóm theo cặp startTime-endTime
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
 * Tạo lịch hẹn từ lựa chọn chuyên khoa + ngày + khung giờ. Hệ thống tự động
 * phân bổ một bác sĩ đang rảnh phù hợp (ưu tiên bác sĩ ít lịch nhất để load
 * balancing). Lịch mới luôn khởi tạo ở trạng thái PENDING.
 * @param userId ID bệnh nhân đặt lịch.
 * @param input Chuyên khoa, phòng khám (tuỳ chọn), ngày, giờ, dịch vụ, ghi chú.
 * @returns Lịch hẹn vừa tạo (đã ánh xạ sang DTO).
 */
export async function createAppointment(
  userId: string,
  input: CreateAppointmentInput
): Promise<AppointmentDto> {
  const dateFilter = new Date(input.date + 'T00:00:00.000Z');
  if (Number.isNaN(dateFilter.getTime())) {
    throw AppError.badRequest('Invalid date');
  }

  // Tìm một khung giờ còn trống khớp chuyên khoa + phòng khám + ngày + giờ.
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
      // Load balancing: ưu tiên bác sĩ có ít lịch hẹn nhất (sắp xếp _count tăng dần).
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
  const totalAmount = serviceTotal; // Phí lấy từ các dịch vụ do bác sĩ thêm sau khi khám

  // Bọc trong transaction: khoá khung giờ rồi tạo lịch hẹn, đảm bảo nguyên tử.
  const appointment = await prisma.$transaction(async (tx) => {
    // Optimistic locking: chỉ khoá được khi khung giờ vẫn còn isBooked:false.
    // Nếu count === 0 nghĩa là một request khác vừa giành mất khung giờ (race condition).
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

/**
 * Lấy chi tiết một lịch hẹn theo ID. Kiểm tra quyền truy cập theo role trước
 * khi trả về (ADMIN xem tất cả, PATIENT/DOCTOR chỉ xem lịch liên quan mình).
 * @returns Chi tiết lịch hẹn dạng DTO.
 */
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

/**
 * Lấy danh sách lịch hẹn (có phân trang) theo ngữ cảnh người dùng:
 * - PATIENT: chỉ lịch của chính mình.
 * - DOCTOR: tất cả lịch PENDING cùng chuyên khoa (để nhận) + lịch đã gán cho mình.
 * - ADMIN: toàn bộ. Có thể lọc theo status.
 * @returns data + meta phân trang (page, limit, total, totalPages).
 */
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
      // Hiển thị: mọi lịch PENDING cùng chuyên khoa (để bác sĩ nhận) + lịch không
      // còn PENDING đã được gán cho chính bác sĩ này.
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
    // ADMIN xem được tất cả lịch hẹn
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

/**
 * Huỷ một lịch hẹn. Chỉ bệnh nhân sở hữu hoặc ADMIN được huỷ. Không huỷ được
 * lịch đã CANCELED hoặc COMPLETED. Khi huỷ thành công sẽ giải phóng lại khung
 * giờ (isBooked → false) để người khác có thể đặt.
 * @returns Lịch hẹn sau khi chuyển sang trạng thái CANCELED.
 */
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

  // Chỉ chủ lịch (PATIENT) hoặc ADMIN mới được huỷ.
  if (context.role !== Role.ADMIN && appointment.patientId !== context.userId) {
    throw AppError.forbidden('You can only cancel your own appointment');
  }

  if (appointment.status === AppointmentStatus.CANCELED) {
    throw AppError.conflict('Appointment is already canceled');
  }

  if (appointment.status === AppointmentStatus.COMPLETED) {
    throw AppError.conflict('Completed appointments cannot be canceled');
  }

  // Transaction: giải phóng khung giờ + cập nhật trạng thái lịch trong một bước.
  const canceled = await prisma.$transaction(async (tx) => {
    // Trả lại khung giờ về trống để bác sĩ/bệnh nhân khác có thể đặt.
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
 * Bác sĩ xác nhận một lịch hẹn PENDING (chuyển trạng thái PENDING → CONFIRMED).
 * Bất kỳ bác sĩ nào cùng chuyên khoa đều có thể nhận; ai xác nhận trước thì
 * thắng (optimistic locking trên status). Lịch sẽ được gán lại (reassign) cho
 * bác sĩ vừa xác nhận. Chỉ role DOCTOR được phép.
 * @returns Lịch hẹn sau khi CONFIRMED.
 */
export async function confirmAppointment(
  context: AppointmentUserContext,
  appointmentId: string
): Promise<AppointmentDto> {
  if (context.role !== Role.DOCTOR) {
    throw AppError.forbidden('Only doctors can confirm appointments');
  }

  const doctorId = await getDoctorIdForUser(context.userId);

  // Lấy chuyên khoa của bác sĩ đang xác nhận
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

  // Bác sĩ chỉ được nhận lịch thuộc đúng chuyên khoa của mình.
  if (appointment.doctor.specialtyId !== confirmingDoctor.specialtyId) {
    throw AppError.forbidden('Appointment is not in your specialty');
  }

  if (appointment.status !== AppointmentStatus.PENDING) {
    throw AppError.conflict('Lịch hẹn này đã được bác sĩ khác nhận hoặc đã bị huỷ.');
  }

  // Optimistic locking: chỉ cập nhật nếu lịch VẪN còn PENDING. Điều kiện status
  // trong where chống race condition khi nhiều bác sĩ bấm nhận cùng lúc.
  const result = await prisma.appointment.updateMany({
    where: { id: appointmentId, status: AppointmentStatus.PENDING },
    data: {
      status: AppointmentStatus.CONFIRMED,
      doctorId, // gán lại (reassign) lịch cho bác sĩ vừa xác nhận
    },
  });

  // count === 0 → một bác sĩ khác đã giành nhận trước trong tích tắc.
  if (result.count === 0) {
    throw AppError.conflict('Lịch hẹn này đã được bác sĩ khác nhận.');
  }

  // Nạp lại bản ghi sau khi cập nhật
  const confirmed = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: appointmentInclude,
  });

  return mapAppointment(confirmed!);
}

/**
 * Đổi lịch hẹn sang ngày/giờ mới. Chỉ chủ lịch (PATIENT) được đổi và chỉ khi
 * lịch còn ở trạng thái PENDING. Hệ thống giải phóng khung giờ cũ rồi khoá một
 * khung giờ mới khớp đúng chuyên khoa/phòng khám ban đầu; lịch giữ lại PENDING.
 * @param userId ID bệnh nhân sở hữu lịch.
 * @param input Ngày + giờ mới mong muốn.
 * @returns Lịch hẹn sau khi đổi.
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

  // Tìm khung giờ trống khớp đúng chuyên khoa + phòng khám của lịch gốc.
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
      // Load balancing: chọn bác sĩ có ít lịch hẹn nhất.
      doctor: { appointments: { _count: 'asc' } },
    },
  });

  if (!candidateSlot) {
    throw AppError.conflict('No available doctor for the selected time');
  }

  // Transaction: giải phóng khung cũ + khoá khung mới + cập nhật lịch nguyên tử.
  const updated = await prisma.$transaction(async (tx) => {
    // Giải phóng khung giờ cũ về trống.
    await tx.timeSlot.updateMany({
      where: { id: original.timeSlotId, isBooked: true },
      data: { isBooked: false },
    });

    // Optimistic locking: khoá khung giờ mới, chỉ thành công khi còn isBooked:false.
    const locked = await tx.timeSlot.updateMany({
      where: { id: candidateSlot.id, isBooked: false },
      data: { isBooked: true },
    });

    // count === 0 → khung giờ mới vừa bị người khác giành (race condition).
    if (locked.count === 0) {
      throw AppError.conflict('Slot was just taken, please try again');
    }

    return tx.appointment.update({
      where: { id: appointmentId },
      data: {
        timeSlotId: candidateSlot.id,
        doctorId: candidateSlot.doctorId,
        // Sau khi đổi lịch, đưa về PENDING để bác sĩ xác nhận lại.
        status: AppointmentStatus.PENDING,
      },
      include: appointmentInclude,
    });
  });

  return mapAppointment(updated);
}

/**
 * Bác sĩ từ chối một lịch hẹn PENDING kèm lý do. Chỉ bác sĩ được gán lịch và
 * chỉ khi lịch đang PENDING. Lịch chuyển sang CANCELED (lưu rejectionReason) và
 * giải phóng lại khung giờ. Chỉ role DOCTOR được phép.
 * @param reason Lý do từ chối (bắt buộc, lưu vào lịch).
 * @returns Lịch hẹn sau khi bị từ chối (CANCELED).
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

  // Transaction: giải phóng khung giờ + chuyển trạng thái lịch nguyên tử.
  const rejected = await prisma.$transaction(async (tx) => {
    // Trả lại khung giờ về trống vì lịch bị từ chối.
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
 * Bác sĩ hoàn tất khám (chuyển trạng thái CONFIRMED → AWAITING_PAYMENT). Có thể
 * bổ sung chẩn đoán và thêm dịch vụ phát sinh; tổng tiền được cộng dồn theo các
 * dịch vụ mới thêm. Chỉ bác sĩ được gán lịch và chỉ khi lịch đang CONFIRMED.
 * @param input.diagnosis (tuỳ chọn) Chẩn đoán; input.serviceIds dịch vụ thêm.
 * @returns Lịch hẹn sau khi chuyển sang AWAITING_PAYMENT.
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

  // Lọc ra các dịch vụ mới (chưa có trong lịch) để tránh thêm trùng.
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

  // Transaction: thêm dịch vụ phát sinh + cập nhật trạng thái/tổng tiền nguyên tử.
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
 * Bệnh nhân xác nhận thanh toán (chuyển trạng thái AWAITING_PAYMENT →
 * COMPLETED). Tạo bản ghi payment tương ứng và đóng lịch hẹn. PATIENT chỉ
 * thanh toán được lịch của mình; chỉ áp dụng khi lịch đang AWAITING_PAYMENT.
 * @param paymentMethod Phương thức thanh toán (VNPAY | MOMO | CASH).
 * @returns Lịch hẹn sau khi COMPLETED.
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

  // Transaction: ghi nhận thanh toán + đóng lịch hẹn trong cùng một bước.
  const paid = await prisma.$transaction(async (tx) => {
    // Tạo bản ghi thanh toán (transactionId sinh tạm theo timestamp cho demo).
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
