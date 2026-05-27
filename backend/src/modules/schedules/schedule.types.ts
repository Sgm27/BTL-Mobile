import { Role, Shift } from '@prisma/client';

export interface RegisterDoctorScheduleInput {
  workScheduleIds?: string[];
  date?: string;
  shift?: Shift;
  startTime?: string;
  endTime?: string;
  room?: string;
}

export interface ScheduleUserContext {
  userId: string;
  role: Role;
}

export interface DoctorScheduleDto {
  id: string;
  room: string | null;
  workSchedule: {
    id: string;
    date: string;
    shift: Shift;
    startTime: string;
    endTime: string;
    createdAt: string;
  };
}
