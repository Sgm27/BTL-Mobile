import { NextFunction, Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/api-response';
import { PrescriptionService } from './prescription.service';
import {
  savePrescriptionSchema,
  getPrescriptionsQuerySchema,
} from './prescription.schemas';

export class PrescriptionController {
  static async ocrPrescription(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file) {
        sendError(res, 'BAD_REQUEST', 'Image file is required', 400);
        return;
      }

      const result = await PrescriptionService.ocrPrescription(file.buffer);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async savePrescription(req: Request, res: Response, next: NextFunction) {
    try {
      const { body } = savePrescriptionSchema.parse({ body: req.body });
      const data = await PrescriptionService.savePrescription(req.user!.userId, body);
      sendSuccess(res, data, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getMyPrescriptions(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = getPrescriptionsQuerySchema.parse({ query: req.query });
      const { prescriptions, meta } = await PrescriptionService.getMyPrescriptions(
        req.user!.userId,
        query
      );
      sendSuccess(res, prescriptions, 200, meta);
    } catch (error) {
      next(error);
    }
  }
}
