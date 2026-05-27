import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import { AppError } from '../../utils/app-error';
import { UsersService } from './users.service';
import { updateCurrentUserSchema } from './users.dto';

export class UsersController {
  static async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }

      const data = await UsersService.getCurrentUser(req.user.userId);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async updateCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }

      const { body } = updateCurrentUserSchema.parse({ body: req.body });
      const data = await UsersService.updateCurrentUser(req.user.userId, body);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }
}
