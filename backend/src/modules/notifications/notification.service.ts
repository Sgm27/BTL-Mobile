import { NotificationType } from '@prisma/client';
import { prisma } from '../../config/database';
import type { GetNotificationsQuery } from './notification.schemas';

export class NotificationService {
  static async getMyNotifications(userId: string, query: GetNotificationsQuery) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return {
      notifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { updated: result.count };
  }

  /**
   * Helper to create a notification — used by other services
   * (e.g., appointment confirmation, medicine reminders, health alerts)
   */
  static async createNotification(
    userId: string,
    title: string,
    body: string,
    type: NotificationType,
    data?: Record<string, unknown>
  ) {
    return prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type,
        data: (data ?? undefined) as unknown as import('@prisma/client').Prisma.InputJsonValue | undefined,
      },
    });
  }
}
