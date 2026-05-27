import { Router } from 'express';
import {
  getDoctorDetail,
  getDoctorReviewsList,
  getDoctorSlots,
  getDoctors,
} from './doctor.controller';

export const doctorRouter = Router();

doctorRouter.get('/', getDoctors);
doctorRouter.get('/:id', getDoctorDetail);
doctorRouter.get('/:id/slots', getDoctorSlots);
doctorRouter.get('/:id/reviews', getDoctorReviewsList);
