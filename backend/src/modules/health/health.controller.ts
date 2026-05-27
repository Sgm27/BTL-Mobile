import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import { HealthService } from './health.service';
import { recordMetricSchema, getMetricsQuerySchema } from './health.schemas';

export class HealthController {
  static async recordMetric(req: Request, res: Response, next: NextFunction) {
    try {
      const { body } = recordMetricSchema.parse({ body: req.body });
      const data = await HealthService.recordMetric(req.user!.userId, body);
      sendSuccess(res, data, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = getMetricsQuerySchema.parse({ query: req.query });
      const data = await HealthService.getMetrics(req.user!.userId, query);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async getAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HealthService.getAlerts(req.user!.userId);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async analyzeMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HealthService.checkAnomalies(req.user!.userId);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async getHealthTips(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HealthService.getHealthTips(req.user!.userId);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }
}
