import { api, extractData } from './api';

export type NotificationType =
  | 'APPOINTMENT_REMINDER'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELED'
  | 'MEDICINE_REMINDER'
  | 'HEALTH_ALERT'
  | 'SYSTEM';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export async function getMyNotifications(params?: {
  page?: number;
  limit?: number;
}): Promise<Notification[]> {
  const response = await api.get('/notifications/me', { params });
  return extractData<Notification[]>(response);
}

export async function markAsRead(notificationId: string): Promise<Notification> {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return extractData<Notification>(response);
}

export async function markAllAsRead(): Promise<{ updated: number }> {
  const response = await api.put('/notifications/read-all');
  return extractData<{ updated: number }>(response);
}
