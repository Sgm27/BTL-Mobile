import { Router, RequestHandler } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { HealthController } from './health.controller';

const asyncHandler = (handler: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

export const healthMetricsRouter = Router();

// Health metrics routes — mounted at /api/v1/health-metrics
healthMetricsRouter.post('/', authenticate, asyncHandler(HealthController.recordMetric));
healthMetricsRouter.get('/me', authenticate, asyncHandler(HealthController.getMetrics));
healthMetricsRouter.post('/analyze', authenticate, asyncHandler(HealthController.analyzeMetrics));
healthMetricsRouter.get('/alerts/me', authenticate, asyncHandler(HealthController.getAlerts));
