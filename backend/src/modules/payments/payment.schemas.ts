import { PaymentMethod } from '@prisma/client';
import { z } from 'zod';

export const createPaymentSchema = z.object({
  appointmentId: z.string().uuid(),
  method: z.nativeEnum(PaymentMethod),
});

export const paymentIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const vnpayQuerySchema = z.object({
  vnp_TxnRef: z.string(),
  vnp_ResponseCode: z.string(),
  vnp_SecureHash: z.string().optional(),
}).passthrough();
