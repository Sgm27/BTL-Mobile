import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import { AiService } from './ai.service';
import { HealthService } from '../health/health.service';
import {
  sendMessageSchema,
  getSessionMessagesSchema,
  extractSymptomsSchema,
} from './ai.schemas';

export class AiController {
  static async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { body } = sendMessageSchema.parse({ body: req.body });
      const userId = req.user!.userId;
      const data = await AiService.sendChatMessage(userId, body.sessionId, body.message);
      sendSuccess(res, data, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const data = await AiService.getChatSessions(userId);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async getSessionMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { params } = getSessionMessagesSchema.parse({ params: req.params });
      const userId = req.user!.userId;
      const data = await AiService.getSessionMessages(userId, params.id);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async extractSymptoms(req: Request, res: Response, next: NextFunction) {
    try {
      const { body } = extractSymptomsSchema.parse({ body: req.body });
      const data = await AiService.extractSymptoms(body.text);
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
