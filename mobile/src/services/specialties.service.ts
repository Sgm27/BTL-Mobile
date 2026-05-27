import { api, extractData } from './api';
import type { Specialty, Clinic } from '../types';

export async function getSpecialties(): Promise<Specialty[]> {
  const response = await api.get('/specialties');
  return extractData<Specialty[]>(response);
}

export async function getClinics(): Promise<Clinic[]> {
  const response = await api.get('/clinics');
  return extractData<Clinic[]>(response);
}
