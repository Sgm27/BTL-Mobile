import { PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { env } from '../../config/env';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function decimalToNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function toIso(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null;
}

const paymentInclude = {
  appointment: {
    include: {
      doctor: {
        include: {
          user: { select: { id: true, name: true } },
          specialty: { select: { id: true, name: true } },
          clinic: { select: { id: true, name: true, address: true } },
        },
      },
      timeSlot: true,
    },
  },
} satisfies Prisma.PaymentInclude;

type PaymentRecord = Prisma.PaymentGetPayload<{ include: typeof paymentInclude }>;

function mapPayment(record: PaymentRecord) {
  return {
    id: record.id,
    appointmentId: record.appointmentId,
    userId: record.userId,
    amount: decimalToNumber(record.amount),
    method: record.method,
    status: record.status,
    transactionId: record.transactionId,
    paidAt: toIso(record.paidAt),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    appointment: {
      id: record.appointment.id,
      status: record.appointment.status,
      totalAmount: decimalToNumber(record.appointment.totalAmount),
      doctor: {
        id: record.appointment.doctor.id,
        name: record.appointment.doctor.user.name,
        specialty: record.appointment.doctor.specialty,
        clinic: record.appointment.doctor.clinic,
      },
      timeSlot: {
        id: record.appointment.timeSlot.id,
        date: record.appointment.timeSlot.date.toISOString().slice(0, 10),
        startTime: record.appointment.timeSlot.startTime,
        endTime: record.appointment.timeSlot.endTime,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Mock payment URL generator
// ---------------------------------------------------------------------------

function generateMockPaymentUrl(
  paymentId: string,
  method: PaymentMethod,
  amount: number,
): string {
  const baseUrl = env.APP_URL;
  const txnRef = paymentId;

  if (method === PaymentMethod.VNPAY) {
    // Mock VNPAY URL — redirects to our return endpoint with success params
    const params = new URLSearchParams({
      vnp_TxnRef: txnRef,
      vnp_ResponseCode: '00', // 00 = success
      vnp_Amount: String(amount * 100),
      vnp_SecureHash: crypto
        .createHmac('sha256', env.VNPAY_HASH_SECRET || 'mock-secret')
        .update(txnRef)
        .digest('hex'),
    });
    return `${baseUrl}/api/v1/payments/vnpay/return?${params.toString()}`;
  }

  if (method === PaymentMethod.MOMO) {
    // Mock Momo URL — same pattern, redirects to VNPAY return for simplicity
    const params = new URLSearchParams({
      vnp_TxnRef: txnRef,
      vnp_ResponseCode: '00',
      vnp_Amount: String(amount * 100),
      vnp_SecureHash: crypto
        .createHmac('sha256', env.VNPAY_HASH_SECRET || 'mock-secret')
        .update(txnRef)
        .digest('hex'),
    });
    return `${baseUrl}/api/v1/payments/vnpay/return?${params.toString()}`;
  }

  return '';
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export async function createPayment(
  userId: string,
  appointmentId: string,
  method: PaymentMethod,
) {
  // Check if appointment exists and belongs to user
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { payment: true },
  });

  if (!appointment) {
    throw AppError.notFound('Appointment not found');
  }

  if (appointment.patientId !== userId) {
    throw AppError.forbidden('You can only pay for your own appointments');
  }

  if (appointment.payment) {
    throw AppError.conflict('Payment already exists for this appointment');
  }

  const amount = decimalToNumber(appointment.totalAmount);

  const payment = await prisma.payment.create({
    data: {
      appointmentId,
      userId,
      amount,
      method,
      status: PaymentStatus.PENDING,
      transactionId: method !== PaymentMethod.CASH
        ? `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
        : null,
    },
    include: paymentInclude,
  });

  const paymentUrl = method !== PaymentMethod.CASH
    ? generateMockPaymentUrl(payment.id, method, amount)
    : null;

  return {
    ...mapPayment(payment),
    paymentUrl,
  };
}

export async function getPaymentHistory(userId: string) {
  const payments = await prisma.payment.findMany({
    where: { userId },
    include: paymentInclude,
    orderBy: { createdAt: 'desc' },
  });

  return payments.map(mapPayment);
}

export async function getPaymentById(userId: string, paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: paymentInclude,
  });

  if (!payment) {
    throw AppError.notFound('Payment not found');
  }

  if (payment.userId !== userId) {
    throw AppError.forbidden('You can only view your own payments');
  }

  return mapPayment(payment);
}

export async function handleVnpayIPN(query: Record<string, string>) {
  const txnRef = query.vnp_TxnRef;
  const responseCode = query.vnp_ResponseCode;

  if (!txnRef) {
    throw AppError.badRequest('Missing transaction reference');
  }

  const payment = await prisma.payment.findUnique({
    where: { id: txnRef },
    include: paymentInclude,
  });

  if (!payment) {
    throw AppError.notFound('Payment not found');
  }

  if (payment.status === PaymentStatus.PAID) {
    return { message: 'Payment already confirmed' };
  }

  if (responseCode === '00') {
    const updated = await prisma.payment.update({
      where: { id: txnRef },
      data: {
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      },
      include: paymentInclude,
    });
    return mapPayment(updated);
  }

  // Payment failed
  const updated = await prisma.payment.update({
    where: { id: txnRef },
    data: { status: PaymentStatus.FAILED },
    include: paymentInclude,
  });
  return mapPayment(updated);
}

export async function handleVnpayReturn(query: Record<string, string>) {
  const txnRef = query.vnp_TxnRef;
  const responseCode = query.vnp_ResponseCode;

  if (!txnRef) {
    return { success: false, message: 'Missing transaction reference' };
  }

  const payment = await prisma.payment.findUnique({
    where: { id: txnRef },
  });

  if (!payment) {
    return { success: false, message: 'Payment not found' };
  }

  // Auto-confirm on return for mock flow
  if (responseCode === '00' && payment.status === PaymentStatus.PENDING) {
    await prisma.payment.update({
      where: { id: txnRef },
      data: {
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      },
    });
    return { success: true, message: 'Payment successful', paymentId: payment.id };
  }

  if (responseCode === '00' && payment.status === PaymentStatus.PAID) {
    return { success: true, message: 'Payment already confirmed', paymentId: payment.id };
  }

  return { success: false, message: 'Payment failed or cancelled' };
}
