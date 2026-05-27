import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const patient = await p.user.findFirst({ where: { email: 'patient1@gmail.com' } });
  const doctor = await p.doctor.findFirst({ include: { user: true } });
  // pick a PENDING appointment, a COMPLETED appointment, an AWAITING_PAYMENT
  const appPending = await p.appointment.findFirst({ where: { status: 'PENDING' }, orderBy: { createdAt: 'desc' } });
  const appConfirmed = await p.appointment.findFirst({ where: { status: 'CONFIRMED' } });
  const appCompleted = await p.appointment.findFirst({ where: { status: 'COMPLETED', review: null } });
  const appAwaitingPay = await p.appointment.findFirst({ where: { status: 'AWAITING_PAYMENT' } });
  const specialty = await p.specialty.findFirst();
  console.log(JSON.stringify({
    patientId: patient?.id,
    doctorId: doctor?.id,
    appPendingId: appPending?.id,
    appConfirmedId: appConfirmed?.id,
    appCompletedId: appCompleted?.id,
    appAwaitingPayId: appAwaitingPay?.id,
    specialtyId: specialty?.id,
  }, null, 2));
  await p.$disconnect();
})();
