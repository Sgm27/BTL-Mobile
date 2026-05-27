import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { UsersController } from './users.controller';

export const usersRoutes = Router();

usersRoutes.use(authenticate);
usersRoutes.get('/me', UsersController.getCurrentUser);
usersRoutes.put('/me', UsersController.updateCurrentUser);
