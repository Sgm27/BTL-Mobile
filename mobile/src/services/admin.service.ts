import { api, extractData } from './api';
import type { Doctor, Clinic, Specialty, Service } from '../types';

// ── Types ──────────────────────────────────────────────────

export interface DashboardData {
  totalPatients: number;
  totalDoctors: number;
  appointmentsThisMonth: number;
  revenueThisMonth: number;
  cancelRate: number;
  topDoctors: { doctorId: string; name: string; appointmentCount: number }[];
}

export interface AdminDoctor {
  id: string;
  userId: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
  experienceYears: number;
  bio?: string | null;
  licenseNumber?: string | null;
  consultationFee: number;
  rejectionReason?: string | null;
  user: { id: string; name: string; email: string; phone?: string | null; avatarUrl?: string | null };
  specialty: { id: string; name: string };
  clinic?: { id: string; name: string } | null;
}

// ── Dashboard ──────────────────────────────────────────────

export async function fetchDashboard(): Promise<DashboardData> {
  const res = await api.get('/admin/dashboard');
  return extractData<DashboardData>(res);
}

// ── Doctors ────────────────────────────────────────────────

export async function fetchAdminDoctors(status?: string): Promise<AdminDoctor[]> {
  const res = await api.get('/admin/doctors', { params: status ? { status } : {} });
  return extractData<AdminDoctor[]>(res);
}

export async function approveDoctorApi(id: string) {
  const res = await api.put(`/admin/doctors/${id}/approve`);
  return extractData(res);
}

export async function rejectDoctorApi(id: string, reason: string) {
  const res = await api.put(`/admin/doctors/${id}/reject`, { reason });
  return extractData(res);
}

// ── Clinics ────────────────────────────────────────────────

export async function fetchAdminClinics(): Promise<Clinic[]> {
  const res = await api.get('/admin/clinics');
  return extractData<Clinic[]>(res);
}

export async function createClinicApi(data: Partial<Clinic>) {
  const res = await api.post('/admin/clinics', data);
  return extractData(res);
}

export async function updateClinicApi(id: string, data: Partial<Clinic>) {
  const res = await api.put(`/admin/clinics/${id}`, data);
  return extractData(res);
}

export async function deleteClinicApi(id: string) {
  const res = await api.delete(`/admin/clinics/${id}`);
  return extractData(res);
}

// ── Specialties ────────────────────────────────────────────

export async function createSpecialtyApi(data: Partial<Specialty>) {
  const res = await api.post('/admin/specialties', data);
  return extractData(res);
}

export async function updateSpecialtyApi(id: string, data: Partial<Specialty>) {
  const res = await api.put(`/admin/specialties/${id}`, data);
  return extractData(res);
}

// ── Services ───────────────────────────────────────────────

export async function fetchAdminServices(): Promise<Service[]> {
  const res = await api.get('/admin/services');
  return extractData<Service[]>(res);
}

export async function createServiceApi(data: Partial<Service>) {
  const res = await api.post('/admin/services', data);
  return extractData(res);
}

export async function updateServiceApi(id: string, data: Partial<Service>) {
  const res = await api.put(`/admin/services/${id}`, data);
  return extractData(res);
}

export async function deleteServiceApi(id: string) {
  const res = await api.delete(`/admin/services/${id}`);
  return extractData(res);
}

// ── Work Schedules ─────────────────────────────────────────

export async function generateWorkSchedulesApi(year: number, month: number) {
  const res = await api.post('/admin/work-schedules', { year, month });
  return extractData<{ created: number; total: number }>(res);
}
