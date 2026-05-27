import { Clinic, Doctor, DoctorService, Service, Specialty, TimeSlot, User } from '@prisma/client';

export interface DoctorServiceDto {
  id: string;
  serviceId: string;
  name: string;
  price: number;
  category: string | null;
}

export interface DoctorListItemDto {
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
  } | null;
  experienceYears: number;
  consultationFee: number;
  status: Doctor['status'];
  averageRating: number;
  totalReviews: number;
}

export interface DoctorDetailDto extends DoctorListItemDto {
  bio: string | null;
  licenseNumber: string | null;
  doctorServices: DoctorServiceDto[];
}

export interface DoctorSlotDto {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

type DoctorWithRelations = Doctor & {
  user: Pick<User, 'name'>;
  specialty: Pick<Specialty, 'id' | 'name'>;
  clinic: Pick<Clinic, 'id' | 'name'> | null;
};

type DoctorWithServices = Doctor & {
  user: Pick<User, 'name'>;
  specialty: Pick<Specialty, 'id' | 'name'>;
  clinic: Pick<Clinic, 'id' | 'name'> | null;
  doctorServices: (DoctorService & {
    service: Pick<Service, 'name' | 'category'>;
  })[];
};

export function mapDoctorToListItemDto(doctor: DoctorWithRelations): DoctorListItemDto {
  return {
    id: doctor.id,
    userId: doctor.userId,
    name: doctor.user.name,
    specialty: {
      id: doctor.specialty.id,
      name: doctor.specialty.name,
    },
    clinic: doctor.clinic
      ? {
          id: doctor.clinic.id,
          name: doctor.clinic.name,
        }
      : null,
    experienceYears: doctor.experienceYears,
    consultationFee: Number(doctor.consultationFee),
    status: doctor.status,
    averageRating: 0,
    totalReviews: 0,
  };
}

export function mapDoctorToDetailDto(doctor: DoctorWithServices, metrics: { averageRating: number; totalReviews: number }): DoctorDetailDto {
  return {
    ...mapDoctorToListItemDto(doctor as unknown as DoctorWithRelations),
    averageRating: metrics.averageRating,
    totalReviews: metrics.totalReviews,
    bio: doctor.bio,
    licenseNumber: doctor.licenseNumber,
    doctorServices: doctor.doctorServices.map((doctorService) => ({
      id: doctorService.id,
      serviceId: doctorService.serviceId,
      name: doctorService.service.name,
      price: Number(doctorService.price),
      category: doctorService.service.category,
    })),
  };
}

export function mapTimeSlotToDto(timeSlot: TimeSlot): DoctorSlotDto {
  return {
    id: timeSlot.id,
    date: timeSlot.date.toISOString(),
    startTime: timeSlot.startTime,
    endTime: timeSlot.endTime,
    isBooked: timeSlot.isBooked,
  };
}
