import { Router, RequestHandler } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { NotificationController } from './notification.controller';

const asyncHandler = (handler: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

export const notificationRoutes = Router();

// GET /notifications/me — my notifications
notificationRoutes.get(
  '/me',
  authenticate,
  asyncHandler(NotificationController.getMyNotifications)
);

// PUT /notifications/read-all — mark all as read (must be before /:id)
notificationRoutes.put(
  '/read-all',
  authenticate,
  asyncHandler(NotificationController.markAllAsRead)
);

// PUT /notifications/:id/read — mark single as read
notificationRoutes.put(
  '/:id/read',
  authenticate,
  asyncHandler(NotificationController.markAsRead)
);
