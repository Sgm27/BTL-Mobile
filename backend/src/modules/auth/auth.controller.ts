import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import { AuthService } from './auth.service';
import { loginSchema, refreshTokenSchema, registerSchema } from './auth.dto';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { body } = registerSchema.parse({ body: req.body });
      const data = await AuthService.register(body);
      sendSuccess(res, data, 201);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { body } = loginSchema.parse({ body: req.body });
      const data = await AuthService.login(body);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { body } = refreshTokenSchema.parse({ body: req.body });
      const data = await AuthService.refresh(body);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }
}
