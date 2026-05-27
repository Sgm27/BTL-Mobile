import { api, extractData } from './api';
import type { Payment } from '../types';

export interface PaymentWithDetails extends Payment {
  appointment: {
    id: string;
    status: string;
    totalAmount: number;
    doctor: {
      id: string;
      name: string;
      specialty: { id: string; name: string };
      clinic: { id: string; name: string; address: string } | null;
    };
    timeSlot: {
      id: string;
      date: string;
      startTime: string;
      endTime: string;
    };
  };
}

export interface CreatePaymentResponse extends PaymentWithDetails {
  paymentUrl: string | null;
}

export async function createPayment(input: {
  appointmentId: string;
  method: 'CASH' | 'VNPAY' | 'MOMO';
}): Promise<CreatePaymentResponse> {
  const response = await api.post('/payments/create', input);
  return extractData<CreatePaymentResponse>(response);
}

export async function getPaymentHistory(): Promise<PaymentWithDetails[]> {
  const response = await api.get('/payments/me');
  return extractData<PaymentWithDetails[]>(response);
}

export async function getPaymentById(id: string): Promise<PaymentWithDetails> {
  const response = await api.get(`/payments/${id}`);
  return extractData<PaymentWithDetails>(response);
}
