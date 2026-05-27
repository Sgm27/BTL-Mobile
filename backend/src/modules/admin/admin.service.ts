import { prisma } from '@config/database';
import { AppError } from '@utils/app-error';
import type { DoctorStatus } from '@prisma/client';

// ── Dashboard ──────────────────────────────────────────────

export async function getDashboard() {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));

  const [
    totalPatients,
    totalDoctors,
    appointmentsThisMonth,
    revenueResult,
    topDoctors,
    canceledThisMonth,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'PATIENT', deletedAt: null } }),
    prisma.doctor.count({ where: { deletedAt: null } }),
    prisma.appointment.count({
      where: { createdAt: { gte: monthStart, lt: monthEnd } },
    }),
    prisma.payment.aggregate({
      where: { status: 'PAID', paidAt: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.appointment.groupBy({
      by: ['doctorId'],
      where: { createdAt: { gte: monthStart, lt: monthEnd } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
    prisma.appointment.count({
      where: {
        status: 'CANCELED',
        createdAt: { gte: monthStart, lt: monthEnd },
      },
    }),
  ]);

  // Resolve top doctor names
  const doctorIds = topDoctors.map((d) => d.doctorId);
  const doctors = doctorIds.length
    ? await prisma.doctor.findMany({
        where: { id: { in: doctorIds } },
        include: { user: { select: { name: true } } },
      })
    : [];
  const doctorMap = new Map(doctors.map((d) => [d.id, d.user.name]));

  const cancelRate =
    appointmentsThisMonth > 0
      ? Math.round((canceledThisMonth / appointmentsThisMonth) * 100)
      : 0;

  return {
    totalPatients,
    totalDoctors,
    appointmentsThisMonth,
    revenueThisMonth: Number(revenueResult._sum.amount ?? 0),
    cancelRate,
    topDoctors: topDoctors.map((d) => ({
      doctorId: d.doctorId,
      name: doctorMap.get(d.doctorId) ?? 'Unknown',
      appointmentCount: d._count.id,
    })),
  };
}

// ── Doctors ────────────────────────────────────────────────

export async function listDoctors(status?: DoctorStatus) {
  return prisma.doctor.findMany({
    where: {
      deletedAt: null,
      ...(status ? { status } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
      specialty: { select: { id: true, name: true } },
      clinic: { select: { id: true, name: true } },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function approveDoctor(id: string) {
  const doctor = await prisma.doctor.findFirst({ where: { id, deletedAt: null } });
  if (!doctor) throw AppError.notFound('Doctor not found');

  return prisma.doctor.update({
    where: { id },
    data: { status: 'ACTIVE', rejectionReason: null },
    include: {
      user: { select: { name: true, email: true } },
      specialty: { select: { id: true, name: true } },
    },
  });
}

export async function rejectDoctor(id: string, reason: string) {
  const doctor = await prisma.doctor.findFirst({ where: { id, deletedAt: null } });
  if (!doctor) throw AppError.notFound('Doctor not found');

  return prisma.doctor.update({
    where: { id },
    data: { status: 'REJECTED', rejectionReason: reason },
    include: {
      user: { select: { name: true, email: true } },
      specialty: { select: { id: true, name: true } },
    },
  });
}

// ── Clinics ────────────────────────────────────────────────

export async function listClinics() {
  return prisma.clinic.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createClinic(data: {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  phone?: string;
  openingHours?: string;
  imageUrl?: string;
}) {
  return prisma.clinic.create({ data });
}

export async function updateClinic(
  id: string,
  data: Partial<{
    name: string;
    address: string;
    lat: number;
    lng: number;
    phone: string;
    openingHours: string;
    imageUrl: string;
  }>,
) {
  const clinic = await prisma.clinic.findFirst({ where: { id, deletedAt: null } });
  if (!clinic) throw AppError.notFound('Clinic not found');
  return prisma.clinic.update({ where: { id }, data });
}

export async function deleteClinic(id: string) {
  const clinic = await prisma.clinic.findFirst({ where: { id, deletedAt: null } });
  if (!clinic) throw AppError.notFound('Clinic not found');
  return prisma.clinic.update({ where: { id }, data: { deletedAt: new Date() } });
}

// ── Specialties ────────────────────────────────────────────

export async function createSpecialty(data: {
  name: string;
  description?: string;
  iconUrl?: string;
  symptoms?: string[];
}) {
  return prisma.specialty.create({ data });
}

export async function updateSpecialty(
  id: string,
  data: Partial<{ name: string; description: string; iconUrl: string; symptoms: string[] }>,
) {
  const specialty = await prisma.specialty.findFirst({ where: { id, deletedAt: null } });
  if (!specialty) throw AppError.notFound('Specialty not found');
  return prisma.specialty.update({ where: { id }, data });
}

// ── Services ───────────────────────────────────────────────

export async function listServices() {
  return prisma.service.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createService(data: {
  name: string;
  price: number;
  category?: string;
}) {
  return prisma.service.create({ data });
}

export async function updateService(
  id: string,
  data: Partial<{ name: string; price: number; category: string }>,
) {
  const service = await prisma.service.findFirst({ where: { id, deletedAt: null } });
  if (!service) throw AppError.notFound('Service not found');
  return prisma.service.update({ where: { id }, data });
}

export async function deleteService(id: string) {
  const service = await prisma.service.findFirst({ where: { id, deletedAt: null } });
  if (!service) throw AppError.notFound('Service not found');
  return prisma.service.update({ where: { id }, data: { deletedAt: new Date() } });
}

// ── Work Schedules ─────────────────────────────────────────

export async function generateWorkSchedules(year: number, month: number) {
  const schedules: { date: Date; shift: 'MORNING' | 'AFTERNOON'; startTime: string; endTime: string }[] = [];

  // month is 1-based; Date.UTC month is 0-based
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, month - 1, day));
    const dow = date.getUTCDay(); // 0=Sun, 6=Sat

    // Skip weekends
    if (dow === 0 || dow === 6) continue;

    schedules.push(
      { date, shift: 'MORNING', startTime: '08:00', endTime: '12:00' },
      { date, shift: 'AFTERNOON', startTime: '13:00', endTime: '17:00' },
    );
  }

  // Use createMany with skipDuplicates so re-running is safe
  const result = await prisma.workSchedule.createMany({
    data: schedules,
    skipDuplicates: true,
  });

  return { created: result.count, total: schedules.length };
}
