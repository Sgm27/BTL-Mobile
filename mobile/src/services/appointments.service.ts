import { api, extractData, extractPaginatedData } from './api';
import type { Appointment } from '../types';

interface PaginatedResponse<T> {
  data: T;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AvailableSlot {
  date: string;
  startTime: string;
  endTime: string;
  availableCount: number;
  avgFee: number;
  clinics: { id: string; name: string; address: string }[];
}

export async function getAvailableSlots(params: {
  specialtyId: string;
  clinicId?: string;
  date: string;
}): Promise<AvailableSlot[]> {
  const response = await api.get('/appointments/available-slots', { params });
  return extractData<AvailableSlot[]>(response);
}

export async function getMyAppointments(params?: {
  page?: number;
  limit?: number;
  status?: Appointment['status'];
}): Promise<PaginatedResponse<Appointment[]>> {
  const response = await api.get('/appointments/me', { params });
  return extractPaginatedData<Appointment[]>(response);
}

export async function createAppointment(input: {
  specialtyId: string;
  clinicId?: string;
  date: string;
  startTime: string;
  serviceIds?: string[];
  notes?: string;
}): Promise<Appointment> {
  const response = await api.post('/appointments', input);
  return extractData<Appointment>(response);
}

export async function cancelAppointment(id: string): Promise<Appointment> {
  const response = await api.put(`/appointments/${id}/cancel`);
  return extractData<Appointment>(response);
}

export async function rescheduleAppointment(
  id: string,
  input: { date: string; startTime: string }
): Promise<Appointment> {
  const response = await api.put(`/appointments/${id}/reschedule`, input);
  return extractData<Appointment>(response);
}
