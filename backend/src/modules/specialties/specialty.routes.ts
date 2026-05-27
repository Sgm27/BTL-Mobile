import { Router } from 'express';
import { getSpecialties } from './specialty.controller';

export const specialtyRouter = Router();

specialtyRouter.get('/', getSpecialties);
