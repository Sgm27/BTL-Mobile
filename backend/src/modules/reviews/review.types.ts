import { Role } from '@prisma/client';

export interface CreateReviewInput {
  appointmentId: string;
  rating: number;
  comment?: string;
}

export interface ReviewUserContext {
  userId: string;
  role: Role;
}

export interface ReviewDto {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  patient: {
    id: string;
    email: string;
    name: string;
  };
  doctor: {
    id: string;
    userId: string;
    name: string;
  };
}
