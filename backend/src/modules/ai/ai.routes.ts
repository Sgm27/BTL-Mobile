import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { AiController } from './ai.controller';

export const aiRoutes = Router();

aiRoutes.use(authenticate);

aiRoutes.post('/chat', AiController.sendMessage);
aiRoutes.get('/chat/sessions', AiController.getSessions);
aiRoutes.get('/chat/sessions/:id', AiController.getSessionMessages);
aiRoutes.post('/symptoms', AiController.extractSymptoms);
aiRoutes.get('/health-tips', AiController.getHealthTips);
