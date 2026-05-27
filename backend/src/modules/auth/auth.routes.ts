import { Router } from 'express';
import { AuthController } from './auth.controller';

export const authRoutes = Router();

authRoutes.post('/register', AuthController.register);
authRoutes.post('/login', AuthController.login);
authRoutes.post('/refresh', AuthController.refresh);
