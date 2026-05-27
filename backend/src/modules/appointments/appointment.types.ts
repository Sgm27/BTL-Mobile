import { AppointmentStatus, Role } from '@prisma/client';

export interface RescheduleAppointmentInput {
  date: string;
  startTime: string;
}

export interface CreateAppointmentInput {
  specialtyId: string;
  clinicId?: string;
  date: string;
  startTime: string;
  serviceIds: string[];
  notes?: string;
}

export interface AvailableSlotDto {
  date: string;
  startTime: string;
  endTime: string;
  availableCount: number;
  avgFee: number;
  clinics: {
    id: string;
    name: string;
    address: string;
  }[];
}

export interface AppointmentListQuery {
  page: number;
  limit: number;
  status?: AppointmentStatus;
}

export interface AppointmentUserContext {
  userId: string;
  role: Role;
}

export interface AppointmentWorkItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface AppointmentServiceDto {
  id: string;
  serviceId: string;
  service: {
    id: string;
    name: string;
    price: number;
    category: string | null;
  };
  price: number;
}

export interface AppointmentDoctorDto {
  id: string;
  userId: string;
  name: string;
  specialty: {
    id: string;
    name: string;
  };
  clinic: {
    id: string;
    name: string;
    address: string;
  } | null;
  experienceYears: number;
  consultationFee: number;
  status: string;
}

export interface AppointmentPatientDto {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
}

export interface AppointmentTimeSlotDto {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface AppointmentReviewDto {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface AppointmentDto {
  id: string;
  patientId: string;
  doctorId: string;
  timeSlotId: string;
  status: AppointmentStatus;
  notes: string | null;
  diagnosis: string | null;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  canceledAt: string | null;
  patient: AppointmentPatientDto | null;
  doctor: AppointmentDoctorDto;
  timeSlot: AppointmentTimeSlotDto;
  services: AppointmentServiceDto[];
  review: AppointmentReviewDto | null;
}
