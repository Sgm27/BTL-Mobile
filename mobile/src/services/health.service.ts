import { api, extractData } from './api';

export interface HealthMetric {
  id: string;
  userId: string;
  type: HealthMetricType;
  value: string; // Decimal comes as string from API
  recordedAt: string;
}

export type HealthMetricType =
  | 'BLOOD_PRESSURE_SYSTOLIC'
  | 'BLOOD_PRESSURE_DIASTOLIC'
  | 'WEIGHT'
  | 'HEIGHT'
  | 'BLOOD_SUGAR'
  | 'HEART_RATE';

export interface HealthAlert {
  id: string;
  userId: string;
  metricType: HealthMetricType;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isRead: boolean;
  createdAt: string;
}

export interface HealthTip {
  title: string;
  tip: string;
  icon: 'heart' | 'food' | 'exercise' | 'water' | 'sleep';
}

export async function recordMetric(input: {
  type: HealthMetricType;
  value: number;
}): Promise<HealthMetric> {
  const response = await api.post('/health-metrics', input);
  return extractData<HealthMetric>(response);
}

export async function getMyMetrics(params?: {
  type?: HealthMetricType;
  from?: string;
  to?: string;
}): Promise<HealthMetric[]> {
  const response = await api.get('/health-metrics/me', { params });
  return extractData<HealthMetric[]>(response);
}

export async function getMyAlerts(): Promise<HealthAlert[]> {
  const response = await api.get('/health-metrics/alerts/me');
  return extractData<HealthAlert[]>(response);
}

export async function analyzeMetrics(): Promise<HealthAlert[]> {
  const response = await api.post('/health-metrics/analyze');
  return extractData<HealthAlert[]>(response);
}

export async function getHealthTips(): Promise<HealthTip[]> {
  const response = await api.get('/ai/health-tips');
  return extractData<HealthTip[]>(response);
}
