// ============================================
// Shared types for mobile app
// ============================================

export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export type DoctorStatus = 'PENDING' | 'ACTIVE' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  avatarUrl?: string;
  insuranceId?: string;
  doctorStatus?: DoctorStatus;
}

export interface Doctor {
  id: string;
  userId: string;
  name: string;
  specialty: Specialty;
  clinic?: Clinic | null;
  experienceYears: number;
  bio?: string | null;
  licenseNumber?: string | null;
  doctorServices?: {
    id: string;
    serviceId: string;
    name: string;
    price: number;
    category?: string | null;
  }[];
  consultationFee: number;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
  averageRating?: number;
  totalReviews?: number;
}

export interface Specialty {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  phone?: string;
  openingHours?: string;
  imageUrl?: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  category?: string;
}

export interface TimeSlot {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  timeSlotId: string;
  status: 'PENDING' | 'CONFIRMED' | 'AWAITING_PAYMENT' | 'COMPLETED' | 'CANCELED';
  notes?: string;
  diagnosis?: string;
  totalAmount: number;
  createdAt: string;
  doctor?: {
    id: string;
    userId: string;
    name: string;
    specialty: Specialty;
    clinic?: Pick<Clinic, 'id' | 'name' | 'address'> | null;
    experienceYears: number;
    consultationFee: number;
    status: 'PENDING' | 'ACTIVE' | 'REJECTED';
  };
  patient?: User;
  timeSlot?: TimeSlot;
  services?: AppointmentService[];
  review?: Review;
}

export interface AppointmentService {
  id: string;
  serviceId: string;
  service: Service;
  price: number;
}

export interface Review {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  patient?: User;
}

export interface Payment {
  id: string;
  appointmentId: string;
  amount: number;
  method: 'CASH' | 'VNPAY' | 'MOMO';
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
}

export interface HealthMetric {
  id: string;
  type: 'BLOOD_PRESSURE_SYSTOLIC' | 'BLOOD_PRESSURE_DIASTOLIC' | 'WEIGHT' | 'HEIGHT' | 'BLOOD_SUGAR' | 'HEART_RATE';
  value: number;
  recordedAt: string;
}

export interface HealthAlert {
  id: string;
  metricType: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isRead: boolean;
  createdAt: string;
}

export interface Prescription {
  id: string;
  imageUrl: string;
  ocrData?: OcrResult;
  createdAt: string;
}

export interface OcrResult {
  medicines: {
    name: string;
    dosage: string;
    quantity: string;
    frequency: string;
  }[];
  rawText?: string;
}

export interface MedicineReminder {
  id: string;
  medicineName: string;
  dosage: string;
  times: string[];
  isActive: boolean;
  startDate: string;
  endDate?: string;
}

export interface ChatSession {
  id: string;
  title?: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
