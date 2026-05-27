import { NextFunction, Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/api-response';
import { NotificationService } from './notification.service';
import {
  getNotificationsQuerySchema,
  markAsReadParamsSchema,
} from './notification.schemas';

export class NotificationController {
  static async getMyNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = getNotificationsQuerySchema.parse({ query: req.query });
      const { notifications, meta } = await NotificationService.getMyNotifications(
        req.user!.userId,
        query
      );
      sendSuccess(res, notifications, 200, meta);
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { params } = markAsReadParamsSchema.parse({ params: req.params });
      const data = await NotificationService.markAsRead(req.user!.userId, params.id);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await NotificationService.markAllAsRead(req.user!.userId);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }
}
