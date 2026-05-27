import { Router } from 'express';
import { getClinicDetail, getClinics } from './clinic.controller';

export const clinicRouter = Router();

clinicRouter.get('/', getClinics);
clinicRouter.get('/:id', getClinicDetail);
