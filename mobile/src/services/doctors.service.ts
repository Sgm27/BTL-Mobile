import { api, extractData, extractPaginatedData } from './api';
import type { Doctor } from '../types';

export interface DoctorServiceItem {
  id: string;
  serviceId: string;
  name: string;
  price: number;
  category?: string | null;
}

export interface DoctorSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface DoctorDetail extends Omit<Doctor, 'bio'> {
  bio?: string | null;
  licenseNumber?: string | null;
  doctorServices: DoctorServiceItem[];
}

interface PaginatedResponse<T> {
  data: T;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getDoctors(params?: {
  q?: string;
  specialtyId?: string;
  clinicId?: string;
  status?: 'PENDING' | 'ACTIVE' | 'REJECTED';
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Doctor[]>> {
  const response = await api.get('/doctors', { params });
  return extractPaginatedData<Doctor[]>(response);
}

export async function getDoctorDetail(id: string): Promise<DoctorDetail> {
  const response = await api.get(`/doctors/${id}`);
  return extractData<DoctorDetail>(response);
}

export async function getDoctorSlots(id: string, date?: string): Promise<DoctorSlot[]> {
  const response = await api.get(`/doctors/${id}/slots`, {
    params: date ? { date } : undefined,
  });
  return extractData<DoctorSlot[]>(response);
}

export interface DoctorReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  patient: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface DoctorRatingStats {
  averageRating: number;
  totalReviews: number;
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
}

export interface DoctorReviewsPayload {
  items: DoctorReviewItem[];
  stats: DoctorRatingStats;
}

export async function getDoctorReviews(id: string, page = 1) {
  const response = await api.get(`/doctors/${id}/reviews`, {
    params: { page, limit: 10 },
  });
  return extractPaginatedData<DoctorReviewsPayload>(response);
}
