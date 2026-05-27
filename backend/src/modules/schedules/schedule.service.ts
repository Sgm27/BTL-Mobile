/**
 * schedule.service.ts
 * Module "Quản lý lịch làm việc" (Schedules) — tác giả Ngô Đức Sơn.
 * Chứa toàn bộ business logic xử lý lịch làm việc của bác sĩ: đăng ký ca làm
 * (WorkSchedule), xem và cập nhật các khung giờ khám (TimeSlot) trong ngày.
 * Tất cả thao tác đều yêu cầu người dùng có role DOCTOR và hồ sơ bác sĩ ACTIVE.
 */
import { DoctorStatus, Prisma, Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import {
  DoctorScheduleDto,
  RegisterDoctorScheduleInput,
  ScheduleUserContext,
} from './schedule.types';

const doctorScheduleInclude = {
  workSchedule: true,
} satisfies Prisma.DoctorScheduleInclude;

type DoctorScheduleRecord = Prisma.DoctorScheduleGetPayload<{
  include: typeof doctorScheduleInclude;
}>;

/** Chuyển Date về chuỗi chỉ chứa ngày dạng YYYY-MM-DD (bỏ phần giờ). */
function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Ánh xạ bản ghi DoctorSchedule (kèm WorkSchedule) sang DTO trả về cho client. */
function mapDoctorSchedule(record: DoctorScheduleRecord): DoctorScheduleDto {
  return {
    id: record.id,
    room: record.room,
    workSchedule: {
      id: record.workSchedule.id,
      date: toDateOnly(record.workSchedule.date),
      shift: record.workSchedule.shift,
      startTime: record.workSchedule.startTime,
      endTime: record.workSchedule.endTime,
      createdAt: record.workSchedule.createdAt.toISOString(),
    },
  };
}

/**
 * Lấy doctorId tương ứng với một userId.
 * Quy tắc nghiệp vụ: user phải có hồ sơ bác sĩ và hồ sơ đó phải ở trạng thái
 * ACTIVE thì mới được thao tác lịch; nếu không sẽ ném lỗi notFound/forbidden.
 * @param userId - id của user đang đăng nhập
 * @returns id của hồ sơ bác sĩ
 */
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

/**
 * Đăng ký ca làm việc cho bác sĩ đang đăng nhập (yêu cầu role DOCTOR).
 * Hỗ trợ hai cách nhập: truyền sẵn workScheduleIds (đường legacy), hoặc truyền
 * date+shift để hệ thống tự tạo WorkSchedule tương ứng nếu chưa tồn tại.
 * Quy tắc nghiệp vụ: chặn đăng ký trùng ca — nếu bác sĩ đã đăng ký ca đó rồi
 * thì ném lỗi conflict.
 * @param context - thông tin user (userId, role) đang đăng nhập
 * @param input - dữ liệu đăng ký ca làm
 * @returns danh sách ca làm vừa đăng ký, sắp xếp theo ngày tăng dần
 */
export async function registerDoctorSchedules(
  context: ScheduleUserContext,
  input: RegisterDoctorScheduleInput
): Promise<DoctorScheduleDto[]> {
  if (context.role !== Role.DOCTOR) {
    throw AppError.forbidden('Only doctors can register schedules');
  }

  const doctorId = await getDoctorIdForUser(context.userId);

  let workScheduleIds: string[];

  if (input.workScheduleIds && input.workScheduleIds.length > 0) {
    // Đường legacy: dùng các WorkSchedule ID đã tồn tại sẵn
    workScheduleIds = [...new Set(input.workScheduleIds)];
  } else if (input.date && input.shift) {
    // Đường mới: tự tạo WorkSchedule dựa trên ngày + ca làm (shift)
    const dateObj = new Date(input.date + 'T00:00:00.000Z');
    if (Number.isNaN(dateObj.getTime())) {
      throw AppError.badRequest('Invalid date');
    }

    // Tìm WorkSchedule cho ngày + ca này; nếu chưa có thì tạo mới với giờ
    // mặc định theo ca (sáng 08:00-12:00, chiều 13:00-17:00)
    let ws = await prisma.workSchedule.findFirst({
      where: {
        date: dateObj,
        shift: input.shift,
      },
    });

    if (!ws) {
      ws = await prisma.workSchedule.create({
        data: {
          date: dateObj,
          shift: input.shift,
          startTime: input.startTime ?? (input.shift === 'MORNING' ? '08:00' : '13:00'),
          endTime: input.endTime ?? (input.shift === 'MORNING' ? '12:00' : '17:00'),
        },
      });
    }

    workScheduleIds = [ws.id];
  } else {
    throw AppError.badRequest('Provide workScheduleIds or date+shift');
  }

  // Kiểm tra bác sĩ chưa đăng ký ca này trước đó (chặn trùng ca)
  const existing = await prisma.doctorSchedule.findMany({
    where: { doctorId, workScheduleId: { in: workScheduleIds } },
    select: { workScheduleId: true },
  });

  if (existing.length > 0) {
    throw AppError.conflict('Ca làm này đã được đăng ký');
  }

  await prisma.doctorSchedule.createMany({
    data: workScheduleIds.map((workScheduleId) => ({
      doctorId,
      workScheduleId,
      room: input.room,
    })),
  });

  const created = await prisma.doctorSchedule.findMany({
    where: { doctorId, workScheduleId: { in: workScheduleIds } },
    include: doctorScheduleInclude,
  });

  return created
    .map(mapDoctorSchedule)
    .sort((a, b) => a.workSchedule.date.localeCompare(b.workSchedule.date));
}

/**
 * Lấy danh sách khung giờ khám (TimeSlot) của bác sĩ trong một ngày (role DOCTOR).
 * Mỗi slot kèm cờ isBooked cho biết đã có bệnh nhân đặt hay chưa.
 * @param context - thông tin user đang đăng nhập
 * @param date - ngày cần xem (định dạng YYYY-MM-DD)
 * @returns danh sách slot sắp xếp theo giờ bắt đầu tăng dần
 */
export async function getDoctorTimeSlots(
  context: ScheduleUserContext,
  date: string
): Promise<{ startTime: string; endTime: string; isBooked: boolean }[]> {
  if (context.role !== Role.DOCTOR) {
    throw AppError.forbidden('Only doctors can view time slots');
  }

  const doctorId = await getDoctorIdForUser(context.userId);
  const dateObj = new Date(date + 'T00:00:00.000Z');

  const slots = await prisma.timeSlot.findMany({
    where: { doctorId, date: dateObj },
    orderBy: { startTime: 'asc' },
  });

  return slots.map((s) => ({
    startTime: s.startTime,
    endTime: s.endTime,
    isBooked: s.isBooked,
  }));
}

/**
 * Cập nhật hàng loạt khung giờ khám của bác sĩ trong một ngày (role DOCTOR).
 * Cơ chế: xoá toàn bộ slot CHƯA được đặt rồi tạo lại theo danh sách mới, đồng
 * thời GIỮ NGUYÊN các slot đã có bệnh nhân đặt (isBooked = true) để không huỷ
 * lịch hẹn đã chốt.
 * @param context - thông tin user đang đăng nhập
 * @param date - ngày cần cập nhật (YYYY-MM-DD)
 * @param slots - danh sách khung giờ mong muốn (startTime, endTime)
 * @returns số slot vừa tạo và số slot vừa xoá
 */
export async function bulkUpsertDoctorTimeSlots(
  context: ScheduleUserContext,
  date: string,
  slots: { startTime: string; endTime: string }[]
): Promise<{ created: number; deleted: number }> {
  if (context.role !== Role.DOCTOR) {
    throw AppError.forbidden('Only doctors can manage time slots');
  }

  const doctorId = await getDoctorIdForUser(context.userId);
  const dateObj = new Date(date + 'T00:00:00.000Z');

  // Xoá tất cả slot CHƯA được đặt của bác sĩ trong ngày này
  const deleteResult = await prisma.timeSlot.deleteMany({
    where: { doctorId, date: dateObj, isBooked: false },
  });

  // Tạo lại các slot trống mới (bỏ qua slot trùng giờ với slot đã được đặt)
  if (slots.length === 0) {
    return { created: 0, deleted: deleteResult.count };
  }

  // Lấy các slot đã được đặt để loại trùng giờ khi tạo slot mới
  const bookedSlots = await prisma.timeSlot.findMany({
    where: { doctorId, date: dateObj, isBooked: true },
    select: { startTime: true },
  });
  const bookedTimes = new Set(bookedSlots.map((s) => s.startTime));

  const toCreate = slots
    .filter((s) => !bookedTimes.has(s.startTime))
    .map((s) => ({
      doctorId,
      date: dateObj,
      startTime: s.startTime,
      endTime: s.endTime,
      isBooked: false,
    }));

  if (toCreate.length > 0) {
    await prisma.timeSlot.createMany({ data: toCreate });
  }

  return { created: toCreate.length, deleted: deleteResult.count };
}

/**
 * Lấy toàn bộ ca làm việc đã đăng ký của bác sĩ đang đăng nhập (role DOCTOR).
 * @param context - thông tin user đang đăng nhập
 * @returns danh sách ca làm, sắp xếp theo ngày tăng dần
 */
export async function getMyDoctorSchedules(
  context: ScheduleUserContext
): Promise<DoctorScheduleDto[]> {
  if (context.role !== Role.DOCTOR) {
    throw AppError.forbidden('Only doctors can view registered schedules');
  }

  const doctorId = await getDoctorIdForUser(context.userId);
  const schedules = await prisma.doctorSchedule.findMany({
    where: {
      doctorId,
    },
    include: doctorScheduleInclude,
  });

  return schedules
    .map(mapDoctorSchedule)
    .sort((left, right) => {
      return left.workSchedule.date.localeCompare(right.workSchedule.date);
    });
}
